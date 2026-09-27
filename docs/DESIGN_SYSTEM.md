# NorskLive Design System

A calm oral-exam trainer. The interface steps back; the conversation stays.

Approved by the owner. Visual reference with live component previews:
https://claude.ai/artifact/1CHZzTsfUan74nPeQCVuhP (private, owner access).
Tokens as CSS: `.agents/skills/design-system/tokens.css`. How to apply it in code:
`.agents/skills/design-system/SKILL.md`.

Sources: UX audit of the current site, competitors (Speak, Praktika, Duolingo Max, Langua,
Norwegian exam trainers), Apple HIG, Material 3, Apple Design Awards 2025–2026 winners
(Guitar Wiz, Pine Hearts, grug, Sago Mini, Moonlitt, Tide Guide, Primary, Speechify),
Google Material Design Award (Reflectly).

## 1. Principles
1. **One primary action per screen.** Exactly one filled `primary` button. Everything else is
   outline or text.
2. **Conversation first, feedback after.** While the learner speaks: the question, a timer and
   the mic only. Corrections, scores and hints appear after the turn.
3. **Progressive disclosure.** Show the single most important correction; "Ещё N" reveals the
   rest. L1 explanations are collapsed by default.
4. **Honest exam mode.** No hints (`hint` hidden), no feedback until the part ends, timings as in
   the HK-dir exam, no companion (see §8).
5. **Plain language.** Short sentences. Exam content in Norwegian Bokmål; UI in the learner's L1.
6. **Calm, not gamified.** No confetti, streak flames, points, leagues or mascots. Success is a
   check icon and one sentence.

## 2. Colour
Themes: `light` (default), `dark`, `contrast` (≥ 7:1). All text/background pairs ≥ 4.5:1,
field borders ≥ 3:1 (computed with the WCAG formula).

| Token | Role |
|---|---|
| `bg`, `surface`, `surface-2` | Ground, cards/sheets, recessed areas. Separate by tone, not borders. |
| `ink`, `muted` | Primary and secondary text. |
| `line`, `line-strong` | Hairlines; input and outline-button borders. |
| `primary`, `on-primary`, `primary-hover`, `primary-soft` | Fjord blue. Actions, links, focus ring, selected state. Never decoration. |
| `success`, `success-soft` | Pine. Correct form, criterion met. |
| `error`, `error-soft` | Lingonberry. Only the wrong fragment and its label, never a whole card. |
| `hint`, `hint-soft` | Amber. Tips, "try saying". Hidden in exam mode. |
| `recording` | Live mic ring only. |
| `scrim` | Behind sheets and dialogs. |

Colour is never the only signal: errors are also struck through (`<del>`), fixes use `<ins>`,
success has an icon.

## 3. Typography
Manrope from Google Fonts (weights 400/500/600/700, `display=swap`, via `next/font/google`),
fallback system stack. Sizes in `rem`; the layout must survive 200 % text.

| Class | Size / line / weight | Use |
|---|---|---|
| `.t-display` | 34 / 1.12 / 700 | One per screen max: onboarding, session result |
| `.t-title` | 24 / 1.2 / 700 | Screen title, exam part name |
| `.t-speech` | 20 / 1.45 / 500 | What the examiner and learner say — the largest running text |
| `.t-body` | 17 / 1.5 / 400 | Default text, L1 explanations |
| `.t-callout` | 15 / 1.45 / 600 | Button labels, card titles, rule names |
| `.t-caption` | 13 / 1.4 / 500 | Meta, timers, badges; never for something the learner must act on |

Nothing below 13 px. Running text max ~65 characters wide.

## 4. Layout and spacing
4 px step, 8 px base: `space-1` 4, `space-2` 8, `space-3` 12, `space-4` 16, `space-6` 24,
`space-8` 32, `space-12` 48. Phone gutter 16 px; desktop conversation column 640 px centred.
Use flex/grid `gap`, not margins between siblings. Radii: `radius-sm` 8 (chips, inputs),
`radius-md` 14 (cards, bubbles), `radius-lg` 22 (sheets), `radius-pill` (buttons, mic,
segmented control). Shadows only for floating things: `shadow-1` cards, `shadow-float` mic dock,
sheets, toasts.

## 5. Motion
- 150 ms (`duration-fast`) press feedback: `scale(0.97)`, fill change.
- 220 ms (`duration-base`) state change: tab, expand.
- 280 ms (`duration-slow`) enter/leave: sheet, new message (8 px rise + opacity).
- Easing `--ease-standard`; exits `--ease-exit`.
- Animate only `transform` and `opacity`.
- One signature motion: the mic ring (and Nora) "breathes" with the voice level while recording.
- `prefers-reduced-motion: reduce` → no animation; state is carried by labels.

## 6. Icons and copy
Lucide icons (`lucide-react`), 1.75 stroke, 20/24 px, `currentColor`. No emoji as icons.
Icon-only buttons need `aria-label`. Buttons name the action ("Начать часть 2", not "ОК").
No em-dashes or stacked exclamation marks in UI copy. Errors say what to do next.

## 7. Accessibility
Targets ≥ 44 px. Focus: 2 px `primary` outline, 2 px offset, `:focus-visible` only.
Recording state announced via `aria-live="polite"`. Contrast theme via `prefers-contrast: more`
or the Comfort sheet. **Voice-only mode:** everything shown can be heard (examiner, correction,
hint are spoken).

## 8. Components
Each must implement every listed state. Previews: see the artifact link above.

- **Button** — pill, 48 px high. Variants `primary` / `outline` / `text`. States: hover
  (`primary-hover`), pressed (scale 0.97), focus, loading (spinner + progressive verb,
  `aria-busy`), disabled (40 % opacity).
- **MicButton** — 72 px circle in a bottom dock (`shadow-float`, optional glass:
  `backdrop-filter: blur(16px)` on a translucent `surface`, disabled on low-end devices).
  States: idle (`primary`, mic icon, label "Snakk"), recording (`recording`, stop icon, breathing
  ring, timer "0:48 / 2:00", label "Слушаю"), processing (`surface-2`, three dots, disabled,
  "Думаю"), unavailable (mic-off icon + what to do). `aria-pressed`, label changes with state,
  Space/Enter toggles.
- **ExamStageTabs** — segmented control for Samtale / Bilde / Diskusjon. Sliding `surface` thumb
  on `surface-2` track (220 ms). Sub-label: time or "готово" in `success`. Locked in exam mode.
  `role="tablist"`, arrow keys. Replaces the current module buttons and sidebar.
- **CorrectionCard** — after a turn: meta (duration, level) → the utterance in `.t-speech` with
  the wrong part in `<del>` (`error` on `error-soft`) and the fix in `<ins>` (`success` on
  `success-soft`) → rule name → L1 explanation (`muted`) → "Попробуйте" hint (`hint`, hidden in
  exam mode) → "Ещё N замечания" (`aria-expanded`). Enters with the 280 ms rise.
- **ScoreBar** — per criterion: label, 8 px track, fill, B1 threshold mark, level label (A2/B1).
  No percentages. Below-threshold label is `muted`, not red. Mandatory note: "Оценка
  ориентировочная, это тренажёр, а не экзамен."
- **PracticeSettings ("Удобство")** — bottom sheet: text size (3 steps), examiner tempo
  0.8 / 1.0, voice-only switch, examiner subtitles switch, increased contrast switch.
  `role="switch"` + `aria-checked`; closes on swipe down, Esc, scrim tap. Saved to profile when
  signed in, otherwise `localStorage`.
- **Examiner subtitles** — the examiner's Norwegian line with the currently spoken word
  highlighted (`primary-soft` background), following TTS word boundaries.
- **Companion "Nora"** — see §9.

## 9. Companion: Nora
An abstract northern-light orb (soft radial blend of `success` and `primary`), no face, one warm
Norwegian TTS voice. States: idle (still), listening (breathes with the voice), thinking (slow
rotation), speaking (expanding rings).

- **Role:** onboarding (exam date, level, L1), suggests what to practise next (weakest part),
  pep talk before a mock exam, session summary, "Как ощущения?" (3 one-tap answers; "тревожно"
  makes the next session shorter and gentler).
- **Not the examiner.** In exam mode a neutral examiner speaks and Nora "waits outside", then
  returns with the debrief.
- **Honesty rules:** praises only specifics; says plainly it is an AI; no streak pressure or
  guilt; does not pretend to be a friend.

## 10. Patterns to build in M1c
- **Home = "Мой путь к B1"** (the learner's target level). The product is language learning
  with exam prep as one mode (see `docs/GO_TO_MARKET_PLAN.md`, "Стратегия"). Home shows: current
  level estimate, the next real-life situation to practise, the personal word deck, and an
  "Экзамен" entry with the days-until-exam countdown when an exam date is set.
- **Personal word deck** — words the learner stumbled on in conversation, reviewed with spaced
  repetition (one card at a time, speak the word in a sentence, no multiple-choice games).
- **Dagens setning** — one exam phrase per day, ~30 s, first attempt without an account.
- **Readiness screen** — one clear chart: the three exam parts vs days until the exam.
- **Finite sessions** — every session ends with a result and a clear finish, no endless feed.
- **Path** — levels A1 → A2 → B1 → B2 built from real situations (job interview, doctor, NAV,
  school); inside exam mode: Samtale → Bilde → Diskusjon → mock exam, unlocked step by step.

## 11. Do not
Gradients (except Nora's orb), 3D, realistic avatars, streak flames/points/leagues, confetti,
emoji icons, left-border accent cards, more than one filled button per screen, hardcoded colours
or pixel font sizes, glass on anything other than the mic dock and sheets.
