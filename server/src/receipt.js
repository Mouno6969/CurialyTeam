// Receipt image generator.
//
// One A4 page: letterhead, item table, settlement ledger, verification strip.
// Issued automatically when an order is recorded and again whenever status
// changes. Typography is Curialy's (Instrument Serif / Sans / IBM Plex Mono).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import QRCode from "qrcode";
import bwipjs from "bwip-js/node";
import { config, STATUS_LABELS } from "./config.js";

const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets");

for (const [file, family] of [
  ["fonts/InstrumentSerif-Regular.ttf", "ReceiptSerif"],
  ["fonts/InstrumentSans[wdth,wght].ttf", "ReceiptSans"],
  ["fonts/IBMPlexMono-Regular.ttf", "ReceiptMono"],
  ["fonts/IBMPlexMono-SemiBold.ttf", "ReceiptMonoBold"],
]) {
  const full = path.join(ASSETS, file);
  if (fs.existsSync(full)) GlobalFonts.registerFromPath(full, family);
}

const LOGO_PATH = path.join(ASSETS, "curialy-logo.jpg");

const C = {
  paper: "#f3efe6",
  ink: "#1c1915",
  muted: "#6a6258",
  label: "#5c5349",
  rule: "#d7d0c3",
  ruleStrong: "#b7ae9e",
  gold: "#8c6a3c",
  goldSoft: "rgba(140, 106, 60, 0.22)",
  chip: "#efe8d8",
  white: "#fbf8f1",
};

const STATUS_FILL = {
  completed: { fill: "#234d32", text: "#f4f0e6" },
  pending: { fill: "#8a5a18", text: "#fbf8f1" },
  confirming: { fill: "#2a5274", text: "#fbf8f1" },
  awaiting_payment: { fill: "#6b6258", text: "#fbf8f1" },
  rejected: { fill: "#7a2e24", text: "#fbf8f1" },
  expired: { fill: "#5a5752", text: "#fbf8f1" },
};

const NETWORK_LABELS = { ethereum: "Ethereum", solana: "Solana", polygon: "Polygon" };

// A4 at 144 dpi.
const PAGE_W = 1191;
const PAGE_H = 1684;
const X = 72;
const RIGHT = PAGE_W - 72;
const COL = RIGHT - X;

const BAND_H = 236;
const FOOTER_H = 88;
const QR_SIZE = 108;
const BAR_H = 44;

const serif = (n) => `${n}px ReceiptSerif, serif`;
const sans = (n, w = 400) => `${w} ${n}px ReceiptSans, sans-serif`;
const mono = (n, bold = false) =>
  `${n}px ${bold ? "ReceiptMonoBold" : "ReceiptMono"}, monospace`;

function stamp(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

function shortMiddle(value, head = 10, tail = 8) {
  const text = String(value ?? "");
  if (text.length <= head + tail + 1) return text;
  return `${text.slice(0, head)}…${text.slice(-tail)}`;
}

function money(n) {
  return `$${Number(n).toFixed(2)}`;
}

function line(ctx, y, color = C.rule, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(X, y + 0.5);
  ctx.lineTo(RIGHT, y + 0.5);
  ctx.stroke();
}

function kicker(ctx, text, x, y) {
  ctx.fillStyle = C.label;
  ctx.font = sans(11, 500);
  ctx.letterSpacing = "0.16em";
  ctx.fillText(String(text).toUpperCase(), x, y);
  ctx.letterSpacing = "0";
}

/** Where the QR points: the public status page, pre-filled with the code. */
export function verifyUrl(order) {
  return `${config.publicBaseUrl}/order?code=${encodeURIComponent(order.order_code)}`;
}

function parseItems(order) {
  let items = order.items;
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
  if (Array.isArray(items) && items.length) {
    return items.map((item) => ({
      productName: item.productName || item.name || "Plan",
      planLabel: item.planLabel || item.label || "—",
      quantity: item.quantity ?? 1,
      lineTotal: item.lineTotal ?? Number(item.unitPrice ?? item.price ?? 0) * (item.quantity ?? 1),
    }));
  }
  return [
    {
      productName: String(order.basket_summary || "Order").split("·")[0].trim(),
      planLabel: "—",
      quantity: 1,
      lineTotal: Number(order.total_usd),
    },
  ];
}

async function drawSeal(ctx, x, y, size) {
  ctx.save();
  if (fs.existsSync(LOGO_PATH)) {
    const logo = await loadImage(LOGO_PATH);
    const side = Math.min(logo.width, logo.height);
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(
      logo,
      (logo.width - side) / 2,
      (logo.height - side) / 2,
      side,
      side,
      x,
      y,
      size,
      size,
    );
    ctx.restore();
    ctx.save();
  }
  ctx.strokeStyle = "rgba(28,25,21,0.22)";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 - 0.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

async function buildQr(text, size) {
  const buffer = await QRCode.toBuffer(text, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 1,
    width: size,
    color: { dark: "#1c1915", light: "#fbf8f1" },
  });
  return loadImage(buffer);
}

async function buildBarcode(code) {
  const buffer = await bwipjs.toBuffer({
    bcid: "code128",
    text: code,
    scale: 3,
    height: 10,
    includetext: false,
    backgroundcolor: "FBF8F1",
    barcolor: "1C1915",
    paddingwidth: 0,
    paddingheight: 0,
  });
  return loadImage(buffer);
}

function drawWrapped(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text ?? "").split(/\s+/).filter(Boolean);
  let line = "";
  let cursor = y;
  const flush = () => {
    if (!line) return;
    ctx.fillText(line, x, cursor);
    cursor += lineHeight;
    line = "";
  };
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    flush();
    line = word;
  }
  flush();
  return cursor;
}

/**
 * Renders the receipt for an order row as a PNG buffer.
 * The status chip reflects the order at render time, so the same URL
 * yields PENDING REVIEW before the admin acts and COMPLETED afterwards.
 */
export async function renderReceipt(order) {
  const items = parseItems(order);
  const extraRows = Math.max(0, items.length - 1);
  const noteLines = order.admin_note ? 2 : 0;
  const contentBottom = 780 + extraRows * 36 + noteLines * 22;
  const minForBand = contentBottom + 28 + BAND_H + FOOTER_H + 36;
  const H = Math.max(PAGE_H, minForBand);

  const canvas = createCanvas(PAGE_W, H);
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "top";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, PAGE_W, H);

  ctx.strokeStyle = C.goldSoft;
  ctx.lineWidth = 1;
  ctx.strokeRect(36.5, 36.5, PAGE_W - 73, H - 73);
  ctx.strokeStyle = C.rule;
  ctx.strokeRect(40.5, 40.5, PAGE_W - 81, H - 81);

  await drawSeal(ctx, X, 72, 58);
  ctx.fillStyle = C.ink;
  ctx.font = serif(34);
  ctx.fillText("Curialy", X + 72, 74);
  ctx.fillStyle = C.muted;
  ctx.font = sans(13);
  ctx.fillText("Independent digital subscription store", X + 72, 114);

  ctx.textAlign = "right";
  ctx.fillStyle = C.gold;
  ctx.font = sans(11, 500);
  ctx.letterSpacing = "0.22em";
  ctx.fillText("RECEIPT", RIGHT, 74);
  ctx.letterSpacing = "0";
  ctx.fillStyle = C.ink;
  ctx.font = mono(22, true);
  ctx.fillText(order.order_code, RIGHT, 96);
  ctx.fillStyle = C.muted;
  ctx.font = sans(13);
  ctx.fillText(`Document date  ${stamp(new Date())}`, RIGHT, 128);
  ctx.textAlign = "left";

  line(ctx, 168, C.ruleStrong);

  const statusLabel = STATUS_LABELS[order.status] || String(order.status).toUpperCase();
  const chip = STATUS_FILL[order.status] || STATUS_FILL.pending;
  ctx.font = sans(12, 600);
  const chipW = Math.min(ctx.measureText(statusLabel).width + 24, 280);
  ctx.fillStyle = chip.fill;
  ctx.beginPath();
  ctx.roundRect(RIGHT - chipW, 184, chipW, 26, 3);
  ctx.fill();
  ctx.fillStyle = chip.text;
  ctx.fillText(statusLabel, RIGHT - chipW + 12, 190);

  kicker(ctx, "Issued to", X, 186);
  ctx.fillStyle = C.ink;
  ctx.font = sans(18, 500);
  ctx.fillText(order.x_handle ? `@${order.x_handle}` : "Guest", X, 206);
  ctx.fillStyle = C.muted;
  ctx.font = sans(13);
  ctx.fillText("Delivery handle for this order", X, 230);

  kicker(ctx, "Issued by", X + 340, 186);
  ctx.fillStyle = C.ink;
  ctx.font = sans(18, 500);
  ctx.fillText("Curialy", X + 340, 206);
  ctx.fillStyle = C.muted;
  ctx.font = sans(13);
  ctx.fillText(
    `${config.publicBaseUrl.replace(/^https?:\/\//, "")}  ·  t.me/Curialy`,
    X + 340,
    230,
  );

  line(ctx, 268);

  kicker(ctx, "Particulars", X, 292);
  const tableTop = 320;
  ctx.fillStyle = C.chip;
  ctx.fillRect(X, tableTop, COL, 34);
  ctx.fillStyle = C.label;
  ctx.font = sans(11, 500);
  ctx.letterSpacing = "0.12em";
  ctx.fillText("ITEM", X + 16, tableTop + 10);
  ctx.fillText("PERIOD", X + 360, tableTop + 10);
  ctx.fillText("QTY", X + 560, tableTop + 10);
  ctx.textAlign = "right";
  ctx.fillText("AMOUNT", RIGHT - 16, tableTop + 10);
  ctx.textAlign = "left";
  ctx.letterSpacing = "0";

  let rowY = tableTop + 46;
  for (const item of items) {
    ctx.fillStyle = C.ink;
    ctx.font = sans(16, 500);
    ctx.fillText(item.productName, X + 16, rowY);
    ctx.font = sans(15);
    ctx.fillText(item.planLabel, X + 360, rowY);
    ctx.font = mono(15);
    ctx.fillText(String(item.quantity), X + 560, rowY);
    ctx.textAlign = "right";
    ctx.fillText(money(item.lineTotal), RIGHT - 16, rowY);
    ctx.textAlign = "left";
    rowY += 36;
  }

  line(ctx, rowY + 4, C.ruleStrong);
  rowY += 20;
  ctx.fillStyle = C.muted;
  ctx.font = sans(13);
  ctx.fillText("Amount due in full on this page", X + 16, rowY + 4);
  ctx.fillStyle = C.ink;
  ctx.font = sans(13, 500);
  ctx.textAlign = "right";
  ctx.fillText("Total", RIGHT - 160, rowY + 2);
  ctx.font = mono(22, true);
  ctx.fillText(`${money(order.total_usd)} USD`, RIGHT - 16, rowY);
  ctx.textAlign = "left";

  rowY += 56;
  line(ctx, rowY);
  rowY += 28;

  kicker(ctx, "Settlement", X, rowY);
  rowY += 28;

  const netLabel =
    order.network && order.coin
      ? `${NETWORK_LABELS[order.network] || order.network} · ${order.coin}`
      : "Not selected yet";

  const ledger = [
    ["Payment network", netLabel, false],
    [
      "Amount sent",
      order.expected_amount ? `${order.expected_amount} ${order.coin}` : "—",
      true,
    ],
    ["Destination", order.settlement_address ? shortMiddle(order.settlement_address, 14, 12) : "—", true],
    [
      "Transaction",
      order.tx_hash ? shortMiddle(order.tx_hash, 16, 14) : "Awaiting submission",
      Boolean(order.tx_hash),
    ],
    ["Placed", stamp(order.created_at) || "—", false],
    ["Payment submitted", stamp(order.submitted_at) || "—", false],
    ["Completed", stamp(order.completed_at) || "—", false],
  ];

  const colGap = 28;
  const colW = (COL - colGap) / 2;
  ledger.forEach((entry, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const lx = X + col * (colW + colGap);
    const ly = rowY + row * 58;
    ctx.fillStyle = C.label;
    ctx.font = sans(11, 500);
    ctx.letterSpacing = "0.14em";
    ctx.fillText(entry[0].toUpperCase(), lx, ly);
    ctx.letterSpacing = "0";
    ctx.fillStyle = C.ink;
    ctx.font = entry[2] ? mono(14) : sans(15);
    ctx.fillText(entry[1], lx, ly + 20);
  });

  rowY += Math.ceil(ledger.length / 2) * 58 + 8;

  if (order.admin_note) {
    kicker(ctx, "Note from Curialy", X, rowY);
    rowY += 22;
    ctx.fillStyle = C.ink;
    ctx.font = sans(14);
    rowY = drawWrapped(ctx, order.admin_note, X, rowY, COL, 20) + 12;
  }

  kicker(ctx, "On this document", X, rowY);
  rowY += 22;
  ctx.fillStyle = C.muted;
  ctx.font = sans(13);
  for (const sentence of [
    "This receipt is generated automatically when the order is recorded, and again whenever its status changes.",
    "If the paid plan does not reach the account named above, Curialy refunds the amount on this page.",
    "Quote the order code to support. Never send a password, recovery phrase, or wallet seed.",
  ]) {
    ctx.fillText(sentence, X, rowY);
    rowY += 20;
  }

  const foot = H - FOOTER_H;
  const bandTop = foot - 24 - BAND_H;

  ctx.fillStyle = C.white;
  ctx.fillRect(X, bandTop, COL, BAND_H);
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 1;
  ctx.strokeRect(X + 0.5, bandTop + 0.5, COL - 1, BAND_H - 1);

  // Left: barcode bars, then the code, then the quote — stacked, never overlapping.
  const qrX = RIGHT - 28 - QR_SIZE;
  const barMaxW = qrX - X - 56;

  kicker(ctx, "Order barcode", X + 24, bandTop + 18);

  const barcode = await buildBarcode(order.order_code);
  const barW = Math.min(barMaxW, barcode.width);
  const barY = bandTop + 48;
  ctx.drawImage(barcode, X + 24, barY, barW, BAR_H);

  const codeY = barY + BAR_H + 16;
  ctx.fillStyle = C.ink;
  ctx.font = mono(20, true);
  ctx.fillText(order.order_code, X + 24, codeY);

  const quoteY = codeY + 32;
  ctx.fillStyle = C.muted;
  ctx.font = sans(12);
  drawWrapped(
    ctx,
    "Quote this code to support. Scanning the mark opens the order page.",
    X + 24,
    quoteY,
    barMaxW,
    18,
  );

  kicker(ctx, "Verify", qrX, bandTop + 18);
  const qr = await buildQr(verifyUrl(order), QR_SIZE * 2);
  ctx.drawImage(qr, qrX, bandTop + 48, QR_SIZE, QR_SIZE);
  ctx.fillStyle = C.muted;
  ctx.font = sans(11);
  const host = `${config.publicBaseUrl.replace(/^https?:\/\//, "")}/order`;
  const hostW = ctx.measureText(host).width;
  ctx.fillText(host, qrX + (QR_SIZE - hostW) / 2, bandTop + 48 + QR_SIZE + 10);

  line(ctx, foot, C.ruleStrong);
  ctx.fillStyle = C.muted;
  ctx.font = sans(12);
  ctx.fillText(
    "Automatically issued by Curialy for this order. Keep the page with your records.",
    X,
    foot + 16,
  );
  ctx.fillText(
    "Names identify plan categories only. Curialy is not affiliated with X or Google.  t.me/Curialy",
    X,
    foot + 36,
  );
  ctx.textAlign = "right";
  ctx.font = mono(11);
  ctx.fillText("Page 1 of 1  ·  A4", RIGHT, foot + 26);
  ctx.textAlign = "left";

  return canvas.encode("png");
}
