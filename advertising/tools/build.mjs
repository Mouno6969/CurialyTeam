// Inlines every brand asset into a single self-contained HTML file, so the
// motion piece can be opened, scrubbed and re-rendered from one artifact.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src', 'curialy-ad.template.html');
const OUT = path.join(ROOT, 'curialy-ad.html');
const ASSETS = path.join(ROOT, 'assets');

const MIME = {
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp',
};

let html = fs.readFileSync(SRC, 'utf8');
const seen = new Set();
let bytes = 0;

html = html.replace(/__ASSET:([^_]+(?:_[^_]+)*)__/g, (whole, rawKey) => {
  const key = decodeURIComponent(rawKey);
  const file = path.join(ASSETS, key);
  if (!fs.existsSync(file)) throw new Error('missing asset: ' + key);
  const ext = path.extname(file).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  const buf = fs.readFileSync(file);
  bytes += buf.length;
  seen.add(key);
  return `data:${mime};base64,${buf.toString('base64')}`;
});

if (html.includes('__ASSET:')) {
  throw new Error('unreplaced asset token remains: ' + html.match(/__ASSET:[^_]+(?:_[^_]+)*__/)[0]);
}

fs.writeFileSync(OUT, html);
console.log(`built ${path.relative(ROOT, OUT)}  ${(html.length / 1024).toFixed(0)} KB`);
console.log(`inlined ${seen.size} assets (${(bytes / 1024).toFixed(0)} KB raw)`);
