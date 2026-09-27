---
name: code-review
description: Self-review of your own diff before pushing. Use after implementing a task and before running verify-before-pr, or when asked to review code in this repository.
---

# Self code review

Run `git diff master...HEAD --stat` and then read the full diff. Check, in this order:

1. **Scope** — every changed file is required by the issue. Revert anything else.
2. **Acceptance criteria** — each criterion from the issue is implemented; note file:line for each.
3. **Security** — no secrets; no LLM/payment calls from browser code; request bodies validated;
   no user-controlled URLs fetched server-side; user text not interpolated into prompts or shell.
4. **Error handling** — external calls have timeouts and a fallback; errors return proper status
   codes without leaking stack traces.
5. **Tests** — new server logic has tests covering success, invalid input and dependency failure.
6. **Leftovers** — no `console.log` debugging, commented-out code, TODOs without an issue,
   unused files, Windows paths.

Fix what you find, then run the verify-before-pr skill.
