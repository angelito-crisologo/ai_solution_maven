import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Read a cached explanation for (plan_content_hash, task_id). Returns null on
 * miss or when Supabase is not configured. Never throws — a cache lookup
 * failure should fall through to a real Claude call.
 */
export async function getCachedExplanation(
  planContentHash: string,
  taskId: number
): Promise<string | null> {
  const client = createSupabaseServiceClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("explain_task_cache")
      .select("explanation")
      .eq("plan_content_hash", planContentHash)
      .eq("task_id", String(taskId))
      .maybeSingle();

    if (error) {
      console.error("[explain-task-cache] read failed:", error.message);
      return null;
    }
    return data?.explanation ?? null;
  } catch (err) {
    console.error("[explain-task-cache] read threw:", err);
    return null;
  }
}

/**
 * Upsert an explanation by (plan_content_hash, task_id). Best-effort — a
 * write failure is logged and swallowed (the user already got their answer
 * from the live call).
 */
export async function setCachedExplanation(
  planContentHash: string,
  taskId: number,
  explanation: string,
  generatedBy: string
): Promise<void> {
  const client = createSupabaseServiceClient();
  if (!client) return;

  try {
    const { error } = await client.from("explain_task_cache").upsert(
      {
        plan_content_hash: planContentHash,
        task_id: String(taskId),
        explanation,
        generated_by: generatedBy,
        generated_at: new Date().toISOString()
      },
      { onConflict: "plan_content_hash,task_id" }
    );

    if (error) {
      console.error("[explain-task-cache] write failed:", error.message);
    }
  } catch (err) {
    console.error("[explain-task-cache] write threw:", err);
  }
}
