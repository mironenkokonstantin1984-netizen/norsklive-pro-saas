# Third-party skills

These three skills are copied without changes from
[rampstackco/claude-skills](https://github.com/rampstackco/claude-skills) at commit
`3d4510a94a76ead80122c691b5c480f92f3fbe40`, under the MIT license (text below).

| Skill | Why we keep it |
|---|---|
| `upgrade-flow-design` | Planning the free → Monthly upgrade and the 402 quota screen (value-triggered upgrade, no aggressive paywalls). |
| `onboarding-wizard-design` | Planning Nora's onboarding (exam date, level, L1) and the first-practice moment. |
| `accessibility-audit` | WCAG 2.1 AA audit before launch. |

They live in `.claude/skills/` so that Claude Code (planner and reviewer) can load them.
They are **not** in `.agents/skills/`, so Antigravity does not carry them in its context.
Some reference sibling skills from the upstream catalog (e.g. `design-standards`) that we do
not copy; for design, our own `docs/DESIGN_SYSTEM.md` wins.

To update: re-download the same paths from upstream, review the diff, and update the commit above.

## License

MIT License

Copyright (c) 2026 RampStack Co.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
