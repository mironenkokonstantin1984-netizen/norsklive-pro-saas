# REVIEW.md — what the reviewer (Claude Code) checks in this repository

Short on purpose. Context for the product is in `AGENTS.md`; the review process is in
`docs/REVIEW_POLICY.md`.

## What "wrong" looks like here
- **Learner-facing text lies.** Fake or hard-coded coach feedback, a summary that claims things
  the learner did not do, an explanation in the wrong L1. This is a blocker, not a nit.
- **Coach/LLM paths misroute.** Fallback text shown as if it were a real coach answer
  (`source: 'fallback'` is not a real answer); a missing key must show the calm "coach down" state.
- **Secrets and personal data.** No LLM, TTS or payment call from browser code; keys never in the
  client bundle or logs; learner text, audio and accounts stay in EU/EEA regions.
- **Design system.** No hex colors or px font sizes in new CSS (tokens only), touch targets
  ≥ 44 px, one filled button per screen, no emoji, no horizontal scroll at 390×844.
- **Evidence.** Screenshots and test output in the PR must show the thing the task is about.
  A screenshot taken mid-animation or of the wrong state is a blocker.

## How to review
- Give a file and line (or a command and its output) for every finding. No guesses from names.
- Start the summary with a count: "2 blocking, 1 nit", or say plainly "nothing to fix".
- Tag each point **Blocking**, **Nit** or **Pre-existing**. Pre-existing problems go into the PR
  report as a note, never into the author's fix list.
- Cap nits at three per round. Skip generated files, `docs/screenshots/*.png` content other than
  the screenshots the task names, and lockfiles.

## Convergence (review must end)
- Round 1 is a full review. From round 2, review **only the new diff** plus the points still open.
- Do not repeat a finding that was already posted. Do not raise new nits on code that was in the
  PR at round 1.
- Name the **class** of a bug ("hydration mismatch from reading localStorage during render"), so
  the author fixes every instance, not one line.
- After round 3 stop and ask the author to step back and reconsider the approach instead of
  posting round 4 patches.
- Write `✅ … accepted` only for the exact commit that was checked. A new commit needs a new check.
