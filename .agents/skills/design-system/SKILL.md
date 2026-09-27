---
name: design-system
description: Apply the NorskLive design system when building or changing any UI (pages, components, styles, copy). Use for every M1c redesign task and whenever you touch files under src/app or src/components.
---

# Design system

The full spec is `docs/DESIGN_SYSTEM.md`. Read the sections for the component you are building
before writing code. Do not invent colours, sizes, radii, shadows or durations.

## Setup (once, only when the issue asks for it)
1. Copy `.agents/skills/design-system/tokens.css` to `src/styles/tokens.css` and import it once
   in `src/app/layout.tsx`.
2. Load Manrope with `next/font/google` (weights 400, 500, 600, 700) and make `--font-sans`
   start with that font.
3. Icons: `lucide-react`. Check its README in `node_modules` for the import style.

## Rules while coding
- Colours, spacing, radii, shadows, durations: always `var(--token)`. No hex, rgb or px font
  sizes in components. Type via the `.t-*` classes.
- One filled `primary` button per screen.
- Every interactive element implements the states listed for it in `docs/DESIGN_SYSTEM.md` §8:
  hover, pressed, `:focus-visible`, disabled, loading where relevant.
- Targets ≥ 44 px; icon-only buttons have `aria-label`.
- Animate only `transform` and `opacity`, with the duration tokens; respect
  `prefers-reduced-motion`.
- Exam mode hides hints and the companion.
- Exam content in Norwegian Bokmål; UI copy in the learner's L1. No emoji, no em-dashes,
  button labels are verbs.

## Self-check before push
- [ ] `git diff` has no hardcoded colours or px font sizes in `src/` (tokens.css excepted).
- [ ] Page checked at 390 px and 1440 px, in light, dark and `data-theme="contrast"`.
- [ ] Keyboard only: every control reachable, focus ring visible.
- [ ] Text zoom 200 %: nothing clipped or overlapping.
- [ ] RTL tests cover each new component's states (see `.agents/rules/testing.md`).
