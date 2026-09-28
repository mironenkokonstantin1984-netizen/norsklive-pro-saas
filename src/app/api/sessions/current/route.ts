import { createCurrentSessionHandler } from '../../../../server/sessionsCurrentHandler';

export const runtime = 'nodejs';

const handleGet = createCurrentSessionHandler();

export async function GET(): Promise<Response> {
  return handleGet();
}
