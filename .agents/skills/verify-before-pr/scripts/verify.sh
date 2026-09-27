#!/usr/bin/env bash
# Pre-push verification for agents. Exit 0 = safe to push.
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1

PORT="${VERIFY_PORT:-3999}"
RESULTS=()
FAILED=0

step() { echo; echo "=== $1 ==="; }
record() { RESULTS+=("$1"); }
fail() { record "FAIL  $1"; FAILED=1; summary; exit 1; }

summary() {
  echo
  echo "===== VERIFY SUMMARY ====="
  for r in "${RESULTS[@]}"; do echo "$r"; done
  if [ "$FAILED" -eq 0 ]; then echo "RESULT: PASS"; else echo "RESULT: FAIL"; fi
}

has_script() {
  node -e "const s=require('./package.json').scripts||{}; process.exit(s['$1']?0:1)" 2>/dev/null
}

step "install"
if [ -f package-lock.json ]; then npm ci --no-audit --no-fund || fail "npm ci"
else npm install --no-audit --no-fund || fail "npm install"; fi
record "OK    install"

for s in lint typecheck test build; do
  step "$s"
  if has_script "$s"; then
    npm run "$s" || fail "npm run $s"
    record "OK    $s"
  else
    record "SKIP  $s (no script)"
  fi
done

step "server smoke"
if has_script start; then
  # setsid: own process group, so we can stop npm *and* the node child it spawns
  PORT="$PORT" setsid npm start >/tmp/verify-server.log 2>&1 &
  SERVER_PID=$!
  trap 'kill -- -"$SERVER_PID" 2>/dev/null' EXIT
  code=""
  for _ in $(seq 1 30); do
    code="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/" || true)"
    [ "$code" = "200" ] && break
    sleep 1
  done
  [ "$code" = "200" ] || { cat /tmp/verify-server.log; fail "GET / returned '$code'"; }
  record "OK    GET / -> 200"

  if [ -f .agents/skills/verify-before-pr/smoke.sh ]; then
    BASE_URL="http://localhost:$PORT" bash .agents/skills/verify-before-pr/smoke.sh || fail "smoke.sh"
    record "OK    smoke.sh"
  fi
  kill -- -"$SERVER_PID" 2>/dev/null
else
  record "SKIP  server smoke (no start script)"
fi

step "secret scan"
PATTERN='AIza[0-9A-Za-z_-]{30,}|(^|[^A-Za-z0-9_-])sk-(proj-)?[A-Za-z0-9]{32,}|sk_live_[A-Za-z0-9]{10,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----'
if git ls-files -z | xargs -0 grep -nIE "$PATTERN" -- 2>/dev/null; then
  fail "possible secret committed (see lines above)"
fi
record "OK    secret scan"

summary
exit 0
