#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

root_html="$(curl -s "$BASE_URL/")"
code_root="$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/")"
if [ "$code_root" != "200" ]; then
  echo "FAIL: GET / returned $code_root (expected 200)"
  exit 1
fi
if ! echo "$root_html" | grep -q "NorskLive Pro"; then
  echo "FAIL: GET / HTML does not contain 'NorskLive Pro'"
  exit 1
fi
echo "OK: GET / -> 200 (contains NorskLive Pro)"

code_index_html="$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/index.html")"
if [ "$code_index_html" != "404" ]; then
  echo "FAIL: GET /index.html returned $code_index_html (expected 404)"
  exit 1
fi
echo "OK: GET /index.html -> 404"

VALID_BODY='{"module":"norskprove","scenarioId":"np-b1b2-velferd-hjemmekontor","level":"B1","l1":"ru","persona":"standard","userText":"I dag jeg liker kaffe"}'

# With a Gemini key (or COACH_ALLOW_FALLBACK=true) the coach answers 200. Without either it must
# answer an honest 503 {"error":"coach_unavailable"} and never a canned reply (#45).
valid_body_out="$(mktemp)"
code_valid="$(curl -s -o "$valid_body_out" -w '%{http_code}' -X POST "$BASE_URL/api/coach" \
  -H 'Content-Type: application/json' \
  -d "$VALID_BODY")"
if [ "$code_valid" = "200" ]; then
  echo "OK: POST /api/coach valid body -> 200"
elif [ "$code_valid" = "503" ] && grep -q '"error":"coach_unavailable"' "$valid_body_out"; then
  echo "OK: POST /api/coach valid body -> 503 coach_unavailable (no AI key configured)"
else
  echo "FAIL: POST /api/coach valid body returned $code_valid (expected 200, or 503 coach_unavailable)"
  rm -f "$valid_body_out"
  exit 1
fi
rm -f "$valid_body_out"

code_empty="$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/api/coach" \
  -H 'Content-Type: application/json' \
  -d '{}')"
if [ "$code_empty" != "400" ]; then
  echo "FAIL: POST /api/coach {} returned $code_empty (expected 400)"
  exit 1
fi
echo "OK: POST /api/coach {} -> 400"

code_studio="$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/studio")"
if [ "$code_studio" != "200" ]; then
  echo "FAIL: GET /studio returned $code_studio (expected 200)"
  exit 1
fi
echo "OK: GET /studio -> 200"

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
