#!/usr/bin/env bash
# Smoke test: all src/*.js parse (both games); platformer/index.html loads every platformer script.
set -u
cd "$(dirname "$0")/.."
for dir in . platformer; do (cd "$dir" && for f in src/*.js; do node --check "$f" || echo "FAIL syntax: $dir/$f"; done) ; done | grep FAIL && exit 1
cd platformer
fail=0
for f in src/*.js; do
  node --check "$f" || { echo "FAIL syntax: $f"; fail=1; }
  grep -q "src=\"$f\"" index.html || { echo "FAIL not loaded by index.html: $f"; fail=1; }
done
[ $fail -eq 0 ] && echo "smoke OK" || echo "smoke FAILED"
exit $fail
