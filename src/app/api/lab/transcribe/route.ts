import { createTranscribeHandler } from '../../../../server/voiceLabTranscribe';

export const runtime = 'nodejs';

const handler = createTranscribeHandler();

export async function POST(req: Request): Promise<Response> {
  return handler(req);
}

export async function GET(): Promise<Response> {
  return Response.json({ error: 'Not found' }, { status: 404 });
}
