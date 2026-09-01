import crypto from "node:crypto";
import { config } from "./config.js";
import { query, queryOne } from "./db.js";

const COOKIE = "curialy_admin";

/**
 * Constant-time check against the scrypt hash from the environment.
 * Format is `scrypt:<salt-hex>:<hash-hex>` — colon-separated rather than the
 * conventional `$`, so the value stays safe to source in a shell.
 */
export function verifyPassword(password) {
  const [scheme, saltHex, hashHex] = String(config.adminPasswordHash).split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) {
    throw new Error("ADMIN_PASSWORD_HASH is malformed");
  }
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(String(password ?? ""), Buffer.from(saltHex, "hex"), expected.length, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return crypto.timingSafeEqual(expected, actual);
}

export async function createSession(ip) {
  const token = crypto.randomBytes(24).toString("hex");
  await query(
    `INSERT INTO admin_sessions (token, expires_at, ip)
     VALUES (?, (NOW() + INTERVAL ? HOUR), ?)`,
    [token, config.sessionTtlHours, ip ?? null],
  );
  return token;
}

export async function destroySession(token) {
  if (token) await query("DELETE FROM admin_sessions WHERE token = ?", [token]);
}

async function activeSession(token) {
  if (!token) return null;
  await query("DELETE FROM admin_sessions WHERE expires_at < NOW()");
  return queryOne("SELECT token FROM admin_sessions WHERE token = ? AND expires_at > NOW()", [
    token,
  ]);
}

export function readCookie(req) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function setCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${
      config.sessionTtlHours * 3600
    }`,
  );
}

export function clearCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
}

/** True when the request carries a live session cookie. */
export async function isAuthenticated(req) {
  return Boolean(await activeSession(readCookie(req)));
}

/** Express middleware: 401s anything without a live session cookie. */
export async function requireAdmin(req, res, next) {
  const session = await activeSession(readCookie(req));
  if (!session) {
    res.status(401).json({ error: "Not signed in." });
    return;
  }
  req.adminToken = session.token;
  next();
}
