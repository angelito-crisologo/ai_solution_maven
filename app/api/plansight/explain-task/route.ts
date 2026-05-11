import { NextResponse } from "next/server";
import { z } from "zod";
import { getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getCurrentUser } from "@/lib/auth/session";
import { computePlanContentHash } from "@/lib/plansight-ai/ai";
import {
  getCachedExplanation,
  setCachedExplanation
} from "@/lib/plansight-ai/ai-usage/explain-task-cache";
import {
  checkExplainTaskRateLimit,
  EXPLAIN_TASK_LIMITS
} from "@/lib/plansight-ai/ai-usage/rate-limit";
import { checkAndAlertSpend } from "@/lib/plansight-ai/ai-usage/spend-alert";
import { logAiUsage } from "@/lib/plansight-ai/ai-usage/usage-log";
import { explainTask } from "@/lib/plansight-ai/explain-task";
import { loadSharedPlan } from "@/lib/plansight-ai/share-storage";

// Edge runtime gets the 30s ceiling on Hobby. Haiku replies in ~2s for a
// scoped task explanation, so we have plenty of margin. Cache/rate-limit
// lookups are Supabase fetch calls that work in edge.
export const runtime = "edge";

const requestSchema = z.object({
  shareId: z.string().min(1).max(200),
  taskId: z.number().int(),
  /** True when the user dismissed the soft-cap nudge — recorded for analytics
   * (how often do users push past the 100/day reminder vs heed it?). */
  softCapDismissed: z.boolean().optional()
});

/** Operator contact line on hard-cap blocks. Per the doc, the block message
 * "should be polite and include a contact line" so power users can flag
 * unusual workflows back to us. */
const CONTACT_EMAIL = "support@aisolutionmaven.com";

/**
 * Pro-only inline AI: explain a single task in plain language. Phase 9
 * mitigation stack:
 *   1. Auth + Pro check (server-side, plan ownership not yet enforced because
 *      Pro users only see their own plans in the workspace).
 *   2. Cache lookup by (plan_content_hash, task_id) — every repeat click is
 *      free.
 *   3. Rate limit: 30/hr hard, 100/day soft (nudge), 200/day hard.
 *   4. Live Claude call → log tokens + cost → cache result → spend-alert
 *      check.
 */
export async function POST(request: Request) {
  const startedAt = Date.now();
  let userId: string | null = null;
  let userEmail: string | null = null;
  let shareId: string | null = null;
  let taskId: number | null = null;

  try {
    const raw = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request. Expected { shareId, taskId }." },
        { status: 400 }
      );
    }
    shareId = parsed.data.shareId;
    taskId = parsed.data.taskId;
    const softCapDismissed = parsed.data.softCapDismissed === true;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to use Explain this task." },
        { status: 401 }
      );
    }
    userId = user.id;
    userEmail = user.email || null;

    const activation = await getProductActivation(user.id, PRODUCTS.PLANSIGHT);
    if (!activation || activation.tier !== "pro") {
      return NextResponse.json(
        { error: "Explain this task is a Pro feature. Upgrade to use it." },
        { status: 403 }
      );
    }

    const plan = await loadSharedPlan(shareId);
    if (!plan) {
      return NextResponse.json({ error: "Shared plan not found." }, { status: 404 });
    }

    const contentHash = await computePlanContentHash(plan);

    // --- Layer 1: cache lookup ---
    const cached = await getCachedExplanation(contentHash, taskId);
    if (cached) {
      await logAiUsage({
        userId,
        shareId,
        feature: "explain_task",
        taskId: String(taskId),
        cacheHit: true,
        latencyMs: Date.now() - startedAt
      });
      return NextResponse.json({ explanation: cached, cached: true });
    }

    // --- Layer 3: rate limit (before burning the API call) ---
    const decision = await checkExplainTaskRateLimit(userId);
    if (decision.kind === "block") {
      await logAiUsage({
        userId,
        shareId,
        feature: "explain_task",
        taskId: String(taskId),
        rateLimited: true,
        latencyMs: Date.now() - startedAt
      });

      const message =
        decision.reason === "daily_hard"
          ? `You've used today's allowance (${EXPLAIN_TASK_LIMITS.PER_DAY_HARD} explanations). Come back tomorrow, or email ${CONTACT_EMAIL} if your workflow needs more.`
          : `You've hit the hourly limit (${EXPLAIN_TASK_LIMITS.PER_HOUR_HARD} explanations / hr). Try again in a bit, or email ${CONTACT_EMAIL} if this is blocking real work.`;

      return NextResponse.json(
        {
          error: message,
          rateLimited: true,
          reason: decision.reason,
          retryAfterSeconds: decision.retryAfterSeconds
        },
        {
          status: 429,
          headers: { "Retry-After": String(decision.retryAfterSeconds) }
        }
      );
    }

    // --- Live Claude call ---
    const result = await explainTask(plan, taskId);
    const latencyMs = Date.now() - startedAt;

    await logAiUsage({
      userId,
      shareId,
      feature: "explain_task",
      taskId: String(taskId),
      cacheHit: false,
      usage: result.usage,
      latencyMs,
      softCapShown: decision.softCapShown,
      softCapDismissed
    });

    // Cache and spend-alert are fire-and-forget — they shouldn't add latency
    // to the user's response, but we await them so they finish before the
    // edge function returns (Vercel may not run async work after the
    // response on edge). Both helpers are best-effort and never throw.
    await Promise.all([
      setCachedExplanation(contentHash, taskId, result.explanation, userId),
      checkAndAlertSpend(userId, userEmail)
    ]);

    return NextResponse.json({
      explanation: result.explanation,
      cached: false,
      softCapShown: decision.softCapShown,
      dailyCount: decision.dailyCount + 1
    });
  } catch (error) {
    console.error("[explain-task] failed", error);
    const message =
      error instanceof Error ? error.message : "Failed to explain task.";

    if (userId && shareId !== null && taskId !== null) {
      await logAiUsage({
        userId,
        shareId,
        feature: "explain_task",
        taskId: String(taskId),
        latencyMs: Date.now() - startedAt,
        error: message.slice(0, 500)
      });
    }

    if (message.includes("ANTHROPIC_API_KEY is not configured")) {
      return NextResponse.json(
        { error: "AI is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    if (message.includes("not in this plan")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to explain task. Please try again." },
      { status: 500 }
    );
  }
}
