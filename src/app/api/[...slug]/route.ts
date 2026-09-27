export const runtime = 'nodejs';

async function notFoundHandler(): Promise<Response> {
  return Response.json({ error: 'API route not found' }, { status: 404 });
}

export const GET = notFoundHandler;
export const POST = notFoundHandler;
export const PUT = notFoundHandler;
export const DELETE = notFoundHandler;
export const PATCH = notFoundHandler;
export const OPTIONS = notFoundHandler;
export const HEAD = notFoundHandler;
