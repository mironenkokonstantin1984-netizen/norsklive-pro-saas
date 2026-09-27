# AGENTS.md — rules for coding agents in this repository

These rules are always active. They apply to every agent (Antigravity, Claude Code, others).

## Product
NorskLive Pro — AI trainer for the Norwegian oral exam "Norskprøve muntlig" (HK-dir), levels A2/B1,
explanations in the learner's L1 (ru/uk/en). Business context: `docs/GO_TO_MARKET_PLAN.md`.
Full technical roadmap: `docs/AGENT_TASK_SPEC.md`. How the task loop works: `docs/AGENT_LOOP.md`.

## How you receive work
- Each task is a GitHub issue labelled `agent-task`, or a PR comment starting with `@antigravity`.
- Read the **whole** issue, including every acceptance criterion, before changing code.
- Work only on the branch you were given (`agent/issue-<N>`). Never commit to `master`.
- Do only what the issue asks. No drive-by refactors, renames, dependency upgrades or
  formatting of untouched files. If something outside scope looks broken, mention it in the
  PR report instead of fixing it.

## Before every push (mandatory)
1. Run `bash .agents/skills/verify-before-pr/scripts/verify.sh`. If it exits non-zero, fix the
   cause. Do not push red code, do not disable or delete tests to get green.
2. Re-read your diff (`git diff master...HEAD`) and remove anything the issue did not ask for.
3. Fill the PR report as described in `.agents/skills/pr-report/SKILL.md`.
4. After `git push`, confirm the push landed: `git ls-remote origin <branch>` must print the same
   SHA as `git rev-parse HEAD`. Only then reply on the PR, and cite that SHA — never a local-only commit.

## Hard rules
- No secrets in code, tests, fixtures, logs or commits. Keys only via server env vars; every new
  variable goes into `.env.example` with a comment.
- Never call paid AI/LLM APIs from browser code. All provider calls go through our server.
- Validate every request body on the server (zod). Treat user text as data: never interpolate it
  into prompts or shell commands.
- Do not scrape websites whose terms forbid it (finn.no included).
- Do not invent library APIs. When unsure about a library's API, check its current docs
  (Context7 MCP if available, otherwise the package README in `node_modules`).
- Personal data (accounts, transcripts, audio) must be stored in EU/EEA regions only.
- Keep user-facing exam content in Norwegian Bokmål; do not copy textbook content
  (På vei, Stein på stein, etc.).

## Review comments
Comments starting with `@antigravity` are change requests from the reviewer (Claude Code).
Follow `.agents/skills/address-review/SKILL.md`: address every point, one by one, and report
what you changed for each.

## Commands
- Install: `npm ci`
- Run locally: `npm start` → http://localhost:3000
- Lint / test (when present): `npm run lint`, `npm test`
