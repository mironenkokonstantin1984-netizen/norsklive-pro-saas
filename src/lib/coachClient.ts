import type { CoachRequest, CoachResponse } from '../server/schemas';
import type { SubscriptionPlan } from '../server/quota';

export class AuthRequiredError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

export class QuotaExceededError extends Error {
  limit: number;
  plan: SubscriptionPlan;

  constructor(
    limit = 20,
    plan: SubscriptionPlan = 'free',
    message = 'Quota exceeded'
  ) {
    super(message);
    this.name = 'QuotaExceededError';
    this.limit = limit;
    this.plan = plan;
  }
}

/** The coach could not answer: no AI configured, the AI failed or timed out, or no network. */
export class CoachUnavailableError extends Error {
  constructor(message = 'Coach unavailable') {
    super(message);
    this.name = 'CoachUnavailableError';
  }
}

export async function postCoach(body: CoachRequest): Promise<CoachResponse> {
  let response: Response;
  try {
    response = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch {
    throw new CoachUnavailableError('Network error');
  }

  if (response.status === 401) {
    throw new AuthRequiredError();
  }

  if (response.status === 402) {
    let limit = 20;
    let plan: SubscriptionPlan = 'free';
    try {
      const errData = (await response.json()) as {
        limit?: unknown;
        plan?: unknown;
      };
      if (typeof errData?.limit === 'number') {
        limit = errData.limit;
      }
      if (
        errData?.plan === 'free' ||
        errData?.plan === 'exam_pass_90d' ||
        errData?.plan === 'monthly'
      ) {
        plan = errData.plan;
      }
    } catch {
      // keep fallback limit and plan
    }
    throw new QuotaExceededError(limit, plan);
  }

  if (response.status >= 500) {
    throw new CoachUnavailableError(`HTTP ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return (await response.json()) as CoachResponse;
}

