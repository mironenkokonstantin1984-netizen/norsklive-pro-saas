# Техническое задание для агента-разработчика — NorskLive Pro

## Context
Пользователь хочет получить готовое к копированию ТЗ для агента (Claude Code / Codex / Lovable-агент и т.п.), написанное на техническом языке, по шагам — на основе go-to-market плана (`docs/GO_TO_MARKET_PLAN.md`, ветка `claude/gracious-ptolemy-0lj0lj`). Ниже — сам промпт для агента (на английском: агенты точнее следуют техническим ТЗ на английском; комментарии для пользователя — по-русски в чате).

Проверено по коду перед написанием ТЗ:
- `public/norsk/app.js:18-19` — ключ и модель Gemini из `localStorage`; `:150`, `:414` — проверка `startsWith('AIza')`; `:446-492` `callGeminiCoachAPI()` — прямой `fetch` к `generativelanguage.googleapis.com` из браузера, `userText` вставляется в промпт без экранирования; `:494+` `generateStrategicRAndDFallback()` — rule-based fallback (переиспользовать); `:664-686` `handleScrapeFinnUrl()`; `:846-860` обработчики API-модалки.
- `public/norsk/index.html:58-59` кнопка API, `:95-110` блок Finn-скрейпера, `:278-321` модалка «SkatteFUNN» (внутренняя информация, не для клиентов), `:324-350` модалка ключа Gemini.
- `server.js:14-51` — `/api/scrape-finn` (SSRF через `url.includes('finn.no')`, нет таймаута/лимита размера, нарушает условия FINN).
- `vercel.json` переписывает все пути на статические файлы, `server.js` на Vercel **не исполняется** → в проде `/api/*` сейчас не работает вообще.
- `public/index.html|app.js|data.js|styles.css`, `public/vercel.json` — чужой проект (FIFA 2026), `package.json` name `fifa-world-cup-2026-predictor`.
- Нет тестов, линтера, CI, `.env.example`.

---

## ПРОМПТ ДЛЯ АГЕНТА (копировать целиком)

```
ROLE: Senior full-stack engineer. Repo: mironenkokonstantin1984-netizen/norsklive-pro-saas.
Product: NorskLive Pro — AI trainer for the Norwegian oral exam "Norskprøve muntlig" (HK-dir),
levels A2/B1, explanations in the user's L1 (ru/uk/en). Goal: turn the current static MVP into a
production SaaS. Read docs/GO_TO_MARKET_PLAN.md first for business context.

GLOBAL RULES
- Work in small PR-sized milestones in the order below. One milestone = one branch + one PR.
  Do not start milestone N+1 until N passes its acceptance criteria.
- Never put secrets in client code or git. All provider keys live in server env vars; add
  every new var to .env.example with a comment.
- All personal data (accounts, transcripts, audio) must stay in EU/EEA regions.
- Reuse existing logic where noted instead of rewriting it.
- Every milestone: `npm run lint`, `npm run typecheck` (from M1), `npm test` must pass;
  add tests for new server logic. Report what you verified and what you could not.
- UI copy: Norwegian Bokmål for exam content; UI chrome in ru/uk/en/nb via i18n files,
  no hard-coded Russian strings in components.
- Do not scrape finn.no or any site whose ToS forbids it.

────────────────────────────────────────────
M0 — Repository cleanup & security hotfix (existing Express + vanilla JS stack)
────────────────────────────────────────────
0.1 Delete the unrelated FIFA project: public/index.html, public/app.js, public/data.js,
    public/styles.css, public/vercel.json. Move public/norsk/* to public/ so the trainer is
    served at "/". Keep a 301 redirect /norsk -> /.
0.2 package.json: name "norsklive-pro", description, author, "engines": {"node": ">=20"}.
    Add scripts: lint (eslint), format (prettier), test (node --test or vitest).
0.3 Remove the Finn.no scraper entirely: POST /api/scrape-finn in server.js,
    handleScrapeFinnUrl() and its listeners in app.js, the Finn URL block in index.html.
    Keep the "paste job ad text" textarea (handleApplyCustomSource) as the only input.
0.4 Remove the client-side Gemini key flow: state.apiKey / state.modelName, localStorage keys
    norsklive_gemini_key / norsklive_gemini_model, the API-key modal (index.html #apiModal),
    updateApiStatusBadge(), openApiModalBtn handlers. Remove the internal
    "SkatteFUNN & Архитектура" modal (#grantModal) from the customer UI.
0.5 Add server endpoint POST /api/coach:
    - body: { module, scenarioId, level, l1, persona, userText, history[] } validated with zod
      (userText ≤ 1000 chars, history ≤ 20 turns, enums for module/level/l1/persona).
    - server builds the prompt (move the prompt from callGeminiCoachAPI() in app.js to
      server/prompts/coach.js); pass userText as a separate content part, never interpolated
      into the JSON template (prompt-injection hardening).
    - call Gemini with GEMINI_API_KEY from env, responseMimeType application/json, timeout 20s;
      validate the model output with a zod schema matching the current result shape
      {reply_norsk, reply_l1, correction{...}, next_hints[]}.
    - on any failure return the rule-based result: port generateStrategicRAndDFallback()
      from app.js to server/fallback.js and reuse it.
    - rate limit: 30 req / 10 min per IP (express-rate-limit), body limit 16kb, helmet.
    Client: handleUserSubmission() calls fetch('/api/coach') instead of callGeminiCoachAPI().
0.6 Vercel compatibility: export the Express app from api/index.js (serverless) and fix
    vercel.json so /api/* hits the function and everything else serves static files.
    Keep `npm start` working locally.
0.7 Add .env.example (GEMINI_API_KEY, GEMINI_MODEL=gemini-2.5-flash), ESLint+Prettier config,
    GitHub Actions workflow .github/workflows/ci.yml running lint + test on PRs.
0.8 Update README.md: what the product is, how to run, env vars. Remove Windows paths
    (c:\Eagy2-project-...) from NORSKLIVE_PRO_SAAS_BLUEPRINT_2026.md.
ACCEPTANCE M0:
- `npm start` → http://localhost:3000/ shows the trainer; no FIFA content anywhere.
- grep for "generativelanguage.googleapis.com", "AIza", "localStorage.setItem('norsklive_gemini"
  in public/ returns nothing.
- POST /api/scrape-finn → 404. POST /api/coach with valid body → 200 JSON matching schema;
  without GEMINI_API_KEY → 200 with fallback result; invalid body → 400.
- Unit tests: request validation, fallback (V2-inversion "I dag jeg ..." detected,
  "Jeg tenker at miljø er viktig" → A2), rate limiter.

────────────────────────────────────────────
M1 — Platform migration: Next.js + local Supabase (split into M1a and M1b)
────────────────────────────────────────────
Decision (owner): develop against local Supabase running in Docker via the Supabase CLI;
connect a cloud Supabase project in the EU (Frankfurt/Stockholm) only before launch.
The Supabase CLI runs its own Postgres (port 54322), so it does not clash with other
local Postgres containers.

M1a — Next.js migration, no database (issue #4)
1.1 Create a Next.js 15 (App Router, TypeScript strict, Tailwind) app in the repo root; move
    the trainer UI into React components (StudioPage, ModuleTabs, ChatPanel, CoachingPanel,
    TargetWordsPanel, VoiceOrb) with 1:1 behaviour. Port public/scenarios.js to typed data
    in src/content/scenarios/*.ts.
1.2 Move /api/coach to src/app/api/coach/route.ts, porting server/schemas, server/fallback,
    server/prompts to src/server/*.ts without rewriting the logic; keep all M0 guarantees
    (validation, 16 KB limit, 20 s timeout, fallback, 500 without details, per-IP rate limit).
1.3 Security headers and /norsk redirect in next.config; tests ported to Vitest; CI runs
    lint + typecheck + test + build. Express, helmet, supertest removed.
ACCEPTANCE M1a: app works as before under `npm run dev`; lint/typecheck/test/build green;
no Gemini URL or key in .next/static; verify.sh PASS.

M1b — Local Supabase: auth, data, quotas (created after M1a is merged)
1.4 `supabase init` / `supabase start` (Docker). SQL migrations in supabase/migrations with
    RLS on every table (user can only read/write own rows):
      profiles(id uuid pk = auth.uid, l1, target_level, exam_date, created_at)
      practice_sessions(id, user_id, module, scenario_id, level, started_at, ended_at, score_json)
      turns(id, session_id, role, text, correction_json, created_at)
      usage(user_id, day date, ai_calls int, audio_seconds int, pk(user_id, day))
      subscriptions(user_id, plan, status, provider, provider_ref, current_period_end)
1.5 Auth via @supabase/ssr: email magic link (local mail UI at localhost:54324); Google
    OAuth prepared in config but optional locally.
1.6 /api/coach requires auth; persists turns; increments usage; enforces plan quota
    (free: 20 AI calls/day, paid: 300/day) → 402 with upgrade payload when exceeded.
1.7 Env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
    (server only). docs/SUPABASE_LOCAL.md explains setup. CI starts Supabase with
    supabase/setup-cli before tests.
ACCEPTANCE M1b: sign up → practice → reload → history persists; RLS tests prove user A
cannot read user B rows; quota returns 402; Playwright e2e covers signup→first turn.

Before launch (not an agent task): create the cloud Supabase project in the EU, run the
migrations there, and switch Gemini to Vertex AI in an EU region (europe-north1 or
europe-west4) with data-processing terms documented in docs/PRIVACY_TECH.md.

Testing levels (owner-facing):
  1. Prototype on Vercel (now): conversation and feedback, no accounts.
  2. Full cycle locally after M1b-2b: signup → practice → reload → history → 402; Playwright e2e
     in CI on every PR.
  3. Cloud staging after M1c: EU Supabase project + EU Gemini + Vercel env (`AUTH_ENABLED=true`),
     Sentry for errors, manual checklist `docs/TEST_CHECKLIST.md` (created in M1c).
  4. Closed beta after M2 (server-side speech recognition, Safari/iPhone).

────────────────────────────────────────────
M1d — "Mine tekster": learn Norwegian from the learner's own texts (after M1c)
────────────────────────────────────────────
Extends the existing `pensum` custom-text loader (`ScenarioPanel.tsx` → `customScenario.sourceText`,
4000-char limit in `schemas.ts`) into a saved, AI-prepared study text.
M1d-1 Upload and prepare
  - Input: paste text, .txt, .pdf with a text layer, .docx. Max 5 MB and ~20 000 characters;
    longer → the learner picks a section. No OCR, no URL fetching (copyright and site terms).
  - Server Route Handler (Node runtime) extracts text; pick libraries by their README
    (e.g. pdf-parse, mammoth). zod validation, size limits, usage counted in `usage`.
  - New table `documents(id, user_id, title, text, level, summary_json, created_at)` with RLS
    (owner only), delete button. Store extracted text only, never the file.
  - AI prepares: level-adapted summary (A2/B1/B2), 8–15 key words with L1 translation,
    5 discussion questions. The document text goes to the model as a delimited data block,
    never as instructions (prompt-injection guard); test with a text containing
    "ignore previous instructions".
M1d-2 Talk about the text
  - Voice conversation about the chosen document with the existing coach engine and
    corrections; key words go into the personal word deck; free plan: 1 document.
ACCEPTANCE M1d: upload a PDF article → summary, words and questions appear in the learner's
level → a 5-turn conversation stays on the topic → another user cannot read the document
(RLS test) → injection test passes → delete removes the row.

────────────────────────────────────────────
M2 — Exam simulator that matches the real HK-dir oral test (core product)
────────────────────────────────────────────
2.1 New exam flow for A2 and B1, timed, in this order (verify wording against
    https://prove.hkdir.no/norskprove-a1-b2/les-om-proven-norsk-A1-B2/om-muntlig-prove):
      Task 1 short self-presentation; Task 2 picture description; Task 3 paired conversation
      with an AI co-candidate on an everyday topic (persona: standard | interrupting | passive —
      reuse existing persona prompts); Task 4 examiner follow-up questions.
2.2 Picture tasks: content model {id, level, imageUrl, alt, expectedVocabulary[]}; seed
    ≥ 20 original images (AI-generated or licensed; store licence info). No textbook content
    (På vei, Stein på stein, etc.).
2.3 Server-side STT: record audio with MediaRecorder (webm/opus), upload to
    /api/transcribe, transcribe with Gemini audio input (EU) instructed to transcribe
    verbatim WITHOUT correcting grammar; keep Web Speech API only as a fallback. Store audio
    in Supabase Storage (EU) with 30-day TTL (scheduled cleanup job).
2.4 Scoring: /api/score takes the full exam transcript and returns zod-validated JSON:
    {criteria:{kommunikasjon, ordforraad, grammatikk, uttale_flyt, samhandling}: 1-5 each,
     level_estimate: "under A2"|"A2"|"B1"|"B2", pass_prediction:{A2:bool,B1:bool},
     top3_tips_l1:[...], examples:[{original, improved, rule_l1}]}.
    Build a golden set of 30 hand-labelled transcripts in tests/fixtures and a script
    `npm run eval:scoring` that reports agreement with labels.
2.5 Results page + history chart; exam-date countdown on the dashboard.
ACCEPTANCE M2: full A2 mock exam completes end-to-end in Chrome and Safari; eval script
runs and prints agreement; audio TTL job tested.

────────────────────────────────────────────
M3 — Payments
────────────────────────────────────────────
3.1 Plans: free; exam_pass_90d = 490 NOK one-off; monthly = 249 NOK recurring.
3.2 Stripe Checkout (cards, NOK) + webhooks /api/webhooks/stripe (signature verified,
    idempotent by event id) → subscriptions table.
3.3 Vipps MobilePay: ePayment API for exam_pass_90d, Recurring API for monthly; webhooks
    /api/webhooks/vipps; test mode first. Abstract behind src/server/billing/provider.ts.
3.4 Pricing page, upgrade modal on 402, billing page (cancel, receipts).
ACCEPTANCE M3: test-mode purchase via Stripe and Vipps test flips plan and quota; replayed
webhook does not double-apply; cancel works.

────────────────────────────────────────────
M4 — Launch readiness
────────────────────────────────────────────
4.1 Legal pages (nb/en/ru/uk): personvernerklæring, brukervilkår, cookie notice; explicit
    consent checkbox for voice recording; account deletion endpoint that removes all rows
    and audio; data export (JSON). Footer disclaimer: not affiliated with HK-dir.
4.2 Landing page (nb/en/ru/uk) with free 5-minute level check as lead magnet; SEO
    metadata, sitemap, OG images.
4.3 PostHog (EU cloud) events: signup, first_turn, exam_completed, paywall_shown,
    checkout_started, purchase_completed. Sentry for client+server errors.
4.4 Security pass: headers/CSP, rate limits on all /api routes, dependency audit,
    run /security-review.
ACCEPTANCE M4: Lighthouse ≥ 90 perf/accessibility on landing; deletion removes all user
data (test); analytics funnel visible in PostHog.

DELIVERABLE PER MILESTONE: PR with summary, checklist of acceptance criteria (ticked with
evidence: test output, screenshots), list of new env vars, known limitations.
```

---

## Как пользоваться (для пользователя)
1. Отдавать агенту **по одному milestone** (M0 → M4), прикладывая общий блок «GLOBAL RULES».
2. После каждого PR — проверить критерии приёмки и только потом давать следующий.
3. Перед M1 нужно самому создать: проект Supabase (регион EU), Google Cloud проект с Vertex AI; перед M3 — Stripe-аккаунт и Vipps MobilePay merchant (нужен org.nr → сначала AS).

## Verification
- M0 проверяется локально: `npm start`, `curl -X POST localhost:3000/api/coach ...`, `npm test`, grep по `public/` на ключ/URL Gemini.
- Дальше — Playwright e2e и CI в каждом PR, как указано в критериях приёмки.
