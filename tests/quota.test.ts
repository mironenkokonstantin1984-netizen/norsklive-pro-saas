// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DAILY_LIMITS,
  checkAndCountAiCall,
  type QuotaAdminClientLike,
  type SubscriptionPlan
} from '../src/server/quota';
import { createCoachHandler } from '../src/server/coachHandler';
import { QuotaExceededError, postCoach } from '../src/lib/coachClient';

function makeMockAdminClient(options: {
  plan?: SubscriptionPlan | null;
  subError?: Error | null;
  usedCalls?: number;
  rpcError?: Error | null;
}): QuotaAdminClientLike {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: options.plan ? { plan: options.plan } : null,
            error: options.subError ?? null
          })
        })
      })
    }) as unknown as QuotaAdminClientLike['from'],
    rpc: vi.fn().mockResolvedValue({
      data: options.usedCalls ?? 1,
      error: options.rpcError ?? null
    }) as unknown as QuotaAdminClientLike['rpc']
  };
}

const VALID_COACH_BODY = {
  module: 'norskprove' as const,
  scenarioId: 'hkdir_utdanning',
  level: 'B1' as const,
  l1: 'ru' as const,
  persona: 'standard' as const,
  userText: 'Jeg mener at utdanning er viktig for samfunnet.',
  history: [],
  usedWords: []
};

describe('M1b-2b-1 Daily AI quota unit tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. free under the limit (20) -> allowed', async () => {
    const mockClient = makeMockAdminClient({ plan: 'free', usedCalls: 20 });
    const result = await checkAndCountAiCall('user-1', {
      getAdminClient: () => mockClient,
      now: new Date('2026-09-28T10:00:00Z')
    });

    expect(result).toEqual({
      allowed: true,
      used: 20,
      limit: DAILY_LIMITS.free,
      plan: 'free'
    });
  });

  it('2. free at 21 -> 402 from the handler with { error: "quota_exceeded", limit: 20, plan: "free" }', async () => {
    const mockClient = makeMockAdminClient({ plan: 'free', usedCalls: 21 });
    const handler = createCoachHandler({
      authEnabled: () => true,
      getUser: async () => ({ id: 'user-free-21' }),
      quota: (uid) =>
        checkAndCountAiCall(uid, {
          getAdminClient: () => mockClient,
          now: new Date('2026-09-28T10:00:00Z')
        })
    });

    const req = new Request('http://localhost:3000/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_COACH_BODY)
    });

    const res = await handler(req);
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body).toEqual({
      error: 'quota_exceeded',
      limit: 20,
      plan: 'free'
    });
  });

  it('3. monthly at 300 -> allowed (200); monthly at 301 -> 402 from the handler', async () => {
    const clientAt300 = makeMockAdminClient({ plan: 'monthly', usedCalls: 300 });
    const handler300 = createCoachHandler({
      authEnabled: () => true,
      getUser: async () => ({ id: 'user-monthly' }),
      quota: (uid) =>
        checkAndCountAiCall(uid, {
          getAdminClient: () => clientAt300
        })
    });

    const res300 = await handler300(
      new Request('http://localhost:3000/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(VALID_COACH_BODY)
      })
    );
    expect(res300.status).toBe(200);

    const clientAt301 = makeMockAdminClient({ plan: 'monthly', usedCalls: 301 });
    const handler301 = createCoachHandler({
      authEnabled: () => true,
      getUser: async () => ({ id: 'user-monthly' }),
      quota: (uid) =>
        checkAndCountAiCall(uid, {
          getAdminClient: () => clientAt301
        })
    });

    const res301 = await handler301(
      new Request('http://localhost:3000/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(VALID_COACH_BODY)
      })
    );
    expect(res301.status).toBe(402);
    expect(await res301.json()).toEqual({
      error: 'quota_exceeded',
      limit: 300,
      plan: 'monthly'
    });
  });

  it('4. missing subscription row defaults to free plan (limit 20)', async () => {
    const mockClient = makeMockAdminClient({ plan: null, usedCalls: 5 });
    const result = await checkAndCountAiCall('user-no-sub', {
      getAdminClient: () => mockClient
    });

    expect(result).toEqual({
      allowed: true,
      used: 5,
      limit: 20,
      plan: 'free'
    });
  });

  it('5. Supabase error fails open (allowed: true) and logs console.error without user data', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockClient = makeMockAdminClient({
      subError: new Error('Database connection refused')
    });

    const sensitiveUserId = 'secret-user-uuid-999';
    const result = await checkAndCountAiCall(sensitiveUserId, {
      getAdminClient: () => mockClient
    });

    expect(result.allowed).toBe(true);
    expect(errSpy).toHaveBeenCalledTimes(1);
    const loggedMessage = String(errSpy.mock.calls[0]?.[0] ?? '');
    expect(loggedMessage).not.toContain(sensitiveUserId);
  });

  it('6. auth off -> quota check is never called', async () => {
    const quotaSpy = vi.fn();
    const handler = createCoachHandler({
      authEnabled: () => false,
      quota: quotaSpy
    });

    const res = await handler(
      new Request('http://localhost:3000/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(VALID_COACH_BODY)
      })
    );

    expect(res.status).toBe(200);
    expect(quotaSpy).not.toHaveBeenCalled();
  });

  it('7. coachClient maps HTTP 402 to QuotaExceededError carrying limit and plan', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: 'quota_exceeded',
          limit: 20,
          plan: 'free'
        }),
        {
          status: 402,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    );

    let caught: unknown;
    try {
      await postCoach(VALID_COACH_BODY);
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(QuotaExceededError);
    const quotaErr = caught as QuotaExceededError;
    expect(quotaErr.limit).toBe(20);
    expect(quotaErr.plan).toBe('free');
  });
});

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey);

const describeQuotaIntegration = hasSupabaseEnv ? describe : describe.skip;

describeQuotaIntegration('M1b-2b-1 Supabase quota RPC integration test', () => {
  it('seeds a user, calls increment_ai_calls 21 times (21st returns 21), and rejects anon/authenticated RPC calls', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const anonClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const authClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `quota-user-${runId}@example.com`;
    const password = 'TestPassword123!';

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    expect(createErr).toBeNull();
    const userId = created.user!.id;

    try {
      const today = '2026-09-28';
      let lastCount = 0;
      for (let i = 1; i <= 21; i++) {
        const { data, error } = await adminClient.rpc('increment_ai_calls', {
          uid: userId,
          d: today
        });
        expect(error).toBeNull();
        lastCount = data as number;
      }
      expect(lastCount).toBe(21);

      const { error: anonRpcErr } = await anonClient.rpc('increment_ai_calls', {
        uid: userId,
        d: today
      });
      expect(anonRpcErr).not.toBeNull();

      const { error: signInErr } = await authClient.auth.signInWithPassword({
        email,
        password
      });
      expect(signInErr).toBeNull();

      const { error: authRpcErr } = await authClient.rpc('increment_ai_calls', {
        uid: userId,
        d: today
      });
      expect(authRpcErr).not.toBeNull();
    } finally {
      await adminClient.auth.admin.deleteUser(userId);
    }
  });
});

