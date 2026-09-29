# AGENTS.md — rules for coding agents in this repository

These rules are always active. They apply to every agent (Antigravity, Claude Code, others).

## Product
NorskLive Pro — AI trainer for the Norwegian oral exam "Norskprøve muntlig" (HK-dir), levels A2/B1,
explanations in the learner's L1 (ru/uk/en). Business context: `docs/GO_TO_MARKET_PLAN.md`.

## Where to look (load only what the task needs)
| When you… | Open |
|---|---|
| start any task | the issue, then this file |
| change UI, CSS or anything under `src/app`, `src/components` | `design-system` skill → `docs/DESIGN_SYSTEM.md` |
| touch Supabase, migrations, auth or RLS | `docs/SUPABASE_LOCAL.md` |
| need the bigger picture or later milestones | `docs/AGENT_TASK_SPEC.md` |
| finish a change, before any push | `verify-before-pr` skill |
| write or update the PR description | `pr-report` skill |
| see a comment starting with `@antigravity` | `address-review` skill |
| have marked the PR Ready for review | `review-loop` skill |
| plan a paywall, onboarding, an a11y audit or validate an idea (Claude Code only) | `.claude/skills/` (see `THIRD_PARTY.md`) |

## Definition of done
A task is done only when **all** of these are true, in this order:
1. Every numbered task and every acceptance criterion in the issue is met.
2. `verify.sh` prints `RESULT: PASS` locally on the final commit.
3. The push landed (`git ls-remote` SHA = `git rev-parse HEAD`), and CI is green on **that** commit.
4. The PR description follows the `pr-report` skill, including "Decisions made".
5. Every reviewer comment on the PR (including hints posted while it was a draft) is addressed.

Only then mark the PR Ready for review. A red CI, an unanswered comment or a missing report
means not done: keep working, do not stop or wait.

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
- Security, scope and testing baselines live in `.agents/rules/` (always on); they are not repeated here.
- Do not scrape websites whose terms forbid it (finn.no included).
- Do not invent library APIs. When unsure about a library's API, check its current docs
  (Context7 MCP if available, otherwise the package README in `node_modules`).
- Personal data (accounts, transcripts, audio) must be stored in EU/EEA regions only.
- Keep user-facing exam content in Norwegian Bokmål; do not copy textbook content
  (På vei, Stein på stein, etc.).

## Autonomy (no owner confirmations)
The owner does not approve individual steps. The issue itself is the permission to do the work.
- Never ask the owner in the IDE chat "shall I start / continue / proceed?". Start and keep going.
- Something is unclear but you can still proceed → pick the simplest option that stays inside
  the issue, continue, and list it under "Decisions made" in the PR report.
- A real blocker (you cannot continue correctly without an answer) → post a comment on **your PR**
  starting with `❓ Question for reviewer:`, keep working on the other tasks, and wait for the
  answer using the review-loop skill. Never ask in the IDE chat. (This is why the draft PR is
  opened right after the first commit.)
- Never do these unless the issue explicitly says so: `git push --force`, push to `master`,
  merge a PR, delete branches other than your own, edit `.github/workflows` outside the task,
  install global packages.

## Review comments
Comments starting with `@antigravity` are change requests from the reviewer (Claude Code). After
"Ready for review" do not stop until the reviewer posts `✅ … accepted` (see the table above).

## Commands
- Install: `npm ci` · Local Supabase: `npm run db:start`
- Dev server: `npm run dev` → http://localhost:3000 (`npm start` needs `npm run build` first)
- Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; all at once: `verify.sh`
