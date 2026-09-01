import mysql from "mysql2/promise";
import { config } from "./config.js";

export const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 8,
  queueLimit: 0,
  charset: "utf8mb4",
  // Keeps DECIMAL out of JS floats; total_usd is read back as a string and
  // formatted explicitly.
  decimalNumbers: false,
  timezone: "Z",
});

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

/** Runs `fn` inside a transaction, rolling back on any throw. */
export async function transaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Sliding-window limiter. Counts hits for `bucket` in the last `windowSec` and
 * records this one; returns false once the window is full.
 */
export async function allowHit(bucket, limit, windowSec) {
  await query("DELETE FROM rate_hits WHERE created_at < (NOW() - INTERVAL ? SECOND)", [
    windowSec * 4,
  ]);
  const row = await queryOne(
    "SELECT COUNT(*) AS n FROM rate_hits WHERE bucket = ? AND created_at >= (NOW() - INTERVAL ? SECOND)",
    [bucket, windowSec],
  );
  if (Number(row.n) >= limit) return false;
  await query("INSERT INTO rate_hits (bucket) VALUES (?)", [bucket]);
  return true;
}
