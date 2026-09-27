---
trigger: always_on
description: Testing requirements for every change
---

# Testing rules

- Every new server function or API route gets unit tests: happy path, invalid input, failure of
  external dependency (e.g. LLM timeout → fallback).
- Bug fix = first a failing test that reproduces the bug, then the fix.
- Never skip, delete, or weaken an existing test to make the suite pass.
- Tests must not call real paid APIs; mock them. Tests must pass without any secrets set.
- Run `bash .agents/skills/verify-before-pr/scripts/verify.sh` before every push and paste its
  summary into the PR report.
