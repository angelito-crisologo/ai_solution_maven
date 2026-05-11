import { createSupabaseServiceClient } from "@/lib/plansight-ai/supabase";

export const EXPLAIN_TASK_LIMITS = {
  PER_HOUR_HARD: 30,
  PER_DAY_SOFT: 100,
  PER_DAY_HARD: 200
} as const;

export type RateLimitDecision =
  | { kind: "allow"; softCapShown: boolean; dailyCount: number; hourlyCount: number }
  | {
      kind: "block";
      reason: "hourly_hard" | "daily_hard";
      retryAfterSeconds: number;
    };

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * UTC midnight today (e.g. 2026-05-11T00:00:00.000Z when "now" is any time
 * during 2026-05-11 UTC). Simple, regions-agnostic, and shared by every
 * user — no per-user timezone math here. The user_local boundary work, if
 * we ever decide to do it, can layer on top of week_start_day plumbing.
 */
function startOfUtcDay(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
  );
}

function nextUtcDayBoundary(now: Date): Date {
  return new Date(startOfUtcDay(now).getTime() + DAY_MS);
}

/**
 * Count rows in ai_usage_log for this user + feature where the call actually
 * burned API budget (cache_hit=false, rate_limited=false). Cache hits don't
 * count toward the velocity caps — the cache is meant to make repeat clicks
 * free for the user, not silently consume their daily allowance. Rate-limited
 * rows don't count either (otherwise hitting the limit compounds the count).
 */
async function countCallsSince(
  userId: string,
  feature: string,
  since: Date
): Promise<number> {
  const client = createSupabaseServiceClient();
  if (!client) return 0;

  const { count, error } = await client
    .from("ai_usage_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", feature)
    .eq("cache_hit", false)
    .eq("rate_limited", false)
    .gte("created_at", since.toISOString());

  if (error) {
    console.error("[rate-limit] count query failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Decide whether the user may make one more `explain_task` call right now.
 *
 * - 30/hr hard: block; suggest retry after the hour rolls.
 * - 200/day hard: block; suggest retry at UTC midnight.
 * - 100/day soft: allow, but flag softCapShown so the UI nudges the user.
 *
 * On Supabase outage (count returns 0 by default), we degrade open: better
 * to serve a legitimate Pro user than to lock everyone out. The spend alert
 * remains the ultimate cost backstop.
 */
export async function checkExplainTaskRateLimit(
  userId: string,
  now: Date = new Date()
): Promise<RateLimitDecision> {
  const hourAgo = new Date(now.getTime() - HOUR_MS);
  const dayStart = startOfUtcDay(now);

  const [hourlyCount, dailyCount] = await Promise.all([
    countCallsSince(userId, "explain_task", hourAgo),
    countCallsSince(userId, "explain_task", dayStart)
  ]);

  if (dailyCount >= EXPLAIN_TASK_LIMITS.PER_DAY_HARD) {
    const retryAfterSeconds = Math.max(
      60,
      Math.ceil((nextUtcDayBoundary(now).getTime() - now.getTime()) / 1000)
    );
    return { kind: "block", reason: "daily_hard", retryAfterSeconds };
  }

  if (hourlyCount >= EXPLAIN_TASK_LIMITS.PER_HOUR_HARD) {
    // Retry once an hour has rolled past the oldest call. We don't fetch the
    // exact oldest timestamp — 1 hour from now is a safe upper bound.
    return { kind: "block", reason: "hourly_hard", retryAfterSeconds: 3600 };
  }

  const softCapShown = dailyCount + 1 >= EXPLAIN_TASK_LIMITS.PER_DAY_SOFT;

  return { kind: "allow", softCapShown, dailyCount, hourlyCount };
}
