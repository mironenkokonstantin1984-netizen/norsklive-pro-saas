// TODO(M4): replace with Upstash/Redis for multi-instance

export interface RateLimitOptions {
  max?: number;
  windowMs?: number;
  sweepInterval?: number;
  maxEntries?: number;
}

export interface RateLimitCheckFn {
  (req: Request): boolean;
  hits: Map<string, { count: number; resetAt: number }>;
}

export function extractClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (!forwardedFor) return 'unknown';
  const firstIp = forwardedFor.split(',')[0]?.trim();
  return firstIp && firstIp.length > 0 ? firstIp : 'unknown';
}

export function createRateLimiter(options: RateLimitOptions = {}): RateLimitCheckFn {
  const max = options.max ?? 30;
  const windowMs = options.windowMs ?? 10 * 60 * 1000;
  const sweepInterval = options.sweepInterval ?? 1000;
  const maxEntries = options.maxEntries ?? 10_000;
  const hits = new Map<string, { count: number; resetAt: number }>();
  let callCount = 0;

  const sweepExpired = (now: number): void => {
    for (const [key, value] of hits.entries()) {
      if (value.resetAt <= now) {
        hits.delete(key);
      }
    }
  };

  const check: RateLimitCheckFn = Object.assign(
    (req: Request): boolean => {
      const now = Date.now();
      callCount += 1;

      if (callCount >= sweepInterval || hits.size > maxEntries) {
        callCount = 0;
        sweepExpired(now);
      }

      const ip = extractClientIp(req);
      const record = hits.get(ip);

      if (record && record.resetAt <= now) {
        hits.delete(ip);
      }

      const activeRecord = hits.get(ip);
      if (!activeRecord) {
        sweepExpired(now);
        hits.set(ip, { count: 1, resetAt: now + windowMs });
        return true;
      }

      if (activeRecord.count >= max) {
        return false;
      }

      activeRecord.count += 1;
      return true;
    },
    { hits }
  );

  return check;
}
