# Local Supabase Setup (`M1b-1`)

This project uses the Supabase CLI to run a complete local Supabase stack (PostgreSQL, Auth/GoTrue, PostgREST, Studio, and Mailpit) inside Docker containers.

## 1. Prerequisites

1. Install and start **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**.
2. Verify Docker is running:
   ```bash
   docker info
   ```
3. Install project dependencies (which includes the local `supabase` CLI devDependency):
   ```bash
   npm ci
   ```

## 2. Starting the Local Stack

Start all local Supabase containers:

```bash
npm run db:start
```

> **Note on PostgreSQL ports & isolation:**
> Local Supabase runs its own isolated PostgreSQL container mapped to host port **`54322`** (`127.0.0.1:54322`). It **does not touch or conflict** with any other PostgreSQL containers or instances you may have running on port `5432` or elsewhere on your machine.

### Local Service Ports

| Service | Local URL / Port | Purpose |
| :--- | :--- | :--- |
| **API Gateway (Kong)** | `http://127.0.0.1:54321` | Supabase REST / Auth / RPC endpoint (`NEXT_PUBLIC_SUPABASE_URL`) |
| **PostgreSQL DB** | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` | Local Postgres database (isolated on port `54322`) |
| **Supabase Studio** | `http://127.0.0.1:54323` | Local web dashboard for inspecting tables, RLS policies, and users |
| **Mailpit (Inbucket)** | `http://localhost:54324` | Captures all local auth/magic-link emails (no real emails are sent) |

## 3. Configuring `.env.local`

When `npm run db:start` finishes (or by running `npx supabase status -o env`), copy the printed API URL, `anon` key, and `service_role` key into `.env.local` (which is git-ignored):

```bash
npx supabase status -o env
```

Create or update `.env.local` in the project root:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-local-ANON_KEY>
# Server-only secret key — never expose in browser code
SUPABASE_SERVICE_ROLE_KEY=<your-local-SERVICE_ROLE_KEY>
```

## 4. Applying & Resetting Migrations

All SQL migrations live in `supabase/migrations/`:
- `0001_init.sql` — Core tables (`profiles`, `practice_sessions`, `turns`, `usage`, `subscriptions`), indexes, Row Level Security (RLS) policies, and `auth.users` signup trigger.
- `0002_usage_fn.sql` — Atomic `increment_ai_calls(uid uuid, d date)` server-only RPC function.

To reset the local database and re-apply all migrations from scratch:

```bash
npm run db:reset
```

## 5. Stopping the Local Stack

To stop the local Supabase containers when you are done working:

```bash
npm run db:stop
```

## 6. Login Locally (`M1b-2a`)

To enable magic-link authentication locally:

1. Set `AUTH_ENABLED=true` in `.env.local`:
   ```dotenv
   AUTH_ENABLED=true
   ```
2. Start the local Supabase stack (`npm run db:start`) and the Next.js server (`npm run dev` or `npm start`).
3. Open `http://localhost:3000/login` in your browser, enter any email address (e.g. `kari@norsklive.no`), and click **«Получить ссылку для входа»**.
4. Open **Mailpit** at `http://localhost:54324`, open the captured magic-link email, and click the login link (`http://localhost:3000/auth/callback?code=...`) in the same browser to sign in and return to `/`.

## 7. Quota (`M1b-2b-1`)

When `AUTH_ENABLED=true`, `/api/coach` enforces a daily AI-call quota per authenticated user (`src/server/quota.ts`):

- **Limits (`DAILY_LIMITS`):**
  - `free`: **20** calls / day
  - `exam_pass_90d`: **300** calls / day
  - `monthly`: **300** calls / day
- **Where calls are counted:**
  - User plan is read from `public.subscriptions(plan)` (missing row defaults to `free`).
  - Daily usage is atomically incremented in `public.usage (user_id, day, ai_calls)` via the `service_role`-only RPC `public.increment_ai_calls(uid, d)` (`supabase/migrations/0002_usage_fn.sql`), where `d` is today's calendar date in `Europe/Oslo`.
  - Over the daily limit, `/api/coach` responds with `HTTP 402` and `{ error: 'quota_exceeded', limit, plan }`.
- **Resetting quota locally:**
  - To clear all local usage counters and re-apply migrations from scratch:
    ```bash
    npm run db:reset
    ```


