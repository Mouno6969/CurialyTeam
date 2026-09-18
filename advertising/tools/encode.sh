#!/usr/bin/env bash
# Encodes the rendered frames into the deliverables.
#
#   tools/encode.sh              # master + web + poster, using ./frames
#   tools/encode.sh /path/frames
#
# Frames come from tools/render.mjs, audio from the per-scene voiceover clips.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRAMES="${1:-$ROOT/frames}"
OUT="$ROOT/video"
FF="$(node -e "console.log(require('$ROOT/tools/node_modules/@ffmpeg-installer/ffmpeg').path)")"

[ -d "$FRAMES" ] || { echo "no frames in $FRAMES — run tools/render.mjs first"; exit 1; }
mkdir -p "$OUT"

count=$(ls "$FRAMES"/f*.jpg | wc -l | tr -d ' ')
echo "encoding $count frames from $FRAMES"

# 1. master — visually lossless, yuv420p so it plays everywhere
"$FF" -hide_banner -loglevel error -y \
  -framerate 30 -i "$FRAMES/f%05d.jpg" -i "$ROOT/audio/mix.wav" \
  -map 0:v -map 1:a -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p \
  -profile:v high -level 4.1 -movflags +faststart \
  -c:a aac -b:a 192k -ar 48000 -shortest \
  "$OUT/curialy-ad-1080p.mp4"
echo "  master  $OUT/curialy-ad-1080p.mp4"

# 2. silent master — for adding your own music or a different language
"$FF" -hide_banner -loglevel error -y \
  -framerate 30 -i "$FRAMES/f%05d.jpg" \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p \
  -profile:v high -level 4.1 -movflags +faststart \
  "$OUT/curialy-ad-1080p-silent.mp4"
echo "  silent  $OUT/curialy-ad-1080p-silent.mp4"

# 3. sharing cut — smaller, still clean
"$FF" -hide_banner -loglevel error -y \
  -i "$OUT/curialy-ad-1080p.mp4" \
  -vf scale=1280:720 -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p \
  -movflags +faststart -c:a aac -b:a 128k \
  "$OUT/curialy-ad-720p.mp4"
echo "  web     $OUT/curialy-ad-720p.mp4"

# 4. poster frames
"$FF" -hide_banner -loglevel error -y -i "$FRAMES/f00000.jpg" "$OUT/curialy-ad-poster.png"
"$FF" -hide_banner -loglevel error -y -i "$FRAMES/f01650.jpg" "$OUT/curialy-ad-endcard.png"
echo "  stills  $OUT/curialy-ad-poster.png, $OUT/curialy-ad-endcard.png"

echo
ls -lh "$OUT" | tail -n +2
