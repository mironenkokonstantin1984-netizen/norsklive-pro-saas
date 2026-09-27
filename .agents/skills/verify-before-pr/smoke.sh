#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

VALID_BODY='{"module":"norskprove","scenarioId":"np-b1b2-velferd-hjemmekontor","level":"B1","l1":"ru","persona":"standard","userText":"I dag jeg liker kaffe"}'

code_valid="$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/api/coach" \
  -H 'Content-Type: application/json' \
  -d "$VALID_BODY")"
if [ "$code_valid" != "200" ]; then
  echo "FAIL: POST /api/coach valid body returned $code_valid (expected 200)"
  exit 1
fi
echo "OK: POST /api/coach valid body -> 200"

code_empty="$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/api/coach" \
  -H 'Content-Type: application/json' \
  -d '{}')"
if [ "$code_empty" != "400" ]; then
  echo "FAIL: POST /api/coach {} returned $code_empty (expected 400)"
  exit 1
fi
echo "OK: POST /api/coach {} -> 400"

code_norsk="$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/norsk")"
if [ "$code_norsk" != "308" ] && [ "$code_norsk" != "301" ]; then
  echo "FAIL: GET /norsk returned $code_norsk (expected 308 or 301)"
  exit 1
fi
echo "OK: GET /norsk -> $code_norsk"

code_scrape="$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/api/scrape-finn" \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://www.finn.no/job/ad/12345"}')"
if [ "$code_scrape" != "404" ]; then
  echo "FAIL: POST /api/scrape-finn returned $code_scrape (expected 404)"
  exit 1
fi
echo "OK: POST /api/scrape-finn -> 404"
