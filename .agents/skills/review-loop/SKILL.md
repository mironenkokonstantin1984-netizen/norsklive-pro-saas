---
name: review-loop
description: What to do after your PR is marked "Ready for review" or after you posted a "❓ Question for reviewer" — keep polling the PR for reviewer comments and act on them until the reviewer accepts. Use instead of stopping or asking the owner.
---

# Review loop

The reviewer (Claude Code) answers on the PR, not in the IDE chat. Do not wait for the owner to
relay anything — poll the PR yourself.

While the PR is still a draft, read the PR comments after every push as well. The reviewer may
post a CI hint (starting with `@antigravity`) before you mark it Ready; fix it before the next task.

## Loop
Repeat until one of the exit conditions below:

1. Wait 5 minutes (`sleep 300` in the terminal; on Windows PowerShell `Start-Sleep -Seconds 300`).
2. Read all PR comments newer than your last action — GitHub MCP `pull_request_read`
   (`get_comments`, `get_review_comments`) or `gh pr view <N> --comments`.
3. Act on the newest reviewer comment:
   - starts with `@antigravity` → follow the address-review skill: fix every point, run
     verify.sh, push, confirm with `git ls-remote origin <branch>`, reply on the PR citing the
     pushed SHA;
   - answers your `❓ Question for reviewer:` → apply the answer, continue the task, push;
   - contains `✅` and the word `accepted` → **exit: done.** Do not push anything else.
4. Also check CI on the latest commit (GitHub MCP `get_check_runs` or `gh pr checks <N>`).
   If it is red, fix the cause (never skip or delete tests), push, and continue the loop.

## Exit conditions
- `✅ … accepted` from the reviewer → finish the goal.
- 3 hours without a new reviewer comment, or more than 5 review rounds → post
  `⏸ Stopped waiting: <short reason>` on the PR and finish the goal.

## Rules
- Never reply to the owner in the IDE chat instead of acting; never ask "should I continue?".
- Never start your own PR comments with `@antigravity` (that is the reviewer's trigger).
- Never merge the PR yourself — the owner merges.
