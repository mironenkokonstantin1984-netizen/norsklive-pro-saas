---
name: verify-before-pr
description: Run before every commit/push or before saying a task is done. Installs deps, runs lint, tests, boots the server, smoke-tests endpoints and scans for leaked secrets. Use whenever you finish a change, before opening or updating a PR, or when asked to verify.
---

# Verify before PR

Run from the repository root:

```bash
bash .agents/skills/verify-before-pr/scripts/verify.sh
```

What it checks (in order, stops at the first failure):
1. `npm ci` (or `npm install` if no lockfile).
2. `npm run lint` — if the script exists.
3. `npm run typecheck` — if the script exists.
4. `npm test` — if the script exists.
5. Boots the server on port 3999 (`npm start`) and checks `GET /` returns 200.
6. Extra smoke checks from `.agents/skills/verify-before-pr/smoke.sh` if that file exists
   (add endpoint curls there when you add endpoints).
7. Secret scan of tracked files (Google/OpenAI/GitHub/Stripe key patterns).

Rules:
- Exit code 0 = OK to push. Anything else = fix the cause first.
- Never edit `verify.sh` to make it pass. If a check is wrong, say so in the PR report.
- Paste the final `VERIFY SUMMARY` block into the PR report.
