import type { Plan, PlanTask } from "./types";
import { getGuestPlanExpiryIso } from "./guest";
import { createSupabaseAnonClient, isSupabaseConfigured } from "./supabase";
import { getSharedPlanRecord, storeSharedPlan } from "./share-registry";

type SharedPlanRow = {
  share_id: string;
  title: string;
  source_format: Plan["sourceFormat"];
  imported_at: string;
  start_date: string | null;
  finish_date: string | null;
  owner_type: "guest" | "user";
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
};

export type SharedPlanDebug = {
  shareId: string;
  hasPlanRow: boolean;
  taskCount: number;
  planOwnerType: "guest" | "user" | null;
  planExpired: boolean;
  source: "plans+tasks" | "tasks-only" | "registry" | "missing";
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
      resourceNames: row.resource_names ?? []
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

function inferPlanTitle(shareId: string, taskRows: SharedPlanTaskRow[]) {
  const rootTask = taskRows.find((row) => row.parent_id === null && row.summary);
  if (rootTask?.task_name) {
    return rootTask.task_name;
  }

  const firstTask = taskRows[0];
  if (firstTask?.task_name) {
    return firstTask.task_name;
  }

  return shareId;
}

function buildPlanFromTaskRows(shareId: string, taskRows: SharedPlanTaskRow[]): Plan {
  const tasks = taskRows
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
      resourceNames: row.resource_names ?? []
    }));

  const datedTasks = tasks.filter((task) => task.start && task.finish);
  const startDate = datedTasks.map((task) => task.start!).sort()[0] ?? null;
  const finishDate = datedTasks.map((task) => task.finish!).sort().at(-1) ?? null;

  return {
    id: shareId,
    title: inferPlanTitle(shareId, taskRows),
    sourceFormat: "mpp",
    importedAt: new Date().toISOString(),
    startDate,
    finishDate,
    tasks
  };
}

async function cleanupExpiredGuestPlans(client: ReturnType<typeof createSupabaseAnonClient>) {
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

export async function saveSharedPlan(
  shareId: string,
  plan: Plan,
  options?: { guestId?: string | null; ownerType?: "guest" | "user" }
) {
  const client = createSupabaseAnonClient();
  const record = storeSharedPlan(shareId, plan);

  if (!client) {
    return record.plan;
  }

  await cleanupExpiredGuestPlans(client).catch(() => {
    // Best-effort cleanup only.
  });

  const ownerType = options?.ownerType ?? "guest";
  const guestId = options?.guestId ?? null;
  const expiresAt = ownerType === "guest" ? getGuestPlanExpiryIso(30) : null;

  const sharedPlanRow: SharedPlanRow = {
    share_id: shareId,
    title: plan.title,
    source_format: plan.sourceFormat,
    imported_at: plan.importedAt,
    start_date: plan.startDate,
    finish_date: plan.finishDate,
    owner_type: ownerType,
    guest_id: guestId,
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
    resource_names: task.resourceNames
  }));

  const { error: planError } = await client.from("plans").upsert(sharedPlanRow, {
    onConflict: "share_id"
  });
  if (planError) {
    throw planError;
  }

  const { error: deleteError } = await client.from("plan_tasks").delete().eq("share_id", shareId);
  if (deleteError) {
    throw deleteError;
  }

  const { error: taskError } = await client.from("plan_tasks").insert(taskRows);
  if (taskError) {
    throw taskError;
  }

  return plan;
}

export async function loadSharedPlan(shareId: string) {
  const result = await loadSharedPlanWithDebug(shareId);
  return result.plan;
}

export async function loadSharedPlanWithDebug(shareId: string): Promise<{ plan: Plan | null; debug: SharedPlanDebug }> {
  const client = createSupabaseAnonClient();
  if (client && isSupabaseConfigured()) {
    await cleanupExpiredGuestPlans(client).catch(() => {
      // Best-effort cleanup only.
    });

    const { data: planRow, error: planError } = await client
      .from("plans")
      .select("*")
      .eq("share_id", shareId)
      .maybeSingle<SharedPlanRow>();

    const { data: taskRows, error: taskError } = await client
      .from("plan_tasks")
      .select("*")
      .eq("share_id", shareId)
      .order("task_order", { ascending: true });

    if (taskError) {
      throw taskError;
    }

    const rows = (taskRows ?? []) as SharedPlanTaskRow[];
    if (planRow) {
      const planExpired =
        !!planRow.expires_at &&
        planRow.owner_type === "guest" &&
        Date.parse(planRow.expires_at) <= Date.now();

      if (planExpired) {
        await client.from("plans").delete().eq("share_id", shareId);
        return {
          plan: null,
          debug: {
            shareId,
            hasPlanRow: true,
            taskCount: rows.length,
            planOwnerType: planRow.owner_type,
            planExpired: true,
            source: "missing"
          }
        };
      }

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

    if (rows.length > 0) {
      return {
        plan: buildPlanFromTaskRows(shareId, rows),
        debug: {
          shareId,
          hasPlanRow: false,
          taskCount: rows.length,
          planOwnerType: null,
          planExpired: false,
          source: "tasks-only"
        }
      };
    }

    if (planError) {
      throw planError;
    }
  }

  const registryPlan = getSharedPlanRecord(shareId)?.plan ?? null;
  return {
    plan: registryPlan,
    debug: {
      shareId,
      hasPlanRow: false,
      taskCount: registryPlan?.tasks.length ?? 0,
      planOwnerType: null,
      planExpired: false,
      source: registryPlan ? "registry" : "missing"
    }
  };
}
