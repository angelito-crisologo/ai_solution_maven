import type { Plan, PlanTask } from "./types";
import type { AiAnalysis } from "./ai";
import { getGuestPlanExpiryIso } from "./guest";
import {
  createSupabaseAnonClient,
  createSupabaseServiceClient,
  isSupabaseConfigured,
  isSupabaseServiceConfigured
} from "@/lib/supabase/service";

type SharedPlanRow = {
  share_id: string;
  title: string;
  source_format: Plan["sourceFormat"];
  imported_at: string;
  start_date: string | null;
  finish_date: string | null;
  owner_type: "guest" | "user";
  owner_user_id: string | null;
  guest_id: string | null;
  expires_at: string | null;
};

type SharedPlanTaskRow = {
  share_id: string;
  task_id: number;
  task_order: number;
  unique_id: number | null;
  parent_id: number | null;
  task_name: string;
  outline_level: number;
  outline_number: string | null;
  wbs: string | null;
  start_date: string | null;
  finish_date: string | null;
  duration: string | null;
  percent_complete: number | null;
  summary: boolean;
  milestone: boolean;
  predecessors: unknown;
  resource_names: string[];
  notes: string | null;
};

export type SharedPlanDebug = {
  shareId: string;
  hasPlanRow: boolean;
  taskCount: number;
  planOwnerType: "guest" | "user" | null;
  planExpired: boolean;
  source: "plans+tasks" | "missing";
};

function buildPlanFromRows(planRow: SharedPlanRow, taskRows: SharedPlanTaskRow[]): Plan {
  const tasks: PlanTask[] = taskRows
    .slice()
    .sort((a, b) => a.task_order - b.task_order || a.task_id - b.task_id)
    .map((row) => ({
      id: row.task_id,
      uniqueId: row.unique_id,
      parentId: row.parent_id,
      name: row.task_name,
      outlineLevel: row.outline_level,
      outlineNumber: row.outline_number,
      wbs: row.wbs,
      start: row.start_date,
      finish: row.finish_date,
      duration: row.duration,
      percentComplete: row.percent_complete,
      summary: row.summary,
      milestone: row.milestone,
      predecessors: Array.isArray(row.predecessors) ? row.predecessors : [],
      resourceNames: row.resource_names ?? [],
      notes: row.notes
    }));

  return {
    id: planRow.share_id,
    title: planRow.title,
    sourceFormat: planRow.source_format,
    importedAt: planRow.imported_at,
    startDate: planRow.start_date,
    finishDate: planRow.finish_date,
    tasks
  };
}

async function cleanupExpiredGuestPlans(client: ReturnType<typeof createSupabaseServiceClient>) {
  if (!client) {
    return;
  }

  const { error } = await client
    .from("plans")
    .delete()
    .eq("owner_type", "guest")
    .not("expires_at", "is", null)
    .lt("expires_at", new Date().toISOString());

  if (error) {
    throw error;
  }
}

export type ClaimGuestPlanResult =
  | { ok: true; shareId: string; title: string }
  | { ok: false; reason: "not-found" | "not-guest" | "expired" };

/**
 * Transfer an anonymous (guest) plan onto a signed-in user's account. Used by
 * the post-signup claim flow: an anonymous visitor uploads, clicks "Save my
 * plan", signs up, and on return we re-attribute the row so the plan and its
 * share link persist instead of evaporating at the 24h TTL.
 *
 * Authorisation note: any signed-in user may claim a guest row. The shareId
 * is the only key, which means a stakeholder who received an anonymous share
 * URL could in principle race the original uploader to ownership. We accept
 * that trade-off for v1 — anonymous plans expire in 24h anyway, and the
 * original uploader can always claim first by signing up. If we ever need
 * stricter creator-only claim, the path forward is a guest-session cookie
 * scoped to the shareId.
 */
export async function claimGuestPlan(
  shareId: string,
  userId: string
): Promise<ClaimGuestPlanResult> {
  if (!isSupabaseServiceConfigured()) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in the server environment."
    );
  }

  const client = createSupabaseServiceClient();
  if (!client) {
    throw new Error("Failed to create Supabase service client.");
  }

  const { data: row, error: lookupError } = await client
    .from("plans")
    .select("share_id, title, owner_type, expires_at")
    .eq("share_id", shareId)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (!row) {
    return { ok: false, reason: "not-found" };
  }

  if (row.owner_type !== "guest") {
    return { ok: false, reason: "not-guest" };
  }

  if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) {
    return { ok: false, reason: "expired" };
  }

  const { error: updateError } = await client
    .from("plans")
    .update({
      owner_type: "user",
      owner_user_id: userId,
      expires_at: null
    })
    .eq("share_id", shareId)
    .eq("owner_type", "guest");

  if (updateError) {
    throw updateError;
  }

  return { ok: true, shareId, title: row.title };
}

/**
 * Hard-delete every plan owned by the given user. plan_tasks rows cascade.
 * Used for the Free single-plan slot: when a Free user imports a new plan,
 * all of their previous plans are removed before the new one is saved.
 *
 * Returns the number of plans deleted (0 if none existed).
 */
export async function deleteAllPlansForUser(userId: string): Promise<number> {
  if (!isSupabaseServiceConfigured()) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in the server environment."
    );
  }

  const client = createSupabaseServiceClient();
  if (!client) {
    throw new Error("Failed to create Supabase service client.");
  }

  const { data, error } = await client
    .from("plans")
    .delete()
    .eq("owner_user_id", userId)
    .select("share_id");

  if (error) {
    throw error;
  }

  return data?.length ?? 0;
}

/**
 * List plans owned by a user, newest first. Used by /my-plans.
 */
export async function listPlansForUser(userId: string) {
  if (!isSupabaseServiceConfigured()) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in the server environment."
    );
  }

  const client = createSupabaseServiceClient();
  if (!client) {
    throw new Error("Failed to create Supabase service client.");
  }

  const { data, error } = await client
    .from("plans")
    .select("share_id, title, source_format, imported_at, start_date, finish_date")
    .eq("owner_user_id", userId)
    .order("imported_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Load a plan only when it belongs to the given user. Used by the workspace
 * deep-link (/products/plansight-ai?shareId=...) so a stakeholder who pasted
 * the share URL into the PM workspace can't sneak into someone else's
 * insights/AI-analysis surface. Returns null if the plan doesn't exist or
 * belongs to someone else.
 */
export async function loadPlanForOwner(shareId: string, userId: string): Promise<Plan | null> {
  if (!isSupabaseServiceConfigured()) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in the server environment."
    );
  }

  const client = createSupabaseServiceClient();
  if (!client) {
    throw new Error("Failed to create Supabase service client.");
  }

  const { data: planRow, error: planError } = await client
    .from("plans")
    .select("*")
    .eq("share_id", shareId)
    .eq("owner_user_id", userId)
    .maybeSingle<SharedPlanRow>();

  if (planError) {
    throw planError;
  }

  if (!planRow) {
    return null;
  }

  const { data: taskRows, error: taskError } = await client
    .from("plan_tasks")
    .select("*")
    .eq("share_id", shareId)
    .order("task_order", { ascending: true });

  if (taskError) {
    throw taskError;
  }

  return buildPlanFromRows(planRow, (taskRows ?? []) as SharedPlanTaskRow[]);
}

/**
 * Find every plan owned by the given user that matches the title exactly.
 * Used by the duplicate-name detection on import: when a Pro user imports
 * a plan whose title matches one already on their account, we surface a
 * "replace existing?" prompt before saving. Match is case-sensitive and
 * trims whitespace at the edges so " Plan A " collides with "Plan A".
 *
 * Returns an array sorted newest first so the caller can show the most
 * recent in the conflict UI when there are multiple existing dupes.
 */
export async function findPlansByTitleForUser(
  userId: string,
  title: string
): Promise<{ shareId: string; title: string; importedAt: string }[]> {
  if (!isSupabaseServiceConfigured()) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in the server environment."
    );
  }

  const client = createSupabaseServiceClient();
  if (!client) {
    throw new Error("Failed to create Supabase service client.");
  }

  const trimmed = title.trim();
  if (!trimmed) {
    return [];
  }

  const { data, error } = await client
    .from("plans")
    .select("share_id, title, imported_at")
    .eq("owner_user_id", userId)
    .eq("title", trimmed)
    .order("imported_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    shareId: row.share_id,
    title: row.title,
    importedAt: row.imported_at
  }));
}

/**
 * Hard-delete a single plan by share_id and owner. owner_user_id is enforced
 * to prevent users from deleting plans they don't own. Returns true if a
 * row was deleted.
 */
export async function deletePlanForUser(shareId: string, userId: string): Promise<boolean> {
  if (!isSupabaseServiceConfigured()) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in the server environment."
    );
  }

  const client = createSupabaseServiceClient();
  if (!client) {
    throw new Error("Failed to create Supabase service client.");
  }

  const { data, error } = await client
    .from("plans")
    .delete()
    .eq("share_id", shareId)
    .eq("owner_user_id", userId)
    .select("share_id");

  if (error) {
    throw error;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Persist a shared plan. Writes go through the Supabase service-role key,
 * which bypasses RLS. The anon key in the browser is read-only.
 *
 * Phase 1: ownerUserId is reserved for Phase 4 (Supabase Auth). Pass null
 * for now; anonymous uploads keep owner_type='guest' with a 30-day expiry.
 */
export async function saveSharedPlan(
  shareId: string,
  plan: Plan,
  options?: { ownerUserId?: string | null; ownerType?: "guest" | "user" }
) {
  if (!isSupabaseServiceConfigured()) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in the server environment."
    );
  }

  const client = createSupabaseServiceClient();
  if (!client) {
    throw new Error("Failed to create Supabase service client.");
  }

  await cleanupExpiredGuestPlans(client).catch(() => {
    // Best-effort cleanup only.
  });

  const ownerType = options?.ownerType ?? "guest";
  const ownerUserId = options?.ownerUserId ?? null;
  const expiresAt = ownerType === "guest" ? getGuestPlanExpiryIso(24) : null;

  const sharedPlanRow: SharedPlanRow = {
    share_id: shareId,
    title: plan.title,
    source_format: plan.sourceFormat,
    imported_at: plan.importedAt,
    start_date: plan.startDate,
    finish_date: plan.finishDate,
    owner_type: ownerType,
    owner_user_id: ownerUserId,
    guest_id: null,
    expires_at: expiresAt
  };

  const taskRows: SharedPlanTaskRow[] = plan.tasks.map((task, index) => ({
    share_id: shareId,
    task_id: task.id,
    task_order: index,
    unique_id: task.uniqueId,
    parent_id: task.parentId,
    task_name: task.name,
    outline_level: task.outlineLevel,
    outline_number: task.outlineNumber,
    wbs: task.wbs,
    start_date: task.start,
    finish_date: task.finish,
    duration: task.duration,
    percent_complete: task.percentComplete,
    summary: task.summary,
    milestone: task.milestone,
    predecessors: task.predecessors,
    resource_names: task.resourceNames,
    notes: task.notes
  }));

  // Upsert plan row first; FK on plan_tasks requires it to exist.
  const { error: planError } = await client.from("plans").upsert(sharedPlanRow, {
    onConflict: "share_id"
  });
  if (planError) {
    throw planError;
  }

  // Replace tasks for this share_id atomically from the client's POV:
  // delete-then-insert. If the insert fails, the plan row stays but tasks are
  // empty — surfaced as an error to the caller, who can retry. We no longer
  // silently fall back to "tasks-only" reconstruction.
  const { error: deleteError } = await client.from("plan_tasks").delete().eq("share_id", shareId);
  if (deleteError) {
    throw deleteError;
  }

  if (taskRows.length > 0) {
    const { error: taskError } = await client.from("plan_tasks").insert(taskRows);
    if (taskError) {
      throw taskError;
    }
  }

  return plan;
}

export async function loadSharedPlan(shareId: string) {
  const result = await loadSharedPlanWithDebug(shareId);
  return result.plan;
}

/**
 * Lightweight owner lookup used by share-view telemetry to decide whether
 * the current viewer is the plan's PM owner (so we can flag is_owner_view).
 * Returns null if the plan doesn't exist, is guest-owned, or Supabase
 * isn't configured. Cheap indexed query against the plans table.
 */
export async function getSharedPlanOwner(shareId: string): Promise<string | null> {
  const client = createSupabaseAnonClient();
  if (!client) return null;

  const { data, error } = await client
    .from("plans")
    .select("owner_user_id")
    .eq("share_id", shareId)
    .maybeSingle<{ owner_user_id: string | null }>();

  if (error || !data) return null;
  return data.owner_user_id;
}

export async function loadSharedPlanWithDebug(shareId: string): Promise<{ plan: Plan | null; debug: SharedPlanDebug }> {
  // Reads use the anon client (RLS allows SELECT for anyone with the share_id).
  const client = createSupabaseAnonClient();
  if (!client || !isSupabaseConfigured()) {
    return {
      plan: null,
      debug: {
        shareId,
        hasPlanRow: false,
        taskCount: 0,
        planOwnerType: null,
        planExpired: false,
        source: "missing"
      }
    };
  }

  const { data: planRow, error: planError } = await client
    .from("plans")
    .select("*")
    .eq("share_id", shareId)
    .maybeSingle<SharedPlanRow>();

  if (planError) {
    throw planError;
  }

  if (!planRow) {
    return {
      plan: null,
      debug: {
        shareId,
        hasPlanRow: false,
        taskCount: 0,
        planOwnerType: null,
        planExpired: false,
        source: "missing"
      }
    };
  }

  const planExpired =
    !!planRow.expires_at &&
    planRow.owner_type === "guest" &&
    Date.parse(planRow.expires_at) <= Date.now();

  if (planExpired) {
    return {
      plan: null,
      debug: {
        shareId,
        hasPlanRow: true,
        taskCount: 0,
        planOwnerType: planRow.owner_type,
        planExpired: true,
        source: "missing"
      }
    };
  }

  const { data: taskRows, error: taskError } = await client
    .from("plan_tasks")
    .select("*")
    .eq("share_id", shareId)
    .order("task_order", { ascending: true });

  if (taskError) {
    throw taskError;
  }

  const rows = (taskRows ?? []) as SharedPlanTaskRow[];

  return {
    plan: buildPlanFromRows(planRow, rows),
    debug: {
      shareId,
      hasPlanRow: true,
      taskCount: rows.length,
      planOwnerType: planRow.owner_type,
      planExpired: false,
      source: "plans+tasks"
    }
  };
}

/**
 * Load a cached AI analysis if its content hash still matches the current
 * plan content. Returns null if no cache exists or the hash is stale.
 *
 * Reads use the anon client (RLS allows SELECT for anyone with the share_id).
 */
export async function loadAiAnalysisIfFresh(
  shareId: string,
  expectedContentHash: string
): Promise<AiAnalysis | null> {
  const client = createSupabaseAnonClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("plans")
    .select("ai_analysis, ai_analysis_content_hash")
    .eq("share_id", shareId)
    .maybeSingle<{
      ai_analysis: AiAnalysis | null;
      ai_analysis_content_hash: string | null;
    }>();

  if (error || !data) {
    return null;
  }

  if (!data.ai_analysis || data.ai_analysis_content_hash !== expectedContentHash) {
    return null;
  }

  return data.ai_analysis;
}

/**
 * Persist an AI analysis result alongside its content hash. Writes go through
 * the service-role key.
 */
export async function saveAiAnalysis(
  shareId: string,
  contentHash: string,
  analysis: AiAnalysis
): Promise<void> {
  if (!isSupabaseServiceConfigured()) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in the server environment."
    );
  }

  const client = createSupabaseServiceClient();
  if (!client) {
    throw new Error("Failed to create Supabase service client.");
  }

  const { error } = await client
    .from("plans")
    .update({
      ai_analysis: analysis,
      ai_analysis_content_hash: contentHash,
      ai_analysis_generated_at: analysis.generatedAt
    })
    .eq("share_id", shareId);

  if (error) {
    throw error;
  }
}
