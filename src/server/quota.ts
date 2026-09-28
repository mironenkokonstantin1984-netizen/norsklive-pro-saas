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

export async function checkAndCountAiCall(
  userId: string,
  deps: QuotaDeps = {}
): Promise<QuotaCheckResult> {
  try {
    const client = (deps.getAdminClient ?? getSupabaseAdmin)();

    const { data: subRow, error: subErr } = await client
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .maybeSingle();

    if (subErr) {
      throw subErr;
    }

    const rawPlan = (subRow as { plan?: string } | null)?.plan;
    const plan: SubscriptionPlan =
      rawPlan === 'exam_pass_90d' || rawPlan === 'monthly' ? rawPlan : 'free';
    const limit = DAILY_LIMITS[plan];

    const today = getOsloDateString(deps.now);
    const { data: usedData, error: rpcErr } = await client.rpc('increment_ai_calls', {
      uid: userId,
      d: today
    });

    if (rpcErr || typeof usedData !== 'number') {
      throw rpcErr ?? new Error('Invalid increment_ai_calls result');
    }

    return {
      allowed: usedData <= limit,
      used: usedData,
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
