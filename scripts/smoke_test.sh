#!/usr/bin/env bash
# Smoke test: every .js parses, and each game's index.html loads every script in its src/.
set -u
cd "$(dirname "$0")/.."
fail=0
for dir in . platformer; do
  for f in "$dir"/src/*.js; do
    node --check "$f" || { echo "FAIL syntax: $f"; fail=1; }
    rel="${f#"$dir"/}"
    grep -q "src=\"$rel\"" "$dir/index.html" || { echo "FAIL not loaded by $dir/index.html: $rel"; fail=1; }
  done
done
[ $fail -eq 0 ] && echo "smoke OK" || echo "smoke FAILED"
exit $fail
