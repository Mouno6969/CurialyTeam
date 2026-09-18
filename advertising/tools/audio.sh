#!/usr/bin/env bash
# Builds the 60-second audio track.
#
#   1. the narration — seven clips, one per scene, trimmed of leading silence
#      and padded to their scene's exact length, then concatenated
#   2. a quiet ambient bed so the gaps between lines are not dead air
#   3. the bed ducked under the narration, then limited
#
#   tools/audio.sh
#
# Output: audio/mix.wav — exactly 60.000 s, 48 kHz stereo-ready mono.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FF="$(node -e "console.log(require('$ROOT/tools/node_modules/@ffmpeg-installer/ffmpeg').path)")"
cd "$ROOT"

# scene windows in seconds, summing to 60 — these must match --si/--so in the template
SEG=(7.868 9.688 8.069 13.476 7.359 7.420 6.120)

inputs=()
graph=""
labels=""
for i in 0 1 2 3 4 5 6; do
  inputs+=(-i "audio/s$((i + 1)).mp3")
  graph="${graph}[${i}:a]silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,"
  graph="${graph}adelay=200,apad,atrim=0:${SEG[$i]},asetpts=N/SR/TB[v$i];"
  labels="${labels}[v$i]"
done

graph="${graph}${labels}concat=n=7:v=0:a=1[voice];"

# ── the bed ────────────────────────────────────────────────────────────
# a low two-note drone with a slow pink-noise air layer over it
graph="${graph}
sine=frequency=55:duration=60,volume=0.50[low];
sine=frequency=110:duration=60,volume=0.20[high];
anoisesrc=color=pink:duration=60:amplitude=0.30,lowpass=f=850,tremolo=f=0.1:d=0.55,volume=0.34[air];
[low][high][air]amix=inputs=3:duration=longest,volume=2.6,
  highpass=f=45,lowpass=f=1400,afade=t=in:st=0:d=3,afade=t=out:st=56.4:d=3.6,
  aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=mono[bed];"

# ── duck the bed under the words, then mix ─────────────────────────────
graph="${graph}
[voice]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=mono,asplit=2[voiceMix][sc];
[bed][sc]sidechaincompress=threshold=0.035:ratio=8:attack=60:release=700:makeup=1[bedDuck];
[bedDuck][voiceMix]amix=inputs=2:duration=longest,volume=2,alimiter=limit=0.94,aresample=48000[out]"

"$FF" -hide_banner -loglevel error -y "${inputs[@]}" -filter_complex "$graph" \
  -map "[out]" -t 60 -c:a pcm_s16le audio/mix.wav

echo "wrote audio/mix.wav"
node -e "
const {execSync}=require('child_process');
const fp=require('$ROOT/tools/node_modules/@ffprobe-installer/ffprobe').path;
const d=execSync(\`\${fp} -v error -show_entries format=duration -of csv=p=0 audio/mix.wav\`).toString().trim();
console.log('duration', d, 's');
"
