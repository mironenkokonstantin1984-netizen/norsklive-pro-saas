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
