// Frame-accurate renderer.
//
// The ad is one HTML timeline: every animation carries an absolute delay into
// the 60 s master clock, so the renderer pauses the whole document and walks a
// single currentTime. Same input, same frames, every run.
//
//   node tools/render.mjs --probe            # a few stills, for review
//   node tools/render.mjs --out /tmp/frames  # every frame, for ffmpeg
//
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = 'file://' + path.join(ROOT, 'curialy-ad.html');

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i === -1 ? fallback : args[i + 1];
};
const has = (name) => args.includes('--' + name);

const W = Number(flag('width', 1920));
const H = Number(flag('height', 1080));
const FPS = Number(flag('fps', 30));
const DURATION = Number(flag('duration', 60000));
const SCALE = Number(flag('scale', 1));

const PROBE = has('probe');
const OUTDIR = flag('out', '/tmp/frames');
const START = Number(flag('start', 0));
const END = Number(flag('end', -1));
const EXT = flag('ext', 'jpg');

const browser = await puppeteer.launch({
  args: [...chromium.args, '--font-render-hinting=none', '--force-color-profile=srgb',
         '--disable-lcd-text', '--hide-scrollbars'],
  executablePath: await chromium.executablePath(),
  headless: true,
});

const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: SCALE });
await page.goto(PAGE, { waitUntil: 'load' });
await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
await new Promise((r) => setTimeout(r, 400));

// scale the 1920×1080 stage into any output size
if (W !== 1920 || H !== 1080) {
  await page.addStyleTag({
    content: `#stage{transform:scale(${W / 1920},${H / 1080})}`,
  });
}

const n = await page.evaluate(() => window.seek(0));
console.log(`timeline ready · ${n} animations · ${W}×${H} @ ${FPS}fps · ${DURATION / 1000}s`);

fs.mkdirSync(OUTDIR, { recursive: true });

if (PROBE) {
  const times = flag('times', '0,700,1500,2600,4600,6200,8000,9200,11000,13400,15800,18000,18800,20000,21000,22000,23600,26000,28000,30000,33000,34200,36000,38000,39500,42000,44600,46500,47000,49200,50200,54200,56500,58600')
    .split(',').map(Number);
  for (const t of times) {
    await page.evaluate((ms) => window.seek(ms), t);
    const name = String(t).padStart(5, '0');
    await page.screenshot({ path: path.join(OUTDIR, `probe-${name}.png`), optimizeForSpeed: true, captureBeyondViewport: false });
  }
  console.log(`wrote ${times.length} probe stills to ${OUTDIR}`);
} else {
  const total = END >= 0 ? Math.min(END, Math.round((DURATION / 1000) * FPS)) : Math.round((DURATION / 1000) * FPS);
  const t0 = Date.now();
  for (let i = START; i < total; i++) {
    const t = Math.round((i * 1000) / FPS);
    await page.evaluate((ms) => window.seek(ms), t);
    await page.screenshot({
      path: path.join(OUTDIR, 'f' + String(i).padStart(5, '0') + '.' + EXT),
      type: EXT === 'jpg' ? 'jpeg' : 'png',
      quality: EXT === 'jpg' ? 96 : undefined,
      optimizeForSpeed: true,
      captureBeyondViewport: false,
    });
    if ((i - START) % 150 === 0 || i === total - 1) {
      const done = i - START + 1;
      const rate = (Date.now() - t0) / done;
      console.log(`  ${done}/${total} frames  ${rate.toFixed(0)} ms/frame  ` +
        `eta ${(((total - done) * rate) / 1000).toFixed(0)}s`);
    }
  }
}

await browser.close();
console.log('done');
