---
description: Implement a GitHub agent-task issue end to end. Usage: /implement-issue followed by the issue number, e.g. "/implement-issue 22". <N> below is that number.
---

Implement issue #<N> in mironenkokonstantin1984-netizen/norsklive-pro-saas exactly as written.

1. `git checkout master && git pull`, then `git checkout -b agent/issue-<N>`.
2. Read the whole issue and `AGENTS.md`. Open only the docs and skills the "Where to look" table names for this task.
3. Commit after each numbered task. Open a draft PR (`Closes #<N>`) right after the first commit.
4. After every push, read the PR comments and fix any `@antigravity` hint before the next task.
5. Never ask the owner for confirmation. For a real blocker, comment `❓ Question for reviewer:` on the PR and keep working on the rest.
6. Meet the "Definition of done" in `AGENTS.md`, then mark the PR Ready for review.
7. Follow the review-loop skill until the reviewer posts `✅ … accepted`.
