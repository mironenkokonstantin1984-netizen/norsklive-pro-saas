// TODO(M4): replace with Upstash/Redis for multi-instance

export interface RateLimitOptions {
  max?: number;
  windowMs?: number;
}

export type RateLimitCheckFn = (req: Request) => boolean;

export function extractClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (!forwardedFor) return 'unknown';
  const firstIp = forwardedFor.split(',')[0]?.trim();
  return firstIp && firstIp.length > 0 ? firstIp : 'unknown';
}

export function createRateLimiter(options: RateLimitOptions = {}): RateLimitCheckFn {
  const max = options.max ?? 30;
  const windowMs = options.windowMs ?? 10 * 60 * 1000;
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request): boolean => {
    const ip = extractClientIp(req);
    const now = Date.now();
    const record = hits.get(ip);

    if (!record || now >= record.resetAt) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (record.count >= max) {
      return false;
    }

    record.count += 1;
    return true;
  };
}
