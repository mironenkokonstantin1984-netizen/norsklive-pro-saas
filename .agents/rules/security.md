---
trigger: always_on
description: Security baseline for every change in this repository
---

# Security rules

- Secrets: never commit keys/tokens. Read them from `process.env` on the server only. Add each new
  variable to `.env.example` (name + comment, no real value).
- No provider SDK or API URL (Gemini, OpenAI, Stripe secret, Vipps, Supabase service role) may
  appear in `public/` or any client bundle.
- Every API route: validate input with zod, cap body size, apply a rate limit, return 400 on bad
  input without echoing internals.
- Outbound HTTP from the server: never to a user-supplied URL (SSRF). If ever required, use a
  strict allowlist of hostnames parsed with `new URL()`, not `includes()`.
- LLM prompts: user text goes in its own content part; never build JSON or instructions by
  string interpolation of user input. Validate model output with a schema before using it.
- Webhooks (Stripe/Vipps): verify signatures, make handlers idempotent by event id.
- Database (from M1): Row Level Security on every table; never use the service-role key in
  code reachable from the browser.
