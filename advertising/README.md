# Curialy — advertisement video

A 60-second brand spot for **curialy.com**, built from the storefront's own design
language: the same near-black field, the Instrument Serif display voice, the IBM Plex
Mono ledger type, the broken ring, the radial dot field, and the official X, Google AI,
network and coin marks that ship in `public/brand/`.

Everything on screen is real content taken from the repository — the catalogue, the
prices, the copy, the order code format, the settlement address, the refund wording —
so the ad and the site can never drift apart.

| | |
|---|---|
| Length | 60.000 s |
| Master | 1920×1080 · 30 fps · H.264 · `video/curialy-ad-1080p.mp4` |
| Sharing cut | 1280×720 · `video/curialy-ad-720p.mp4` |
| Voiceover | warm, calm, single narrator |
| Bed | a quiet low drone, ducked under the words — see `tools/audio.sh` |
| Mix | `audio/mix.wav`, exactly 60.000 s |

## The cut

| # | Scene | In | The line |
|---|---|---|---|
| 1 | Hook & brand | 0.000 | *You want the subscription. You don't want the runaround.* |
| 2 | The shop | 7.868 | X Premium, three months for three dollars |
| 3 | Selection → request | 17.556 | Choose a duration, add it to the bag, confirm the handle |
| 4 | Pay privately | 25.625 | Six networks, USDC / USDT, no wallet connection |
| 5 | The receipt | 39.101 | Issued straight away, barcode and QR |
| 6 | A person, and a promise | 46.360 | @Curialy on Telegram · refunded if it never arrives |
| 7 | End card | 53.880 | *Subscriptions, made simple.* curialy.com |

Scene boundaries sit exactly on the voiceover sentences. The narration was generated
per scene, trimmed of leading silence, and padded to each scene's length, so the audio
is 60.000 s to the sample and every line lands on its beat.

## How it is built

The whole piece is one HTML file with one timeline.

```
src/curialy-ad.template.html   the film — layout, art direction, the master timeline
assets/                        brand marks, fonts, a real QR code and Code 128 barcode
tools/build.mjs                inlines every asset → curialy-ad.html (self-contained)
tools/render.mjs               headless Chromium, seeks the timeline, writes frames
tools/encode.sh                frames + voiceover → the deliverables in video/
tools/gencodes.mjs             regenerates the QR and barcode SVGs
tools/audio.sh                 narration + ambient bed → audio/mix.wav
audio/s1..s7.mp3               the voiceover, one clip per scene
```

`build.mjs` produces `curialy-ad.html`: a single file with the fonts, the marks and the
codes embedded as data URIs. Open it in any browser and the whole film plays.

Every animated element carries an **absolute delay** into the 60 s master clock
(`--d`, `--si`, `--so` in milliseconds). The renderer therefore does exactly one thing
per frame: `document.getAnimations()` → pause everything → set one `currentTime`.
There is no wall-clock dependency anywhere in the piece, so any frame can be
reproduced on its own, and a re-render is byte-comparable.

Hard state changes — a plan being chosen, a network tile lighting up, a field turning
green — are expressed as 1 ms `step-end` animations rather than JavaScript, so they
seek just as reliably as the tweens.

## Re-rendering

```bash
node bash tools/audio.sh                        # rebuild the 60 s audio track
node tools/build.mjs                       # inline assets → curialy-ad.html
node tools/render.mjs --probe \
  --out _review --times 6100,13400,28000   # stills, for review
node tools/render.mjs --out frames         # all 1800 frames
tools/encode.sh                            # → out/*.mp4 and poster stills
```

The renderer takes `--width`, `--height`, `--fps`, `--duration`, `--start` and `--end`
(the last two split a render across workers). Frames are JPEG at quality 96 — visually
lossless through H.264, and far faster than PNG on a film that carries fine grain.

The bundled Chromium needs two of its own shared libraries on the loader path:

```bash
export LD_LIBRARY_PATH=/path/to/sparticuz/chromium/AL2023/libs
```

## Editing what it says

- **Copy and prices** — scene markup in `src/curialy-ad.template.html`, and the source
  of truth is `src/lib/storefront.ts` and `server/src/catalog.js` in the storefront.
- **The voiceover** — replace `audio/s1..s7.mp3` with your own recordings, keeping one
  file per scene, then run `tools/audio.sh` and re-encode. The video does not need
  re-rendering if only the audio changes.
- **The bed** — the drone is synthesised in `tools/audio.sh`; change the frequencies,
  the level, or the ducking there, or delete that section for a bare voiceover.
- **Timings** — the scene table in the CSS (`.scene` `--si` / `--so`) and the per-scene
  audio segment lengths in the mix command. Keep the scene windows and the audio
  segments summing to 60 s.

The narration is rebuilt as seven segments, one per scene, each trimmed of its leading
silence, delayed by 200 ms and padded to its scene's exact length, then concatenated —
which is why the track lands on 60.000 s to the sample and every line starts just after
its scene appears. `tools/audio.sh` does all of it, including the bed and the ducking.

## Notes

- The film uses the official X logomark, the Google AI spark, and the network and coin
  marks exactly as the storefront does — only to identify compatible plan categories.
  The end card carries the same disclaimer as the site footer.
- The receipt is a real instrument, not a mock-up: the QR encodes
  `https://curialy.com/order?code=CLY-7K3M2QX9` and the barcode is a genuine Code 128
  of the same order code, both generated by `tools/gencodes.mjs`.
- A 9:16 vertical cut needs its own layout rather than a crop — this master is 16:9.
