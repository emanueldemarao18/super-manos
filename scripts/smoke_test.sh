#!/usr/bin/env bash
# Smoke test: every src/*.js must parse, and index.html must load every one of them.
set -u
cd "$(dirname "$0")/.."
fail=0
for f in src/*.js; do
  node --check "$f" || { echo "FAIL syntax: $f"; fail=1; }
  grep -q "src=\"$f\"" index.html || { echo "FAIL not loaded by index.html: $f"; fail=1; }
done
[ $fail -eq 0 ] && echo "smoke OK" || echo "smoke FAILED"
exit $fail
