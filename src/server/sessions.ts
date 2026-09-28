import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from './supabaseAdmin';

export interface PracticeSessionRow {
  id: string;
  user_id: string;
  module: string;
  scenario_id: string;
  level: string;
  started_at: string;
  ended_at?: string | null;
  score_json?: unknown;
}

export interface TurnRow {
  id: number;
  session_id: string;
  user_id: string;
  role: 'user' | 'ai';
  text: string;
  correction_json?: unknown;
  created_at: string;
}

export interface SessionParams {
  module: string;
  scenarioId: string;
  level: string;
}

export interface TurnInsertInput {
  role: 'user' | 'ai';
  text: string;
  correction_json?: unknown;
}

export interface SessionClientLike {
  from: SupabaseClient['from'];
}

export interface SessionDeps {
  getAdminClient?: () => SessionClientLike;
  now?: Date;
}

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const MAX_TURNS = 40;

export async function getOrCreateSession(
  userId: string,
  params: SessionParams,
  deps: SessionDeps = {}
): Promise<PracticeSessionRow> {
  const client = (deps.getAdminClient ?? getSupabaseAdmin)();
  const now = deps.now ?? new Date();

  const { data: latest, error: selectErr } = await client
    .from('practice_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('module', params.module)
    .eq('scenario_id', params.scenarioId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectErr) {
    throw selectErr;
  }

  if (latest) {
    const existing = latest as PracticeSessionRow;
    const startedMs = new Date(existing.started_at).getTime();
    if (!Number.isNaN(startedMs) && now.getTime() - startedMs < SIX_HOURS_MS) {
      return existing;
    }
  }

  const { data: created, error: insertErr } = await client
    .from('practice_sessions')
    .insert({
      user_id: userId,
      module: params.module,
      scenario_id: params.scenarioId,
      level: params.level
    })
    .select('*')
    .single();

  if (insertErr || !created) {
    throw insertErr ?? new Error('Failed to create practice session');
  }

  return created as PracticeSessionRow;
}

export async function appendTurns(
  sessionId: string,
  userId: string,
  turns: TurnInsertInput[],
  deps: SessionDeps = {}
): Promise<void> {
  if (turns.length === 0) {
    return;
  }

  const client = (deps.getAdminClient ?? getSupabaseAdmin)();
  const rows = turns.map((t) => ({
    session_id: sessionId,
    user_id: userId,
    role: t.role,
    text: t.text,
    correction_json: t.correction_json ?? null
  }));

  const { error } = await client.from('turns').insert(rows);
  if (error) {
    throw error;
  }
}

export async function getLatestSessionWithTurns(
  userId: string,
  deps: SessionDeps = {}
): Promise<{ session: PracticeSessionRow | null; turns: TurnRow[] }> {
  const client = (deps.getAdminClient ?? getSupabaseAdmin)();

  const { data: sessionData, error: sessionErr } = await client
    .from('practice_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessionErr) {
    throw sessionErr;
  }

  if (!sessionData) {
    return { session: null, turns: [] };
  }

  const session = sessionData as PracticeSessionRow;

  const { data: turnsData, error: turnsErr } = await client
    .from('turns')
    .select('*')
    .eq('session_id', session.id)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(MAX_TURNS);

  if (turnsErr) {
    throw turnsErr;
  }

  const rawTurns = ((turnsData ?? []) as TurnRow[]).slice(0, MAX_TURNS).reverse();
  rawTurns.sort((a, b) => {
    const timeDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (timeDiff !== 0 && !Number.isNaN(timeDiff)) {
      return timeDiff;
    }
    return (a.id ?? 0) - (b.id ?? 0);
  });

  return {
    session,
    turns: rawTurns
  };
}
