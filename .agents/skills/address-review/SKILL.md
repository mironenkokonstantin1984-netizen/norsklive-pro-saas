---
name: address-review
description: How to handle review feedback. Use when a PR comment or review starts with "@antigravity", or when asked to fix review findings.
---

# Address review feedback

1. Collect every point: the triggering comment plus all unresolved review threads on the PR
   (`gh pr view <n> --comments` or the GitHub MCP tools).
2. Make a numbered list of the points. For each point decide: fix / already done / disagree.
3. Fix points one at a time. Keep each fix minimal and inside the task scope.
4. Run `bash .agents/skills/verify-before-pr/scripts/verify.sh` after all fixes.
5. Post one reply comment on the PR:

```markdown
### Review round <N>
1. <point> — fixed in <commit sha / file:line>
2. <point> — already done: <evidence>
3. <point> — not changed: <concrete technical reason>

<VERIFY SUMMARY block>
```

Rules:
- Never ignore a point silently. "Disagree" needs a concrete reason, not an opinion.
- Do not introduce unrelated changes while fixing review points.
- Do not start your reply with `@antigravity` (that would re-trigger yourself).
