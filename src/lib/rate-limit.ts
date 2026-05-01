// Best-effort in-memory rate limiter.
// Acceptable for single-instance Netlify deploys; for horizontally-scaled
// production, replace with a Redis-backed limiter (Upstash, etc).

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(args: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(args.key);
  if (!bucket) {
    bucket = { tokens: args.limit, lastRefill: now };
    buckets.set(args.key, bucket);
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill;
  if (elapsed >= args.windowMs) {
    bucket.tokens = args.limit;
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    return {
      ok: false,
      remaining: 0,
      resetAt: bucket.lastRefill + args.windowMs,
    };
  }

  bucket.tokens -= 1;
  return {
    ok: true,
    remaining: bucket.tokens,
    resetAt: bucket.lastRefill + args.windowMs,
  };
}
