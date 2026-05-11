import { createSupabaseServiceClient } from "@/lib/plansight-ai/supabase";
import { HAIKU_MODEL_ID, computeCostUsd, type TokenUsage } from "./cost";

export type AiFeature =
  | "explain_task"
  | "regenerate_analysis"
  | "weekly_snapshot";

export type AiUsageLogInput = {
  userId: string;
  feature: AiFeature;
  /** share_id of the plan (the primary key of public.plans). Null when the
   * call isn't associated with a stored plan (rare — most features require
   * one). */
  shareId?: string | null;
  /** For per-task features (explain_task). Null otherwise. */
  taskId?: string | null;
  cacheHit?: boolean;
  model?: string | null;
  usage?: TokenUsage | null;
  latencyMs?: number | null;
  rateLimited?: boolean;
  softCapShown?: boolean;
  softCapDismissed?: boolean;
  error?: string | null;
};

/**
 * Insert one row into ai_usage_log. Best-effort — never throws. The caller's
 * primary job (serving the AI response or returning a rate-limit error) must
 * not be derailed by a logging failure.
 *
 * Cache hits should pass `cacheHit: true` with no usage (cost defaults to 0).
 * Rate-limit blocks should pass `rateLimited: true` with no usage.
 */
export async function logAiUsage(input: AiUsageLogInput): Promise<void> {
  const client = createSupabaseServiceClient();
  if (!client) {
    // Supabase not configured in this environment — logging is best-effort.
    return;
  }

  try {
    const cacheHit = input.cacheHit ?? false;
    const usage = input.usage ?? {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0
    };
    const costUsd = cacheHit ? 0 : computeCostUsd(usage);

    const { error } = await client.from("ai_usage_log").insert({
      user_id: input.userId,
      share_id: input.shareId ?? null,
      feature: input.feature,
      task_id: input.taskId ?? null,
      cache_hit: cacheHit,
      model: input.model ?? (cacheHit ? null : HAIKU_MODEL_ID),
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
      cache_read_tokens: usage.cacheReadTokens,
      cache_write_tokens: usage.cacheWriteTokens,
      cost_usd: costUsd,
      latency_ms: input.latencyMs ?? null,
      rate_limited: input.rateLimited ?? false,
      soft_cap_shown: input.softCapShown ?? false,
      soft_cap_dismissed: input.softCapDismissed ?? false,
      error: input.error ?? null
    });

    if (error) {
      console.error("[ai-usage] log insert failed:", error.message);
    }
  } catch (err) {
    console.error("[ai-usage] log insert threw:", err);
  }
}
