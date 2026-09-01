import crypto from "node:crypto";
import { query, queryOne, transaction } from "./db.js";
import { config } from "./config.js";
import {
  NETWORKS,
  SETTLEMENT_ADDRESSES,
  badRequest,
  expectedAmount,
  priceItems,
} from "./catalog.js";

// Crockford base32: no I, L, O or U, so a code read off a printed receipt
// cannot be mistyped into a different valid code.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function randomCode() {
  const bytes = crypto.randomBytes(8);
  let out = "";
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return `CLY-${out}`;
}

/** Accepts what a customer might type: lowercase, spaces, missing prefix. */
export function normalizeCode(input) {
  const cleaned = String(input ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (!cleaned) return null;
  const body = cleaned.startsWith("CLY") ? cleaned.slice(3) : cleaned;
  if (body.length !== 8) return null;
  if (![...body].every((char) => ALPHABET.includes(char))) return null;
  return `CLY-${body}`;
}

export async function createOrder({ items: rawItems, xHandle }) {
  const { items, totalUsd, summary, requiresXHandle } = priceItems(rawItems);

  const handle = String(xHandle ?? "").trim().replace(/^@+/, "");
  if (requiresXHandle && !handle) {
    throw badRequest("An X handle is required for this order.");
  }
  if (handle && !/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
    throw badRequest("That X handle does not look valid.");
  }

  return transaction(async (conn) => {
    // Retry on the vanishingly unlikely code collision rather than failing.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = randomCode();
      const token = crypto.randomBytes(16).toString("hex");
      try {
        const [result] = await conn.execute(
          `INSERT INTO orders
             (order_code, receipt_token, x_handle, items, basket_summary, total_usd, status)
           VALUES (?, ?, ?, ?, ?, ?, 'awaiting_payment')`,
          [code, token, handle || null, JSON.stringify(items), summary, totalUsd.toFixed(2)],
        );
        await conn.execute(
          `INSERT INTO order_events (order_id, from_status, to_status, actor, note)
           VALUES (?, NULL, 'awaiting_payment', 'customer', 'Order created')`,
          [result.insertId],
        );
        const [rows] = await conn.execute("SELECT * FROM orders WHERE id = ?", [result.insertId]);
        return rows[0];
      } catch (error) {
        if (error.code !== "ER_DUP_ENTRY") throw error;
      }
    }
    throw new Error("Could not allocate an order code");
  });
}

export async function getByCode(code) {
  const normalized = normalizeCode(code);
  if (!normalized) return null;
  return queryOne("SELECT * FROM orders WHERE order_code = ?", [normalized]);
}

export async function getEvents(orderId) {
  return query(
    `SELECT to_status, actor, note, created_at
       FROM order_events WHERE order_id = ? ORDER BY id ASC`,
    [orderId],
  );
}

/** Records the chosen chain and coin, freezing the quote onto the order. */
export async function selectPaymentMethod(order, network, coin) {
  if (!NETWORKS[network]) throw badRequest("Unknown network.");
  if (!NETWORKS[network].coins.includes(coin)) {
    throw badRequest(`${coin} is not available on ${NETWORKS[network].label}.`);
  }
  if (!["awaiting_payment", "expired"].includes(order.status)) {
    throw badRequest("This order already has a payment on file.");
  }

  const amount = expectedAmount(coin, Number(order.total_usd));
  const address = SETTLEMENT_ADDRESSES[network];

  await query(
    `UPDATE orders
        SET network = ?, coin = ?, settlement_address = ?, expected_amount = ?,
            status = 'awaiting_payment'
      WHERE id = ?`,
    [network, coin, address, amount, order.id],
  );
  return getByCode(order.order_code);
}

/**
 * Customer declares they have sent the funds. This is the transition the admin
 * is notified about; it does not assert that anything arrived on chain.
 */
export async function submitPayment(order, txHash) {
  const hash = String(txHash ?? "").trim();
  if (!/^[A-Za-z0-9:_-]{16,160}$/.test(hash)) {
    throw badRequest("That transaction hash does not look valid.");
  }
  if (!order.network || !order.coin) {
    throw badRequest("Choose a network and coin before submitting a hash.");
  }
  if (!["awaiting_payment", "pending", "expired"].includes(order.status)) {
    throw badRequest("This order is no longer awaiting a payment hash.");
  }

  await transaction(async (conn) => {
    await conn.execute(
      `UPDATE orders
          SET tx_hash = ?, status = 'pending', submitted_at = COALESCE(submitted_at, NOW())
        WHERE id = ?`,
      [hash, order.id],
    );
    await conn.execute(
      `INSERT INTO order_events (order_id, from_status, to_status, actor, note)
       VALUES (?, ?, 'pending', 'customer', 'Transaction hash submitted')`,
      [order.id, order.status],
    );
  });
  return getByCode(order.order_code);
}

/** Applies an admin status change and appends the audit event. */
export async function setStatus(order, status, actor, note = null) {
  if (order.status === status && !note) return order;

  await transaction(async (conn) => {
    await conn.execute(
      `UPDATE orders
          SET status = ?,
              admin_note = COALESCE(?, admin_note),
              completed_at = CASE WHEN ? = 'completed' THEN NOW() ELSE completed_at END
        WHERE id = ?`,
      [status, note, status, order.id],
    );
    await conn.execute(
      `INSERT INTO order_events (order_id, from_status, to_status, actor, note)
       VALUES (?, ?, ?, ?, ?)`,
      [order.id, order.status, status, actor, note],
    );
  });
  return getByCode(order.order_code);
}

export async function listOrders({ status, limit = 50 } = {}) {
  const capped = Math.min(Math.max(Number(limit) || 50, 1), 200);
  if (status && status !== "all") {
    return query(
      `SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT ${capped}`,
      [status],
    );
  }
  return query(`SELECT * FROM orders ORDER BY created_at DESC LIMIT ${capped}`);
}

export async function countByStatus() {
  return query("SELECT status, COUNT(*) AS n FROM orders GROUP BY status");
}

/** Marks stale unpaid orders expired. Called on a timer, not per request. */
export async function expireStaleOrders() {
  const stale = await query(
    `SELECT id, order_code, status FROM orders
      WHERE status = 'awaiting_payment'
        AND created_at < (NOW() - INTERVAL ? MINUTE)`,
    [config.orderTtlMinutes],
  );
  for (const row of stale) {
    await query("UPDATE orders SET status = 'expired' WHERE id = ?", [row.id]);
    await query(
      `INSERT INTO order_events (order_id, from_status, to_status, actor, note)
       VALUES (?, ?, 'expired', 'system', 'Expired without a submitted payment')`,
      [row.id, row.status],
    );
  }
  return stale.length;
}

/** The shape handed to the browser. Deliberately omits receipt_token and id. */
export function publicView(order, events = []) {
  return {
    orderCode: order.order_code,
    xHandle: order.x_handle,
    items: typeof order.items === "string" ? JSON.parse(order.items) : order.items,
    basketSummary: order.basket_summary,
    totalUsd: Number(order.total_usd),
    network: order.network,
    coin: order.coin,
    settlementAddress: order.settlement_address,
    expectedAmount: order.expected_amount,
    txHash: order.tx_hash,
    status: order.status,
    adminNote: order.admin_note,
    createdAt: order.created_at,
    submittedAt: order.submitted_at,
    completedAt: order.completed_at,
    expiresAt: new Date(
      new Date(order.created_at).getTime() + config.orderTtlMinutes * 60_000,
    ),
    receiptUrl: `/api/orders/${order.order_code}/receipt.png`,
    events: events.map((event) => ({
      status: event.to_status,
      actor: event.actor,
      note: event.note,
      at: event.created_at,
    })),
  };
}
