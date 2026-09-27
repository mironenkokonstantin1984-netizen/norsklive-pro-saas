import type { CoachRequest, CoachResponse } from '../server/schemas';

export async function postCoach(body: CoachRequest): Promise<CoachResponse> {
  const response = await fetch('/api/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return (await response.json()) as CoachResponse;
}
