/**
 * Best-effort per-IP rate limit for the contact form. State lives in memory
 * in each server instance, so on Vercel it resets on cold starts and is not
 * shared between instances. It stops simple repeat submissions; it is not a
 * guarantee.
 */

export const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 } as const;

type Entry = { count: number; resetAt: number };

export function createRateLimiter(
  max: number = RATE_LIMIT.max,
  windowMs: number = RATE_LIMIT.windowMs,
) {
  const hits = new Map<string, Entry>();

  return function allow(key: string, now: number = Date.now()): boolean {
    // Drop expired entries so the map cannot grow without bound.
    if (hits.size > 5000) {
      hits.forEach((entry, k) => {
        if (entry.resetAt <= now) hits.delete(k);
      });
    }
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= max;
  };
}

/** Client IP from Vercel's forwarding headers. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
