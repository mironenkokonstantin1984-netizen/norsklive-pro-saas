---
name: pr-report
description: How to write or update the pull request description after finishing a task or a review round. Use whenever you open a PR, push changes to a PR, or are asked for a status report.
---

# PR report

Update the PR description (or post a PR comment when the description is already filled) using
this exact structure. Do not start the comment with `@antigravity`.

```markdown
## Summary
<2–4 sentences: what changed and why>

Closes #<issue number>

## Acceptance criteria
- [x] <criterion copied verbatim from the issue> — evidence: <command + short output / file:line>
- [ ] <criterion not met> — why: <reason>

## Verify
<paste the VERIFY SUMMARY block from verify.sh>

## New env vars
<NAME — purpose, or "none">

## New dependencies
<package — why needed, or "none">

## Blocked / questions
<anything ambiguous or not done, or "none">
```

Rules:
- Copy criteria verbatim from the issue; never tick one without evidence.
- Never claim tests pass without having run them in this round.
