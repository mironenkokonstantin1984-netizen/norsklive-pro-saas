-- 0002_usage_fn.sql
-- M1b-1: Atomic server-only RPC function to increment daily AI calls per user

create or replace function public.increment_ai_calls(uid uuid, d date)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_calls int;
begin
  insert into public.usage (user_id, day, ai_calls)
  values (uid, d, 1)
  on conflict (user_id, day)
  do update set ai_calls = public.usage.ai_calls + 1
  returning ai_calls into new_calls;

  return new_calls;
end;
$$;

revoke execute on function public.increment_ai_calls(uuid, date) from public, anon, authenticated;
grant execute on function public.increment_ai_calls(uuid, date) to service_role;
