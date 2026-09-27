// @vitest-environment node
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSupabaseAdminClient } from '../src/server/supabaseAdmin';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey);

if (!hasSupabaseEnv) {
  console.info(
    'Skipping RLS integration tests: SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY must be set.'
  );
}

describe('supabaseAdmin client validation', () => {
  it('throws a clear error if SUPABASE_SERVICE_ROLE_KEY is missing', () => {
    const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const prevUrl = process.env.SUPABASE_URL;
    try {
      process.env.SUPABASE_URL = 'http://127.0.0.1:54321';
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      expect(() => createSupabaseAdminClient()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
    } finally {
      if (prevKey !== undefined) {
        process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
      }
      if (prevUrl !== undefined) {
        process.env.SUPABASE_URL = prevUrl;
      } else {
        delete process.env.SUPABASE_URL;
      }
    }
  });
});

const describeRls = hasSupabaseEnv ? describe : describe.skip;

describeRls('M1b-1 Supabase RLS & RPC integration tests', () => {
  let adminClient: SupabaseClient;
  let userAClient: SupabaseClient;
  let userBClient: SupabaseClient;
  let userAId = '';
  let userBId = '';
  let sessionAId = '';

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const userAEmail = `user-a-${runId}@example.com`;
  const userBEmail = `user-b-${runId}@example.com`;
  const password = 'TestPassword123!';

  beforeAll(async () => {
    adminClient = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    userAClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    userBClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });

  afterAll(async () => {
    if (adminClient) {
      if (userAId) {
        await adminClient.auth.admin.deleteUser(userAId);
      }
      if (userBId) {
        await adminClient.auth.admin.deleteUser(userBId);
      }
    }
  });

  it('1. admin creates users A and B -> profiles and subscriptions(plan="free") rows exist for both via signup trigger', async () => {
    const { data: createdA, error: errA } = await adminClient.auth.admin.createUser({
      email: userAEmail,
      password,
      email_confirm: true,
    });
    expect(errA).toBeNull();
    expect(createdA.user).toBeDefined();
    userAId = createdA.user!.id;

    const { data: createdB, error: errB } = await adminClient.auth.admin.createUser({
      email: userBEmail,
      password,
      email_confirm: true,
    });
    expect(errB).toBeNull();
    expect(createdB.user).toBeDefined();
    userBId = createdB.user!.id;

    const { data: profiles, error: profErr } = await adminClient
      .from('profiles')
      .select('id, l1, target_level')
      .in('id', [userAId, userBId]);
    expect(profErr).toBeNull();
    expect(profiles).toHaveLength(2);

    const { data: subs, error: subErr } = await adminClient
      .from('subscriptions')
      .select('user_id, plan, status')
      .in('user_id', [userAId, userBId]);
    expect(subErr).toBeNull();
    expect(subs).toHaveLength(2);
    for (const sub of subs ?? []) {
      expect(sub.plan).toBe('free');
      expect(sub.status).toBe('active');
    }
  });

  it('2. admin inserts a practice_sessions row + one turns row for A; A selects 1 row, B selects 0 rows', async () => {
    const { data: sessionRow, error: sessErr } = await adminClient
      .from('practice_sessions')
      .insert({
        user_id: userAId,
        module: 'exam',
        scenario_id: 'hkdir_utdanning',
        level: 'B1',
      })
      .select('id')
      .single();

    expect(sessErr).toBeNull();
    expect(sessionRow?.id).toBeTruthy();
    sessionAId = sessionRow!.id;

    const { error: turnErr } = await adminClient.from('turns').insert({
      session_id: sessionAId,
      user_id: userAId,
      role: 'user',
      text: 'Jeg mener at livslang læring er viktig.',
    });
    expect(turnErr).toBeNull();

    const { error: signInAErr } = await userAClient.auth.signInWithPassword({
      email: userAEmail,
      password,
    });
    expect(signInAErr).toBeNull();

    const { error: signInBErr } = await userBClient.auth.signInWithPassword({
      email: userBEmail,
      password,
    });
    expect(signInBErr).toBeNull();

    const { data: aTurns, error: aSelectErr } = await userAClient
      .from('turns')
      .select('*')
      .eq('session_id', sessionAId);
    expect(aSelectErr).toBeNull();
    expect(aTurns).toHaveLength(1);
    expect(aTurns![0].text).toBe('Jeg mener at livslang læring er viktig.');

    const { data: bTurns, error: bSelectErr } = await userBClient
      .from('turns')
      .select('*')
      .eq('session_id', sessionAId);
    expect(bSelectErr).toBeNull();
    expect(bTurns).toHaveLength(0);
  });

  it('3. user A client insert into turns is rejected by RLS and inserts no row', async () => {
    const { error: insertErr } = await userAClient.from('turns').insert({
      session_id: sessionAId,
      user_id: userAId,
      role: 'user',
      text: 'Direct client insert attempt',
    });

    expect(insertErr).not.toBeNull();

    const { data: allTurns } = await adminClient
      .from('turns')
      .select('id')
      .eq('session_id', sessionAId);
    expect(allTurns).toHaveLength(1);
  });

  it('4. admin rpc("increment_ai_calls") twice returns 1 then 2; user A client calling same rpc fails', async () => {
    const today = '2026-09-27';

    const { data: call1, error: err1 } = await adminClient.rpc('increment_ai_calls', {
      uid: userAId,
      d: today,
    });
    expect(err1).toBeNull();
    expect(call1).toBe(1);

    const { data: call2, error: err2 } = await adminClient.rpc('increment_ai_calls', {
      uid: userAId,
      d: today,
    });
    expect(err2).toBeNull();
    expect(call2).toBe(2);

    const { error: userRpcErr } = await userAClient.rpc('increment_ai_calls', {
      uid: userAId,
      d: today,
    });
    expect(userRpcErr).not.toBeNull();
  });
});
