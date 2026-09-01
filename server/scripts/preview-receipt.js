// Renders a sample receipt to /tmp so the layout can be eyeballed without
// creating a real order. Usage: node scripts/preview-receipt.js [status]
import fs from "node:fs";
import { renderReceipt } from "../src/receipt.js";

const status = process.argv[2] || "completed";

const sample = {
  order_code: "CLY-7K3M2QX9",
  x_handle: "mouno_dev",
  basket_summary: "X Premium · 3 months × 1",
  total_usd: "3.00",
  network: "ethereum",
  coin: "USDC",
  expected_amount: "3.00",
  settlement_address: "0xb94a707D215Eb8d480E7acC15c831ACC57BA1e25",
  tx_hash: "0x9f2c4b7a1e8d5f3c6b0a9d8e7f6c5b4a3d2e1f0c9b8a7d6e5f4c3b2a1d0e9f8c",
  status,
  admin_note: status === "rejected" ? "Amount received did not match the quote." : null,
  created_at: new Date(Date.now() - 3600_000),
  submitted_at: new Date(Date.now() - 3000_000),
  completed_at: status === "completed" ? new Date() : null,
};

const png = await renderReceipt(sample);
const out = `/tmp/receipt-${status}.png`;
fs.writeFileSync(out, png);
console.log(`${out}  ${png.length} bytes`);
