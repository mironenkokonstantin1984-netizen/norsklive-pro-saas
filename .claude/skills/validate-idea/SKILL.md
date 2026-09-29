---
name: validate-idea
description: Test a business or product idea against evidence before building it. Use when the owner brings a new idea, a new module or a new niche, or asks about market, risks or launch options. Produces a verdict (validated, needs more validation, pivot) plus the cheapest next step.
---

# validate-idea

Method after *The Minimalist Entrepreneur* by Sahil Lavingia (book and public repo
`slavingia/skills`). This text was written independently for NorskLive Pro; nothing is copied
from that repo. See `.claude/skills/THIRD_PARTY.md`.

Use it as planner or reviewer (Claude Code only). Answer the owner in Russian, in plain words.

## Core idea
An opinion is not evidence. Rank what you hear:
1. "Sounds nice" (worth nothing).
2. Leaves an e-mail or joins a waiting list (weak).
3. Books a call, sends a real example, or pre-commits to a price (medium).
4. Pays, even a small amount, for a manual version (strong).

Before writing code, try to deliver the result by hand to a few real people.

## Steps
1. **One-sentence customer.** Who exactly, in what situation, with what deadline or stake?
   "Adult who needs an A2 oral result for permanent residence" beats "immigrants".
2. **Current workaround.** What do they do today and what does it cost them (money, time,
   stress)? The workaround, not another app, is the real competitor.
3. **Pain and payment.** Score the pain 1 to 5. Are people already paying for something worse?
   Name at least two competitors with links and prices. If you did not verify a fact, write
   "not verified".
4. **Manual first.** Can the owner or the teacher deliver the result by hand this week to 3 to
   5 people? Describe the steps. If you cannot, the idea is not ready to be automated.
5. **Weekend test.** Could a first version be shown in 2 to 3 days? Would it improve a
   customer's day a little? Would someone pay for it now? How fast would feedback arrive?
6. **Risks.** Go through each and rate low, medium or high:
   - demand: no interviews, no payments yet;
   - competition and price pressure;
   - legal: site terms (no scraping of finn.no), copyright (no textbooks, no exam-prep banks),
     GDPR (personal data, voice and CVs stay in the EU/EEA);
   - unit economics: AI and speech cost per customer against the price (our target is at most
     25 NOK of LLM and speech cost per exam pass);
   - quality: can we prove the AI is right (see `docs/TEST_PLAN.md`, golden set at least 80 %)?
   - dependency: one teacher, one owner, one platform;
   - focus: does it pull time from the product that is not finished yet?
7. **Verdict.** Pick exactly one:
   - **Validated**: strong evidence, go to a minimal version;
   - **Needs more validation**: name the cheapest test, its deadline and a kill criterion;
   - **Pivot**: say what must change and to what.

## Red flags (stop and rethink)
- No existing workaround, so nobody is trying to solve it today.
- Cannot name 10 specific people with the problem.
- The only support is friends who like the idea.
- The customers must first be taught that they have the problem.
- The owner does not belong to the audience and has no access to it.

## Green flags
- People already pay for weaker solutions.
- A manual version made a few people happy.
- The audience complains about the problem in public.
- The customer and the pain fit in one sentence.

## Output template
```
Идея: <one line>
Клиент: <one sentence>
Как решают сейчас и сколько платят: <workaround, competitors with links and prices>
Боль (1-5) и готовность платить: <score, evidence level 1-4>
Вручную можно? <yes/no, how>
Риски: <table: risk, level, note>
Вердикт: <validated | needs more validation | pivot>
Ближайший дешёвый шаг: <what, who, deadline>
Критерий провала: <number that means stop>
```

## Rules for this project
- Do not invent market numbers. Mark unverified facts.
- Never propose scraping sites whose terms forbid it.
- The owner decides; the recommendation goes first, alternatives only if they change the choice.
- Save results in `docs/IDEA_VALIDATION.md` (update the row, do not create new files).
