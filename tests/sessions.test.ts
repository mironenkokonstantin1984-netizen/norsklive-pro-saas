// @vitest-environment node
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  appendTurns,
  getLatestSessionWithTurns,
  getOrCreateSession,
  type PracticeSessionRow,
  type SessionClientLike,
  type TurnRow
} from '../src/server/sessions';
import { createCoachHandler } from '../src/server/coachHandler';
import { createCurrentSessionHandler } from '../src/server/sessionsCurrentHandler';

function createInMemorySessionClient(initial?: {
  sessions?: PracticeSessionRow[];
  turns?: TurnRow[];
}): {
  client: SessionClientLike;
  sessions: PracticeSessionRow[];
  turns: TurnRow[];
} {
  const sessions: PracticeSessionRow[] = [...(initial?.sessions ?? [])];
  const turns: TurnRow[] = [...(initial?.turns ?? [])];
  let nextTurnId = turns.length + 1;

  const client: SessionClientLike = {
    from: ((table: string) => {
      if (table === 'practice_sessions') {
        const filters: Record<string, unknown> = {};
        return {
          select: () => ({
            eq(col: string, val: unknown) {
              filters[col] = val;
              return this;
            },
            order() {
              return this;
            },
            limit() {
              return this;
            },
            maybeSingle: async () => {
              const matching = sessions
                .filter((s) =>
                  Object.entries(filters).every(
                    ([k, v]) => (s as unknown as Record<string, unknown>)[k] === v
                  )
                )
                .sort(
                  (a, b) =>
                    new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
                );
              return { data: matching[0] ?? null, error: null };
            }
          }),
          insert: (row: Partial<PracticeSessionRow>) => ({
            select: () => ({
              single: async () => {
                const created: PracticeSessionRow = {
                  id: `sess-${sessions.length + 1}`,
                  user_id: String(row.user_id),
                  module: String(row.module),
                  scenario_id: String(row.scenario_id),
                  level: String(row.level),
                  started_at: new Date('2026-09-28T12:00:00Z').toISOString()
                };
                sessions.push(created);
                return { data: created, error: null };
              }
            })
          })
        };
      }

      if (table === 'turns') {
        const filters: Record<string, unknown> = {};
        let maxLimit = 1000;
        return {
          insert: async (rows: Array<Partial<TurnRow>>) => {
            for (const r of rows) {
              turns.push({
                id: nextTurnId++,
                session_id: String(r.session_id),
                user_id: String(r.user_id),
                role: (r.role as 'user' | 'ai') ?? 'user',
                text: String(r.text ?? ''),
                correction_json: r.correction_json ?? null,
                created_at: new Date(Date.now() + nextTurnId).toISOString()
              });
            }
            return { data: null, error: null };
          },
          select: () => ({
            eq(col: string, val: unknown) {
              filters[col] = val;
              return this;
            },
            order() {
              return this;
            },
            limit: async (n: number) => {
              maxLimit = n;
              const matching = turns
                .filter((t) =>
                  Object.entries(filters).every(
                    ([k, v]) => (t as unknown as Record<string, unknown>)[k] === v
                  )
                )
                .sort((a, b) => b.id - a.id)
                .slice(0, maxLimit);
              return { data: matching, error: null };
            }
          })
        };
      }

      throw new Error(`Unexpected table ${table}`);
    }) as unknown as SessionClientLike['from']
  };

  return { client, sessions, turns };
}

describe('Session store unit tests (src/server/sessions.ts)', () => {
  it('reuses the latest session with the same module & scenario if started < 6 hours ago, and creates a new one if >= 6 hours ago', async () => {
    const recentSession: PracticeSessionRow = {
      id: 'sess-recent',
      user_id: 'user-1',
      module: 'norskprove',
      scenario_id: 'np-b1b2-velferd-hjemmekontor',
      level: 'B1',
      started_at: '2026-09-28T08:30:00Z'
    };

    const { client, sessions } = createInMemorySessionClient({
      sessions: [recentSession]
    });

    // 3 hours later -> reuses sess-recent
    const reused = await getOrCreateSession(
      'user-1',
      {
        module: 'norskprove',
        scenarioId: 'np-b1b2-velferd-hjemmekontor',
        level: 'B1'
      },
      {
        getAdminClient: () => client,
        now: new Date('2026-09-28T11:30:00Z')
      }
    );
    expect(reused.id).toBe('sess-recent');
    expect(sessions).toHaveLength(1);

    // 6 hours + 1 minute later -> creates a new session
    const created = await getOrCreateSession(
      'user-1',
      {
        module: 'norskprove',
        scenarioId: 'np-b1b2-velferd-hjemmekontor',
        level: 'B1'
      },
      {
        getAdminClient: () => client,
        now: new Date('2026-09-28T14:31:00Z')
      }
    );
    expect(created.id).not.toBe('sess-recent');
    expect(sessions).toHaveLength(2);
  });

  it('appendTurns writes user and ai turns and getLatestSessionWithTurns caps at last 40 turns in chronological order', async () => {
    const { client } = createInMemorySessionClient();
    const session = await getOrCreateSession(
      'user-1',
      {
        module: 'norskprove',
        scenarioId: 'np-b1b2-velferd-hjemmekontor',
        level: 'B1'
      },
      { getAdminClient: () => client }
    );

    const manyTurns = Array.from({ length: 45 }, (_, idx) => ({
      role: (idx % 2 === 0 ? 'user' : 'ai') as 'user' | 'ai',
      text: `Turn-${idx + 1}`,
      correction_json: idx % 2 === 1 ? { cefr_estimate: 'B1' } : undefined
    }));

    await appendTurns(session.id, 'user-1', manyTurns, {
      getAdminClient: () => client
    });

    const latest = await getLatestSessionWithTurns('user-1', {
      getAdminClient: () => client
    });

    expect(latest.session?.id).toBe(session.id);
    expect(latest.turns).toHaveLength(40);
    expect(latest.turns[0].text).toBe('Turn-6');
    expect(latest.turns[39].text).toBe('Turn-45');
  });
});

describe('/api/coach and /api/sessions/current session wiring unit tests', () => {
  const validCoachBody = JSON.stringify({
    module: 'norskprove',
    scenarioId: 'np-b1b2-velferd-hjemmekontor',
    level: 'B1',
    l1: 'ru',
    persona: 'standard',
    userText: 'Jeg mener at hjemmekontor gir fleksibilitet.',
    history: [],
    usedWords: []
  });

  const geminiReply = {
    reply_norsk: 'Hvorfor liker du å jobbe hjemmefra?',
    reply_l1: 'Почему тебе нравится работать из дома?',
    feedback: {
      status: 'ok',
      errors: [],
      praise_l1: 'Фраза построена верно.',
      level_estimate: 'B1'
    },
    correction: {
      original: 'Jeg mener at hjemmekontor gir fleksibilitet.',
      natural_bokmal: 'Jeg mener at hjemmekontor gir fleksibilitet.',
      b2_upgrade: 'Jeg mener at hjemmekontor gir stor fleksibilitet.',
      grammar_rule_l1: 'Фраза построена верно.',
      cefr_estimate: 'B1',
      v2_status: 'Korrekt V2'
    },
    next_hints: []
  };
  const geminiFetch = (async () =>
    ({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(geminiReply) }] } }]
      })
    }) as Response) as unknown as typeof globalThis.fetch;

  let prevKey: string | undefined;
  beforeAll(() => {
    prevKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-key';
  });
  afterAll(() => {
    if (prevKey !== undefined) process.env.GEMINI_API_KEY = prevKey;
    else delete process.env.GEMINI_API_KEY;
  });

  it('/api/coach writes turns when auth is on, does not write when auth is off, and still returns 200 without leaking user text when write fails', async () => {
    const getOrCreateSpy = vi.fn().mockResolvedValue({
      id: 'sess-123',
      user_id: 'user-a',
      module: 'norskprove',
      scenario_id: 'np-b1b2-velferd-hjemmekontor',
      level: 'B1',
      started_at: new Date().toISOString()
    });
    const appendTurnsSpy = vi.fn().mockResolvedValue(undefined);

    // 1. Auth ON -> writes turns
    const authedHandler = createCoachHandler({
      authEnabled: () => true,
      getUser: async () => ({ id: 'user-a' }),
      quota: async () => ({ allowed: true, used: 1, limit: 20, plan: 'free' }),
      countCall: async () => {},
      fetchImpl: geminiFetch,
      getOrCreateSession: getOrCreateSpy,
      appendTurns: appendTurnsSpy
    });

    const res1 = await authedHandler(
      new Request('http://localhost/api/coach', {
        method: 'POST',
        body: validCoachBody
      })
    );
    expect(res1.status).toBe(200);
    expect(getOrCreateSpy).toHaveBeenCalledTimes(1);
    expect(appendTurnsSpy).toHaveBeenCalledTimes(1);
    expect(appendTurnsSpy.mock.calls[0][0]).toBe('sess-123');
    expect(appendTurnsSpy.mock.calls[0][1]).toBe('user-a');
    expect(appendTurnsSpy.mock.calls[0][2]).toHaveLength(2);
    expect(appendTurnsSpy.mock.calls[0][2][0].role).toBe('user');
    expect(appendTurnsSpy.mock.calls[0][2][1].role).toBe('ai');

    // 2. Auth OFF -> does not write turns
    getOrCreateSpy.mockClear();
    appendTurnsSpy.mockClear();
    const anonHandler = createCoachHandler({
      authEnabled: () => false,
      fetchImpl: geminiFetch,
      getOrCreateSession: getOrCreateSpy,
      appendTurns: appendTurnsSpy
    });
    const res2 = await anonHandler(
      new Request('http://localhost/api/coach', {
        method: 'POST',
        body: validCoachBody
      })
    );
    expect(res2.status).toBe(200);
    expect(getOrCreateSpy).not.toHaveBeenCalled();
    expect(appendTurnsSpy).not.toHaveBeenCalled();

    // 3. Auth ON + write failure -> still returns 200 and console.error has no user text/id
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failingWriteHandler = createCoachHandler({
      authEnabled: () => true,
      getUser: async () => ({ id: 'secret-user-id-999' }),
      quota: async () => ({ allowed: true, used: 1, limit: 20, plan: 'free' }),
      countCall: async () => {},
      fetchImpl: geminiFetch,
      getOrCreateSession: async () => {
        throw new Error('DB connection error');
      }
    });
    const res3 = await failingWriteHandler(
      new Request('http://localhost/api/coach', {
        method: 'POST',
        body: validCoachBody
      })
    );
    expect(res3.status).toBe(200);
    expect(errSpy).toHaveBeenCalledTimes(1);
    const loggedMessage = String(errSpy.mock.calls[0][0]);
    expect(loggedMessage).not.toContain('secret-user-id-999');
    expect(loggedMessage).not.toContain('hjemmekontor');
    errSpy.mockRestore();
  });

  it('GET /api/sessions/current returns 204 when auth off, 401 when no user, and 200 with session + turns when authenticated', async () => {
    const handler204 = createCurrentSessionHandler({
      authEnabled: () => false
    });
    const res204 = await handler204();
    expect(res204.status).toBe(204);

    const handler401 = createCurrentSessionHandler({
      authEnabled: () => true,
      getUser: async () => null
    });
    const res401 = await handler401();
    expect(res401.status).toBe(401);

    const handler200 = createCurrentSessionHandler({
      authEnabled: () => true,
      getUser: async () => ({ id: 'user-a' }),
      getLatestSessionWithTurns: async (uid) => ({
        session: {
          id: 'sess-1',
          user_id: uid,
          module: 'norskprove',
          scenario_id: 'np-b1b2-velferd-hjemmekontor',
          level: 'B1',
          started_at: '2026-09-28T10:00:00Z'
        },
        turns: [
          {
            id: 1,
            session_id: 'sess-1',
            user_id: uid,
            role: 'user',
            text: 'Hei',
            created_at: '2026-09-28T10:01:00Z'
          }
        ]
      })
    });
    const res200 = await handler200();
    expect(res200.status).toBe(200);
    const json = await res200.json();
    expect(json.session.id).toBe('sess-1');
    expect(json.turns).toHaveLength(1);
  });
});

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey);
const describeRls = hasSupabaseEnv ? describe : describe.skip;

describeRls('Sessions & Turns RLS integration test (local Supabase)', () => {
  let adminClient: SupabaseClient;
  let userAClient: SupabaseClient;
  let userBClient: SupabaseClient;
  let userAId = '';
  let userBId = '';
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const userAEmail = `sess-a-${runId}@example.com`;
  const userBEmail = `sess-b-${runId}@example.com`;
  const password = 'TestPassword123!';

  beforeAll(async () => {
    adminClient = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    userAClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    userBClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: createdA } = await adminClient.auth.admin.createUser({
      email: userAEmail,
      password,
      email_confirm: true
    });
    userAId = createdA.user!.id;

    const { data: createdB } = await adminClient.auth.admin.createUser({
      email: userBEmail,
      password,
      email_confirm: true
    });
    userBId = createdB.user!.id;

    await userAClient.auth.signInWithPassword({ email: userAEmail, password });
    await userBClient.auth.signInWithPassword({ email: userBEmail, password });
  });

  afterAll(async () => {
    if (adminClient) {
      if (userAId) await adminClient.auth.admin.deleteUser(userAId);
      if (userBId) await adminClient.auth.admin.deleteUser(userBId);
    }
  });

  it('turns written for user A can be read by user A but cannot be read by user B with their own JWT', async () => {
    const sessionA = await getOrCreateSession(
      userAId,
      {
        module: 'norskprove',
        scenarioId: 'np-b1b2-velferd-hjemmekontor',
        level: 'B1'
      },
      { getAdminClient: () => adminClient }
    );

    await appendTurns(
      sessionA.id,
      userAId,
      [
        { role: 'user', text: 'Dette er bruker A sin hemmelige setning.' },
        {
          role: 'ai',
          text: 'Flott svar fra bruker A!',
          correction_json: { cefr_estimate: 'B1' }
        }
      ],
      { getAdminClient: () => adminClient }
    );

    // User A reads own turns with JWT
    const { data: turnsForA, error: errA } = await userAClient
      .from('turns')
      .select('*')
      .eq('session_id', sessionA.id);
    expect(errA).toBeNull();
    expect(turnsForA).toHaveLength(2);

    // User B attempts to read user A's turns with user B's JWT -> 0 rows
    const { data: turnsForB, error: errB } = await userBClient
      .from('turns')
      .select('*')
      .eq('session_id', sessionA.id);
    expect(errB).toBeNull();
    expect(turnsForB).toEqual([]);
  });
});
