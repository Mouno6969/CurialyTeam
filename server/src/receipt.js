// Receipt image generator.
//
// Layout and palette follow the parchment receipt from the operator's existing
// Telegram bot (Mouno-Private `build_receipt_image`): cream page, gold rounded
// border, faint rules, a circular logo seal, a coloured status pill, uppercase
// label/value rows, then a verification band. Typography is Curialy's own
// (Instrument Serif / Instrument Sans / IBM Plex Mono) so the receipt matches
// the storefront rather than the bot.

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
  page: "#f6eedc",
  card: "#fffcf2",
  gold: "#b88952",
  ink: "#3f271c",
  label: "#814828",
  value: "#232323",
  muted: "#715f4c",
  rule: "rgba(224,203,171,0.85)",
  ruleFaint: "rgba(231,216,190,0.32)",
  sealRing: "rgba(129,72,40,0.75)",
  sealRingInner: "rgba(129,72,40,0.43)",
};

const STATUS_FILL = {
  completed: "#1f8149",
  pending: "#b0741c",
  confirming: "#2f6f9e",
  awaiting_payment: "#8a7355",
  rejected: "#a33a2a",
  expired: "#6b6b6b",
};

const WIDTH = 1100;
const MARGIN = 90;
const CONTENT_WIDTH = WIDTH - MARGIN * 2;

const serif = (size) => `${size}px ReceiptSerif, serif`;
const sans = (size, weight = 400) => `${weight} ${size}px ReceiptSans, sans-serif`;
const mono = (size, bold = false) =>
  `${size}px ${bold ? "ReceiptMonoBold" : "ReceiptMono"}, monospace`;

/** Middle-elides a long identifier: 0xb94a70…BA1e25 */
function shortMiddle(value, head = 10, tail = 8) {
  const text = String(value ?? "");
  if (text.length <= head + tail + 1) return text;
  return `${text.slice(0, head)}…${text.slice(-tail)}`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/**
 * Draws `text` wrapped to `maxWidth`, breaking mid-word for unbroken strings
 * such as transaction hashes. Returns the y just past the last line.
 */
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
    // A single word wider than the column (hash, address) is split by character.
    if (ctx.measureText(word).width > maxWidth) {
      let chunk = "";
      for (const char of word) {
        if (ctx.measureText(chunk + char).width > maxWidth) {
          ctx.fillText(chunk, x, cursor);
          cursor += lineHeight;
          chunk = char;
        } else {
          chunk += char;
        }
      }
      line = chunk;
    } else {
      line = word;
    }
  }
  flush();
  return cursor;
}

const NETWORK_LABELS = { ethereum: "Ethereum", solana: "Solana", polygon: "Polygon" };

function stamp(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

/** The label/value rows, in display order. Absent data is stated, never blank. */
function buildRows(order) {
  const rows = [
    { label: "Order ID", value: order.order_code, mono: true, emphasis: true },
    { label: "X handle", value: order.x_handle ? `@${order.x_handle}` : "Not provided" },
    { label: "Items", value: order.basket_summary },
    { label: "Order total", value: `$${Number(order.total_usd).toFixed(2)} USD` },
  ];

  if (order.network && order.coin) {
    rows.push({
      label: "Payment network",
      value: `${NETWORK_LABELS[order.network] || order.network} · ${order.coin}`,
    });
    rows.push({
      label: "Amount to send",
      value: `${order.expected_amount ?? "—"} ${order.coin}`,
      mono: true,
    });
    rows.push({
      label: "Destination wallet",
      value: shortMiddle(order.settlement_address, 12, 10),
      mono: true,
    });
  } else {
    rows.push({ label: "Payment network", value: "Not selected yet" });
  }

  rows.push({
    label: "Transaction hash",
    value: order.tx_hash || "Awaiting submission",
    mono: Boolean(order.tx_hash),
  });
  rows.push({ label: "Placed", value: stamp(order.created_at) || "—" });

  const submitted = stamp(order.submitted_at);
  if (submitted) rows.push({ label: "Payment submitted", value: submitted });
  const completed = stamp(order.completed_at);
  if (completed) rows.push({ label: "Completed", value: completed });
  if (order.admin_note) rows.push({ label: "Note from Curialy", value: order.admin_note });

  return rows;
}

/** Where the QR points: the public status page, pre-filled with the code. */
export function verifyUrl(order) {
  return `${config.publicBaseUrl}/order?code=${encodeURIComponent(order.order_code)}`;
}

async function buildQr(text, size) {
  const buffer = await QRCode.toBuffer(text, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: size,
    color: { dark: "#3f271c", light: "#fffcf2" },
  });
  return loadImage(buffer);
}

/**
 * Code128 of the order code. Order codes are restricted to A-Z0-9 and dashes,
 * all of which Code128 encodes directly.
 */
async function buildBarcode(code) {
  const buffer = await bwipjs.toBuffer({
    bcid: "code128",
    text: code,
    scale: 3,
    height: 14,
    includetext: false,
    backgroundcolor: "FFFCF2",
    barcolor: "3F271C",
    paddingwidth: 0,
    paddingheight: 0,
  });
  return loadImage(buffer);
}

const ROWS_TOP = 315;
const BAND_HEIGHT = 292;
const FOOTER_HEIGHT = 96;

/** Measures the wrapped row block so the canvas is exactly tall enough. */
function measureRows(rows) {
  const scratch = createCanvas(WIDTH, 10).getContext("2d");
  let y = ROWS_TOP;
  for (const row of rows) {
    scratch.font = row.mono ? mono(row.emphasis ? 33 : 27) : sans(row.emphasis ? 33 : 29);
    const lines = countLines(scratch, row.value, CONTENT_WIDTH);
    y += 34 + lines * 38 + 48;
  }
  return y;
}

function countLines(ctx, text, maxWidth) {
  const words = String(text ?? "").split(/\s+/).filter(Boolean);
  let line = "";
  let lines = 1;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    lines += 1;
    if (ctx.measureText(word).width > maxWidth) {
      let chunk = "";
      for (const char of word) {
        if (ctx.measureText(chunk + char).width > maxWidth) {
          lines += 1;
          chunk = char;
        } else {
          chunk += char;
        }
      }
      line = chunk;
    } else {
      line = word;
    }
  }
  return lines;
}

async function drawSeal(ctx, x, y, size) {
  ctx.save();
  if (fs.existsSync(LOGO_PATH)) {
    const logo = await loadImage(LOGO_PATH);
    const side = Math.min(logo.width, logo.height);
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = 0.58;
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
  } else {
    ctx.fillStyle = "rgba(129,72,40,0.16)";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Concentric rings sit on top of the mark either way.
  ctx.lineWidth = 5;
  ctx.strokeStyle = C.sealRing;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 - 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = C.sealRingInner;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 - 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Renders the receipt for an order row as a PNG buffer.
 * The status pill reflects the order's status at render time, so the same URL
 * yields PENDING REVIEW before the admin acts and COMPLETED afterwards.
 */
export async function renderReceipt(order) {
  const rows = buildRows(order);
  const height = measureRows(rows) + BAND_HEIGHT + FOOTER_HEIGHT + 60;

  const canvas = createCanvas(WIDTH, height);
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "top";

  ctx.fillStyle = C.page;
  ctx.fillRect(0, 0, WIDTH, height);

  ctx.fillStyle = C.card;
  roundRect(ctx, 45, 45, WIDTH - 90, height - 90, 36);
  ctx.fill();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Faint ruled paper.
  ctx.strokeStyle = C.ruleFaint;
  ctx.lineWidth = 1;
  for (let y = 90; y < height - 80; y += 70) {
    ctx.beginPath();
    ctx.moveTo(70, y + 0.5);
    ctx.lineTo(WIDTH - 70, y + 0.5);
    ctx.stroke();
  }

  await drawSeal(ctx, WIDTH - 190 - 70, 70, 190);

  ctx.fillStyle = C.ink;
  ctx.font = serif(58);
  ctx.fillText("Curialy receipt", MARGIN - 10, 74);

  const statusLabel = STATUS_LABELS[order.status] || String(order.status).toUpperCase();
  ctx.font = sans(28, 600);
  const pillWidth = ctx.measureText(statusLabel).width + 48;
  ctx.fillStyle = STATUS_FILL[order.status] || C.muted;
  roundRect(ctx, MARGIN - 8, 155, pillWidth, 52, 20);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(statusLabel, MARGIN + 16, 168);

  ctx.fillStyle = C.muted;
  ctx.font = sans(23);
  ctx.fillText(`Generated: ${stamp(new Date())}`, MARGIN - 10, 228);

  let y = ROWS_TOP;
  for (const row of rows) {
    ctx.fillStyle = C.label;
    ctx.font = sans(25, 600);
    ctx.fillText(row.label.toUpperCase(), MARGIN, y);

    ctx.fillStyle = row.emphasis ? C.ink : C.value;
    ctx.font = row.mono ? mono(row.emphasis ? 33 : 27) : sans(row.emphasis ? 33 : 29);
    const after = drawWrapped(ctx, row.value, MARGIN, y + 34, CONTENT_WIDTH, 38);

    y = after + 22;
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MARGIN, y);
    ctx.lineTo(WIDTH - MARGIN, y);
    ctx.stroke();
    y += 26;
  }

  // Verification band: scannable barcode of the order code, plus a QR to the
  // status page so the receipt can be checked without typing anything.
  const bandTop = y;
  ctx.fillStyle = "rgba(255,252,242,0.96)";
  roundRect(ctx, MARGIN, bandTop, CONTENT_WIDTH, BAND_HEIGHT - 24, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(184,137,82,0.86)";
  ctx.lineWidth = 3;
  ctx.stroke();

  const qrSize = 170;
  const qrPanelX = WIDTH - MARGIN - 24 - qrSize - 24;
  const barcodeMaxWidth = qrPanelX - MARGIN - 60;

  ctx.fillStyle = C.label;
  ctx.font = sans(24, 600);
  ctx.fillText("Order barcode", MARGIN + 30, bandTop + 26);

  const barcode = await buildBarcode(order.order_code);
  const barcodeScale = Math.min(1, barcodeMaxWidth / barcode.width);
  const barcodeWidth = barcode.width * barcodeScale;
  const barcodeHeight = barcode.height * barcodeScale;
  ctx.drawImage(barcode, MARGIN + 30, bandTop + 66, barcodeWidth, barcodeHeight);

  ctx.fillStyle = C.ink;
  ctx.font = mono(30, true);
  ctx.fillText(order.order_code, MARGIN + 30, bandTop + 74 + barcodeHeight);

  ctx.fillStyle = C.muted;
  ctx.font = sans(20);
  drawWrapped(
    ctx,
    "Quote this code to support, or enter it on the order status page.",
    MARGIN + 30,
    bandTop + 118 + barcodeHeight,
    barcodeMaxWidth,
    26,
  );

  ctx.fillStyle = C.label;
  ctx.font = sans(24, 600);
  const scanLabel = "Scan to verify";
  const scanWidth = ctx.measureText(scanLabel).width;
  ctx.fillText(scanLabel, qrPanelX + (qrSize + 48) / 2 - scanWidth / 2, bandTop + 26);

  const qr = await buildQr(verifyUrl(order), qrSize);
  ctx.drawImage(qr, qrPanelX + 24, bandTop + 62, qrSize, qrSize);

  ctx.fillStyle = C.muted;
  ctx.font = sans(19);
  const hostLabel = config.publicBaseUrl.replace(/^https?:\/\//, "") + "/order";
  const hostWidth = ctx.measureText(hostLabel).width;
  ctx.fillText(hostLabel, qrPanelX + (qrSize + 48) / 2 - hostWidth / 2, bandTop + 62 + qrSize + 12);

  // Footer note.
  const footTop = height - 45 - FOOTER_HEIGHT + 10;
  ctx.strokeStyle = "rgba(129,72,40,0.62)";
  ctx.lineWidth = 3;
  roundRect(ctx, 120, footTop, WIDTH - 240, 62, 24);
  ctx.stroke();
  ctx.fillStyle = C.label;
  ctx.font = sans(23);
  const note = "Automatically issued by Curialy for this order. Keep it for your records.";
  const noteWidth = ctx.measureText(note).width;
  ctx.fillText(note, WIDTH / 2 - noteWidth / 2, footTop + 19);

  return canvas.encode("png");
}






