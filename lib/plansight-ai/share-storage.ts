import type { Plan, PlanTask } from "./types";
import type { AiAnalysis } from "./ai";
import { getGuestPlanExpiryIso } from "./guest";
import {
  createSupabaseAnonClient,
  createSupabaseServiceClient,
  isSupabaseConfigured,
  isSupabaseServiceConfigured
} from "./supabase";

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
  const expiresAt = ownerType === "guest" ? getGuestPlanExpiryIso(30) : null;

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
