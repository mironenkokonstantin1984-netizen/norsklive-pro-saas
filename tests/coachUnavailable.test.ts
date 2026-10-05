// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCoachHandler } from '../src/server/coachHandler';
import { CoachUnavailableError, postCoach } from '../src/lib/coachClient';

const BODY = {
  module: 'norskprove' as const,
  scenarioId: 'np-b1b2-velferd-hjemmekontor',
  level: 'B1' as const,
  l1: 'ru' as const,
  persona: 'standard' as const,
  userText: 'Jeg bor i Bergen.',
  history: [],
  usedWords: []
};

const MODEL_REPLY = {
  reply_norsk: 'Så fint! Hvor lenge har du bodd der?',
  reply_l1: 'Как здорово! Как долго ты там живёшь?',
  correction: {
    original: 'Jeg bor i Bergen.',
    natural_bokmal: 'Jeg bor i Bergen.',
    b2_upgrade: 'Jeg bor i Bergen.',
    grammar_rule_l1: 'Всё верно.',
    cefr_estimate: 'A2',
    v2_status: 'Korrekt V2'
  },
  next_hints: []
};

function request() {
  return new Request('http://localhost/api/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(BODY)
  });
}

const okFetch = (async () =>
  ({
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(MODEL_REPLY) }] } }]
    })
  }) as Response) as unknown as typeof globalThis.fetch;

const failingFetch = (async () => {
  throw new Error('TimeoutError: The operation was aborted due to timeout');
}) as unknown as typeof globalThis.fetch;

function authedDeps(countCall: () => Promise<void>) {
  return {
    authEnabled: () => true,
    getUser: async () => ({ id: 'user-1' }),
    quota: async () => ({ allowed: true, used: 3, limit: 20, plan: 'free' as const }),
    countCall,
    getOrCreateSession: async () => ({
      id: 's',
      user_id: 'user-1',
      module: 'norskprove',
      scenario_id: BODY.scenarioId,
      level: 'B1',
      started_at: new Date().toISOString()
    }),
    appendTurns: async () => {}
  };
}

describe('#45 coach unavailable: no silent canned answer', () => {
  let prevKey: string | undefined;
  let prevAllow: string | undefined;

  beforeEach(() => {
    prevKey = process.env.GEMINI_API_KEY;
    prevAllow = process.env.COACH_ALLOW_FALLBACK;
    process.env.GEMINI_API_KEY = 'test-key';
    delete process.env.COACH_ALLOW_FALLBACK;
  });

  afterEach(() => {
    if (prevKey !== undefined) process.env.GEMINI_API_KEY = prevKey;
    else delete process.env.GEMINI_API_KEY;
    if (prevAllow !== undefined) process.env.COACH_ALLOW_FALLBACK = prevAllow;
    else delete process.env.COACH_ALLOW_FALLBACK;
    vi.restoreAllMocks();
  });

  it('no key -> 503 coach_unavailable', async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await createCoachHandler()(request());
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'coach_unavailable' });
  });

  it('Gemini timeout -> 503 and the daily quota is not counted', async () => {
    const countCall = vi.fn().mockResolvedValue(undefined);
    const res = await createCoachHandler({ ...authedDeps(countCall), fetchImpl: failingFetch })(
      request()
    );
    expect(res.status).toBe(503);
    expect(countCall).not.toHaveBeenCalled();
  });

  it('a successful Gemini answer counts exactly one call', async () => {
    const countCall = vi.fn().mockResolvedValue(undefined);
    const res = await createCoachHandler({ ...authedDeps(countCall), fetchImpl: okFetch })(
      request()
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(MODEL_REPLY);
    expect(countCall).toHaveBeenCalledTimes(1);
    expect(countCall).toHaveBeenCalledWith('user-1');
  });

  it('fallback only with COACH_ALLOW_FALLBACK=true, marked source: "fallback", and not counted', async () => {
    process.env.COACH_ALLOW_FALLBACK = 'true';
    const countCall = vi.fn().mockResolvedValue(undefined);
    const res = await createCoachHandler({ ...authedDeps(countCall), fetchImpl: failingFetch })(
      request()
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('fallback');
    expect(countCall).not.toHaveBeenCalled();
  });

  it('fallback text has no emoji and no «R&D» wording', async () => {
    process.env.COACH_ALLOW_FALLBACK = 'true';
    delete process.env.GEMINI_API_KEY;
    for (const userText of ['Jeg tenker at miljø er viktig', 'I dag jeg liker kaffe', 'Hei']) {
      const res = await createCoachHandler()(
        new Request('http://localhost/api/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...BODY, userText })
        })
      );
      const text = JSON.stringify(await res.json());
      expect(text).not.toMatch(/R&D|Strategic/);
      expect(text).not.toMatch(/[☀-➿⭐✅]|[\u{1F300}-\u{1FAFF}]/u);
    }
  });

  it('postCoach maps 503 and network failures to CoachUnavailableError', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'coach_unavailable' }), { status: 503 })
    );
    await expect(postCoach(BODY)).rejects.toBeInstanceOf(CoachUnavailableError);

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(postCoach(BODY)).rejects.toBeInstanceOf(CoachUnavailableError);
  });
});
