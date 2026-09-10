# Curialy Advertisement

Cinematic 28-second brand film for **Curialy** — the independent digital subscription storefront.

## Deliverable

| File | Description |
|---|---|
| `Curialy-Advertisement.mp4` | Share-ready 1080p H.264 + AAC (~6 MB) |
| `curialy-ad.mp4` | Master encode, higher bitrate (~47 MB) |
| `voiceover.mp3` | Narration track |
| `render_ad.py` | Motion-graphics renderer (re-runnable) |

## Storyboard

1. **Open (0–3s)** — Logo emerges over radial matrix · “A considered digital shop”
2. **Promise (3–7s)** — “Subscriptions,” + typewriter: *made simple / priced clearly / paid privately*
3. **Flow (7–12s)** — Three steps: Choose → Confirm → Pay privately
4. **Shop (12–18s)** — X Premium & Google AI plan cards with real catalog prices
5. **Trust (18–23s)** — Parchment receipt (`CLY-…`) · private checkout · tracking · refunds
6. **CTA (23–28s)** — Brand lockup · “Priced clearly. Paid privately.” · Explore plans

## Brand system used

- Palette: `#09090b` / `#f4f4f5` / parchment receipt paper
- Type: Instrument Serif · Instrument Sans · IBM Plex Mono
- Marks: Curialy C logo, X logomark, Google AI spark
- Motifs: radial dots, hairline cards, mono kickers

## Re-render

```bash
source ~/.venv/bin/activate   # needs Pillow, numpy, imageio-ffmpeg
python3 ad/render_ad.py
```
