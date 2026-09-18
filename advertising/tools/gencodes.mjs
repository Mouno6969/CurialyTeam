import QRCode from 'qrcode';
import bwipjs from 'bwip-js';
import fs from 'node:fs';

const CODE = 'CLY-7K3M2QX9';
const url = `https://curialy.com/order?code=${CODE}`;

// Real QR code -> SVG path, one <rect> per dark module, no quiet zone padding math needed for SVG viewBox
const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
const size = qr.modules.size;
const data = qr.modules.data;
let rects = '';
let i = 0;
for (const v of data) {
  if (v) {
    const x = i % size, y = (i / size) | 0;
    rects += `M${x} ${y}h1v1h-1z`;
  }
  i++;
}
fs.writeFileSync('assets/qr.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><path fill="#16161a" d="${rects}"/></svg>`);
console.log('qr modules', size, 'url', url);

// Real Code128 barcode -> SVG
const bc = bwipjs.toSVG ? null : null;
const svg = bwipjs.toSVG ? null : null;
const barSvg = bwipjs.render
  ? null : null;
// use toBuffer -> svg via bwip-js/node toSVG()
const out = bwipjs.toSVG
  ? bwipjs.toSVG({ bcid: 'code128', text: CODE, scale: 2, height: 12, includetext: false, paddingwidth: 0, paddingheight: 0 })
  : null;
if (!out) { console.log('no toSVG'); } else { fs.writeFileSync('assets/barcode.svg', out); console.log('barcode svg bytes', out.length); }
