#!/usr/bin/env bash
# Generates assets/fighters/<id>.webp from the original character art.
# Usage: tools/make-art.sh /path/to/personagens
# Needs macOS `sips` and `cwebp` (brew install webp). Input files are named NN-<id>.png.
set -euo pipefail
src="${1:?folder with the original PNGs}"
cd "$(dirname "$0")/.."
out=assets/fighters
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$out"
for f in "$src"/*.png; do
  id="$(basename "$f" .png | sed 's/^[0-9]*-//')"
  sips -Z 640 -s format bmp "$f" --out "$tmp/$id.bmp" >/dev/null
  node tools/cutout.js "$tmp/$id.bmp" "$tmp/$id.png"
  cwebp -quiet -q 82 -alpha_q 90 "$tmp/$id.png" -o "$out/$id.webp"
  echo "$out/$id.webp $(wc -c < "$out/$id.webp" | tr -d ' ') bytes"
done
