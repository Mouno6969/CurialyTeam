// Stress-renders the receipt against the shapes most likely to break the
// layout: several line items, a maximum-length admin note, and a real DB row.
// Usage: node scripts/stress-receipt.js
import fs from "node:fs";
import { renderReceipt } from "../src/receipt.js";

const base = {
  order_code: "CLY-ZZ99WW88",
  x_handle: "a_very_long_handle_x",
  total_usd: "123.00",
  network: "polygon",
  coin: "USDT",
  expected_amount: "123.00",
  settlement_address: "0xb94a707D215Eb8d480E7acC15c831ACC57BA1e25",
  tx_hash: "0x9f2c4b7a1e8d5f3c6b0a9d8e7f6c5b4a3d2e1f0c9b8a7d6e5f4c3b2a1d0e9f8c",
  status: "completed",
  created_at: new Date(),
  submitted_at: new Date(),
  completed_at: new Date(),
};

const cases = {
  "many-items": {
    ...base,
    basket_summary: "six lines",
    items: JSON.stringify(
      Array.from({ length: 6 }, (_, i) => ({
        productName: i % 2 ? "Google AI" : "X Premium",
        planLabel: `${i + 1} months`,
        quantity: i + 1,
        lineTotal: (i + 1) * 3,
      })),
    ),
    admin_note: null,
  },
  "long-note": {
    ...base,
    basket_summary: "X Premium · 3 months × 1",
    items: JSON.stringify([
      { productName: "X Premium", planLabel: "3 months", quantity: 1, lineTotal: 3 },
    ]),
    // 500 chars is the server-side cap on admin notes.
    admin_note: "N".padEnd(120, " verified against the explorer and matched") .slice(0, 500),
  },
  "worst-case": {
    ...base,
    basket_summary: "everything at once",
    items: JSON.stringify(
      Array.from({ length: 12 }, (_, i) => ({
        productName: "X Premium Extended Subscription",
        planLabel: `${i + 1} months`,
        quantity: 20,
        lineTotal: 60,
      })),
    ),
    admin_note:
      "Delivered after manual explorer verification of the inbound transfer; the amount, asset, and destination all matched the quote frozen onto this order at the time the network was chosen. ".repeat(
        2,
      ).slice(0, 500),
  },
};

for (const [name, order] of Object.entries(cases)) {
  const png = await renderReceipt(order);
  const out = `/tmp/stress-${name}.png`;
  fs.writeFileSync(out, png);
  console.log(`${out}  ${png.length} bytes`);
}
