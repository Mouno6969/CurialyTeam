import express from "express";
import { config, ADMIN_SETTABLE } from "./config.js";
import { allowHit, pool } from "./db.js";
import { CATALOG, NETWORKS } from "./catalog.js";
import {
  createOrder,
  expireStaleOrders,
  getByCode,
  getEvents,
  listOrders,
  countByStatus,
  publicView,
  selectPaymentMethod,
  setStatus,
  submitPayment,
} from "./orders.js";
import { renderReceipt } from "./receipt.js";
import { handleUpdate, notifyNewOrder } from "./telegram.js";
import {
  clearCookie,
  createSession,
  destroySession,
  isAuthenticated,
  readCookie,
  requireAdmin,
  setCookie,
  verifyPassword,
} from "./admin.js";

const app = express();
// Caddy on loopback is the only client, so its X-Forwarded-For is authoritative.
app.set("trust proxy", true);
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));

const clientIp = (req) => req.ip || req.socket.remoteAddress || "unknown";

/** 429s once the bucket is full. Buckets are per IP and per action. */
async function limit(req, res, action, max, windowSec) {
  const allowed = await allowHit(`${action}:${clientIp(req)}`, max, windowSec);
  if (!allowed) {
    res.status(429).json({ error: "Too many requests. Wait a moment and try again." });
    return false;
  }
  return true;
}

async function loadOrder(req, res) {
  const order = await getByCode(req.params.code);
  if (!order) {
    res.status(404).json({ error: "No order with that code." });
    return null;
  }
  return order;
}

app.get("/api/health", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true, service: "curialy-api" });
});

app.get("/api/catalog", (_req, res) => {
  res.json({
    products: Object.entries(CATALOG).map(([id, product]) => ({
      id,
      name: product.name,
      available: product.available,
      requiresXHandle: product.requiresXHandle,
      plans: Object.entries(product.plans).map(([planId, plan]) => ({ id: planId, ...plan })),
    })),
    networks: Object.entries(NETWORKS).map(([key, network]) => ({ key, ...network })),
  });
});

app.post("/api/orders", async (req, res) => {
  if (!(await limit(req, res, "create", 12, 3600))) return;
  const order = await createOrder({
    items: req.body?.items,
    xHandle: req.body?.xHandle,
  });
  res.status(201).json({ order: publicView(order) });
});

app.get("/api/orders/:code", async (req, res) => {
  if (!(await limit(req, res, "lookup", 40, 600))) return;
  const order = await loadOrder(req, res);
  if (!order) return;
  res.json({ order: publicView(order, await getEvents(order.id)) });
});

app.post("/api/orders/:code/method", async (req, res) => {
  if (!(await limit(req, res, "method", 40, 3600))) return;
  const order = await loadOrder(req, res);
  if (!order) return;
  const updated = await selectPaymentMethod(order, req.body?.network, req.body?.coin);
  res.json({ order: publicView(updated) });
});

app.post("/api/orders/:code/submit", async (req, res) => {
  if (!(await limit(req, res, "submit", 20, 3600))) return;
  const order = await loadOrder(req, res);
  if (!order) return;
  const wasPending = order.status === "pending";
  const updated = await submitPayment(order, req.body?.txHash);
  res.json({ order: publicView(updated, await getEvents(updated.id)) });
  // Notify after responding: the customer should not wait on Telegram, and a
  // Telegram outage must not fail the submission.
  if (!wasPending) void notifyNewOrder(updated);
});

app.get("/api/orders/:code/receipt.png", async (req, res) => {
  if (!(await limit(req, res, "receipt", 40, 600))) return;
  const order = await loadOrder(req, res);
  if (!order) return;
  const png = await renderReceipt(order);
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="curialy-receipt-${order.order_code}.png"`,
  );
  res.end(png);
});

app.post("/api/admin/login", async (req, res) => {
  // Tight limit: this is the only password in the system.
  if (!(await limit(req, res, "login", 8, 900))) return;
  let ok = false;
  try {
    ok = verifyPassword(req.body?.password);
  } catch (error) {
    console.error("password verification failed:", error.message);
  }
  if (!ok) {
    res.status(401).json({ error: "Incorrect password." });
    return;
  }
  const token = await createSession(clientIp(req));
  setCookie(res, token);
  res.json({ authenticated: true });
});

app.post("/api/admin/logout", async (req, res) => {
  await destroySession(readCookie(req));
  clearCookie(res);
  res.json({ authenticated: false });
});

app.get("/api/admin/session", async (req, res) => {
  res.json({ authenticated: await isAuthenticated(req) });
});

app.get("/api/admin/orders", requireAdmin, async (req, res) => {
  const orders = await listOrders({ status: req.query.status, limit: req.query.limit });
  res.json({
    orders: orders.map((order) => publicView(order)),
    counts: await countByStatus(),
  });
});

app.get("/api/admin/orders/:code", requireAdmin, async (req, res) => {
  const order = await loadOrder(req, res);
  if (!order) return;
  res.json({ order: publicView(order, await getEvents(order.id)) });
});

app.post("/api/admin/orders/:code/status", requireAdmin, async (req, res) => {
  const status = String(req.body?.status ?? "");
  if (!ADMIN_SETTABLE.includes(status)) {
    res.status(400).json({ error: `Status must be one of: ${ADMIN_SETTABLE.join(", ")}` });
    return;
  }
  const order = await loadOrder(req, res);
  if (!order) return;
  const note = req.body?.note ? String(req.body.note).slice(0, 500) : null;
  const updated = await setStatus(order, status, "admin_web", note);
  res.json({ order: publicView(updated, await getEvents(updated.id)) });
});

// Telegram calls this. The secret token is set with the webhook and checked on
// every delivery, so the endpoint being public does not make it callable.
app.post("/api/telegram/webhook", async (req, res) => {
  if (req.get("X-Telegram-Bot-Api-Secret-Token") !== config.telegram.webhookSecret) {
    res.status(403).end();
    return;
  }
  // Acknowledge first: Telegram retries anything slow or non-2xx.
  res.status(200).end();
  void handleUpdate(req.body);
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Unknown endpoint." });
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  if (status >= 500) console.error("unhandled:", error);
  res.status(status).json({
    error: status >= 500 ? "Something went wrong on our side." : error.message,
  });
});

const server = app.listen(config.port, config.host, () => {
  console.log(`curialy-api listening on ${config.host}:${config.port}`);
});

// Expire abandoned payment links every five minutes.
const sweeper = setInterval(() => {
  expireStaleOrders().catch((error) => console.error("expiry sweep failed:", error.message));
}, 5 * 60_000);
sweeper.unref();

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    console.log(`${signal} received, shutting down`);
    clearInterval(sweeper);
    server.close(() => pool.end().then(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}



