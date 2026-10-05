import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from './supabaseAdmin';

export type SubscriptionPlan = 'free' | 'exam_pass_90d' | 'monthly';

export const DAILY_LIMITS: Record<SubscriptionPlan, number> = {
  free: 20,
  exam_pass_90d: 300,
  monthly: 300
};

export interface QuotaCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  plan: SubscriptionPlan;
}

export interface QuotaAdminClientLike {
  from: SupabaseClient['from'];
  rpc: SupabaseClient['rpc'];
}

export interface QuotaDeps {
  getAdminClient?: () => QuotaAdminClientLike;
  now?: Date;
}

export function getOsloDateString(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Oslo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);

  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';

  return `${year}-${month}-${day}`;
}

async function readPlan(client: QuotaAdminClientLike, userId: string): Promise<SubscriptionPlan> {
  const { data: subRow, error: subErr } = await client
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .maybeSingle();

  if (subErr) {
    throw subErr;
  }

  const rawPlan = (subRow as { plan?: string } | null)?.plan;
  return rawPlan === 'exam_pass_90d' || rawPlan === 'monthly' ? rawPlan : 'free';
}

/**
 * Checks the daily AI quota without counting a call. Call `countAiCall` only after the AI has
 * actually answered, so failed or unavailable calls never use up the learner's daily limit.
 * Fails open (allowed) if the database cannot be read.
 */
export async function checkAiQuota(
  userId: string,
  deps: QuotaDeps = {}
): Promise<QuotaCheckResult> {
  try {
    const client = (deps.getAdminClient ?? getSupabaseAdmin)();
    const plan = await readPlan(client, userId);
    const limit = DAILY_LIMITS[plan];

    const today = getOsloDateString(deps.now);
    const { data: usageRow, error: usageErr } = await client
      .from('usage')
      .select('ai_calls')
      .eq('user_id', userId)
      .eq('day', today)
      .maybeSingle();

    if (usageErr) {
      throw usageErr;
    }

    const rawUsed = (usageRow as { ai_calls?: unknown } | null)?.ai_calls;
    const used = typeof rawUsed === 'number' ? rawUsed : 0;

    return {
      allowed: used < limit,
      used,
      limit,
      plan
    };
  } catch {
    console.error('Quota check failed; failing open.');
    return {
      allowed: true,
      used: 0,
      limit: DAILY_LIMITS.free,
      plan: 'free'
    };
  }
}

/** Counts one successful AI call for today (Europe/Oslo). Errors are logged, never thrown. */
export async function countAiCall(userId: string, deps: QuotaDeps = {}): Promise<void> {
  try {
    const client = (deps.getAdminClient ?? getSupabaseAdmin)();
    const today = getOsloDateString(deps.now);
    const { error } = await client.rpc('increment_ai_calls', {
      uid: userId,
      d: today
    });
    if (error) {
      throw error;
    }
  } catch {
    console.error('Failed to count AI call.');
  }
}
