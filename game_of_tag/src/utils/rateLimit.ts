type RateLimitState = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterMs: number;
};

const buckets = new Map<string, RateLimitState>(); // Jednoduchy in-memory limiter na zakladni ochranu.

export function checkRateLimit(
  key: string,
  options?: { windowMs?: number; max?: number }
): RateLimitResult {
  const windowMs = options?.windowMs ?? 60_000;
  const max = options?.max ?? 30;
  const now = Date.now();

  const existing = buckets.get(key);
  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  existing.count += 1;
  if (existing.count > max) {
    return { allowed: false, retryAfterMs: Math.max(0, existing.resetAt - now) };
  }

  return { allowed: true, retryAfterMs: 0 };
}
