// Telegram admin channel.
//
// The bot only ever talks to the configured admin chat: every incoming update
// is checked against TELEGRAM_ADMIN_CHAT_ID before anything is acted on, so a
// stranger who finds @Curialybot cannot read orders or change a status.

import { config, ADMIN_SETTABLE, STATUS_LABELS } from "./config.js";
import { getByCode, listOrders, countByStatus, setStatus } from "./orders.js";
import { renderReceipt, verifyUrl } from "./receipt.js";

const API = `https://api.telegram.org/bot${config.telegram.token}`;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function call(method, payload) {
  try {
    const response = await fetch(`${API}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
    });
    const body = await response.json();
    if (!body.ok) console.error(`telegram ${method} failed:`, body.description);
    return body;
  } catch (error) {
    console.error(`telegram ${method} error:`, error.message);
    return { ok: false, description: error.message };
  }
}

async function sendPhoto(chatId, png, filename, caption, replyMarkup) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("photo", new Blob([png], { type: "image/png" }), filename);
  if (caption) {
    form.append("caption", caption);
    form.append("parse_mode", "HTML");
  }
  if (replyMarkup) form.append("reply_markup", JSON.stringify(replyMarkup));
  try {
    const response = await fetch(`${API}/sendPhoto`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(30_000),
    });
    const body = await response.json();
    if (!body.ok) console.error("telegram sendPhoto failed:", body.description);
    return body;
  } catch (error) {
    console.error("telegram sendPhoto error:", error.message);
    return { ok: false, description: error.message };
  }
}

export function send(text, replyMarkup, chatId = config.telegram.adminChatId) {
  return call("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

/** Status buttons for one order, omitting the status it is already in. */
function statusKeyboard(order) {
  const buttons = [
    { status: "completed", label: "✅ Complete" },
    { status: "confirming", label: "🔎 Confirming" },
    { status: "rejected", label: "❌ Reject" },
  ]
    .filter((button) => button.status !== order.status)
    .map((button) => ({
      text: button.label,
      callback_data: `st:${button.status}:${order.order_code}`,
    }));

  return {
    inline_keyboard: [
      buttons,
      [
        { text: "🧾 Receipt", callback_data: `rc:${order.order_code}` },
        { text: "🌐 Open", url: verifyUrl(order) },
      ],
    ],
  };
}

function orderSummary(order, heading) {
  const lines = [
    heading,
    "",
    `<b>Order</b> <code>${escapeHtml(order.order_code)}</code>`,
    `<b>Status</b> ${escapeHtml(STATUS_LABELS[order.status] || order.status)}`,
    `<b>Items</b> ${escapeHtml(order.basket_summary)}`,
    `<b>Total</b> $${Number(order.total_usd).toFixed(2)} USD`,
    `<b>X handle</b> ${order.x_handle ? "@" + escapeHtml(order.x_handle) : "not provided"}`,
  ];
  if (order.network && order.coin) {
    lines.push(
      `<b>Paid with</b> ${escapeHtml(order.expected_amount)} ${escapeHtml(order.coin)} on ${escapeHtml(order.network)}`,
    );
  }
  if (order.tx_hash) lines.push(`<b>Tx</b> <code>${escapeHtml(order.tx_hash)}</code>`);
  if (order.admin_note) lines.push(`<b>Note</b> ${escapeHtml(order.admin_note)}`);
  return lines.join("\n");
}

/** Fired when a customer submits a payment hash. */
export async function notifyNewOrder(order) {
  const caption = orderSummary(order, "🔔 <b>New pending order</b>");
  try {
    const png = await renderReceipt(order);
    const result = await sendPhoto(
      config.telegram.adminChatId,
      png,
      `receipt-${order.order_code}.png`,
      caption,
      statusKeyboard(order),
    );
    if (result.ok) return result;
  } catch (error) {
    console.error("receipt render for telegram failed:", error.message);
  }
  // Never let a rendering problem swallow the notification itself.
  return send(caption, statusKeyboard(order));
}

export async function sendReceipt(order, chatId = config.telegram.adminChatId) {
  const png = await renderReceipt(order);
  return sendPhoto(
    chatId,
    png,
    `receipt-${order.order_code}.png`,
    orderSummary(order, "🧾 <b>Receipt</b>"),
    statusKeyboard(order),
  );
}

async function sendPendingList(chatId) {
  const pending = await listOrders({ status: "pending", limit: 10 });
  if (pending.length === 0) {
    await send("No pending orders right now.", undefined, chatId);
    return;
  }
  await send(
    `<b>${pending.length} pending order${pending.length === 1 ? "" : "s"}</b>`,
    undefined,
    chatId,
  );
  for (const order of pending) {
    await send(orderSummary(order, "⏳ <b>Pending</b>"), statusKeyboard(order), chatId);
  }
}

const HELP = [
  "<b>Curialy order bot</b>",
  "",
  "/pending — list orders awaiting review",
  "/order &lt;code&gt; — look up one order",
  "/stats — counts by status",
  "",
  "Every new pending order arrives here automatically with its receipt.",
  "Use the buttons to complete, reject, or mark an order as confirming.",
].join("\n");

/**
 * Handles one webhook update. Returns quietly for anything from a chat other
 * than the admin, and never throws: Telegram retries on a non-2xx response.
 */
export async function handleUpdate(update) {
  try {
    if (update.callback_query) return await handleCallback(update.callback_query);
    if (update.message?.text) return await handleMessage(update.message);
  } catch (error) {
    console.error("telegram update failed:", error);
  }
}

function isAdmin(chatId) {
  return String(chatId) === String(config.telegram.adminChatId);
}

async function handleMessage(message) {
  const chatId = message.chat?.id;
  if (!isAdmin(chatId)) {
    await send(
      "This bot only serves the Curialy operator. For help with an order, contact @Curialy.",
      undefined,
      chatId,
    );
    return;
  }

  const text = message.text.trim();
  const [rawCommand, ...args] = text.split(/\s+/);
  const command = rawCommand.toLowerCase().replace(/@.*$/, "");

  if (command === "/pending") return sendPendingList(chatId);
  if (command === "/stats") {
    const counts = await countByStatus();
    const body = counts.length
      ? counts.map((row) => `${STATUS_LABELS[row.status] || row.status}: <b>${row.n}</b>`).join("\n")
      : "No orders yet.";
    return send(`<b>Orders by status</b>\n\n${body}`, undefined, chatId);
  }
  if (command === "/order") {
    const order = await getByCode(args[0]);
    if (!order) return send("No order with that code.", undefined, chatId);
    return send(orderSummary(order, "🔎 <b>Order</b>"), statusKeyboard(order), chatId);
  }
  return send(HELP, undefined, chatId);
}

async function handleCallback(callback) {
  const chatId = callback.message?.chat?.id;
  const answer = (text) =>
    call("answerCallbackQuery", { callback_query_id: callback.id, text, show_alert: false });

  if (!isAdmin(chatId)) return answer("Not permitted.");

  const data = String(callback.data || "");

  if (data.startsWith("rc:")) {
    const order = await getByCode(data.slice(3));
    if (!order) return answer("Order not found.");
    await answer("Sending receipt…");
    return sendReceipt(order, chatId);
  }

  if (data.startsWith("st:")) {
    const [, status, code] = data.split(":");
    if (!ADMIN_SETTABLE.includes(status)) return answer("Unknown status.");
    const order = await getByCode(code);
    if (!order) return answer("Order not found.");
    if (order.status === status) return answer(`Already ${STATUS_LABELS[status]}.`);

    const updated = await setStatus(order, status, "admin_telegram");
    await answer(`Set to ${STATUS_LABELS[status]}.`);
    // Replace the buttons on the original message so the new state is obvious.
    await call("editMessageReplyMarkup", {
      chat_id: chatId,
      message_id: callback.message.message_id,
      reply_markup: statusKeyboard(updated),
    });
    return send(
      orderSummary(updated, `✏️ <b>Status changed to ${STATUS_LABELS[status]}</b>`),
      undefined,
      chatId,
    );
  }

  return answer("Unrecognised action.");
}

export async function setWebhook() {
  const url = `${config.publicBaseUrl}/api/telegram/webhook`;
  const result = await call("setWebhook", {
    url,
    secret_token: config.telegram.webhookSecret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
  return { url, result };
}
