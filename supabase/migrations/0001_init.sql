-- 0001_init.sql
-- M1b-1: Core schema, indexes, Row Level Security (RLS), and signup trigger

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  l1 text not null default 'ru' check (l1 in ('ru','ua','en')),
  target_level text not null default 'B1' check (target_level in ('A2','B1','B2')),
  exam_date date,
  created_at timestamptz not null default now()
);

create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  module text not null,
  scenario_id text not null,
  level text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  score_json jsonb
);

create table public.turns (
  id bigserial primary key,
  session_id uuid not null references public.practice_sessions on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('user','ai')),
  text text not null,
  correction_json jsonb,
  created_at timestamptz not null default now()
);

create table public.usage (
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  ai_calls int not null default 0,
  audio_seconds int not null default 0,
  primary key (user_id, day)
);

create table public.subscriptions (
  user_id uuid primary key references auth.users on delete cascade,
  plan text not null default 'free' check (plan in ('free','exam_pass_90d','monthly')),
  status text not null default 'active',
  provider text,
  provider_ref text,
  current_period_end timestamptz
);

create index idx_turns_session_id_created_at
  on public.turns (session_id, created_at);

create index idx_practice_sessions_user_id_started_at_desc
  on public.practice_sessions (user_id, started_at desc);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.turns enable row level security;
alter table public.usage enable row level security;
alter table public.subscriptions enable row level security;

-- Select own rows on all five tables
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "practice_sessions_select_own"
  on public.practice_sessions for select
  using (auth.uid() = user_id);

create policy "turns_select_own"
  on public.turns for select
  using (auth.uid() = user_id);

create policy "usage_select_own"
  on public.usage for select
  using (auth.uid() = user_id);

create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Insert and update own row on profiles only
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

