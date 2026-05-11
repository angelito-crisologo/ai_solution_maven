import { parsePlanDate } from "@/components/plansight-ai/plansight-utils";
import type { Plan, PlanTask } from "../types";
import type { PlanInsightsReport } from "../analysis";
import {
  PAYLOAD_CAPS,
  UPCOMING_WINDOW_DAYS,
  type AIPayload,
  type AIPayloadHealth,
  type AIPayloadMeta,
  type AIPayloadResource,
  type AIPayloadStructureNode,
  type AIPayloadTask,
  type AIPayloadTaskFlags,
  type BuildAIPayloadOptions
} from "./types";

/**
 * Build the bounded AI payload from a parsed plan + the deterministic
 * insights report. Pure function: no I/O, no Supabase, no Claude. The
 * returned shape is fixed and sized so that a 100-task plan and a
 * 25,000-task plan produce roughly the same number of tokens.
 *
 * See AI_PAYLOAD_IMPLEMENTATION_BRIEF.md for the architectural intent
 * and ./types.ts for the per-section caps and sort orders.
 */
export function buildAIPayload(
  plan: Plan,
  insights: PlanInsightsReport,
  opts: BuildAIPayloadOptions = {}
): AIPayload {
  const now = opts.now ?? new Date();
  const todayIdx = dayIndex(now);

  const taskById = new Map<number, PlanTask>();
  for (const task of plan.tasks) {
    taskById.set(task.id, task);
  }

  const flagSets = buildFlagSets(insights);

  const meta = buildMeta(plan, insights);
  const health = buildHealth(insights);

  const criticalTasks = buildCriticalTasks(insights, taskById, flagSets);
  const lateTasks = buildLateTasks(insights, taskById, flagSets);
  const atRiskTasks = buildAtRiskTasks(insights, taskById, flagSets);
  const milestones = buildMilestones(plan, taskById, flagSets);
  const bottlenecks = buildBottlenecks(insights, taskById, flagSets);
  const upcoming = buildUpcoming(plan, todayIdx, flagSets);
  const structure = buildStructure(plan);
  const resources = buildResources(plan, todayIdx);

  const referencedTaskIds = collectReferencedTaskIds(
    criticalTasks,
    lateTasks,
    atRiskTasks,
    milestones,
    bottlenecks,
    upcoming
  );

  return {
    meta,
    health,
    criticalTasks,
    lateTasks,
    atRiskTasks,
    milestones,
    bottlenecks,
    upcoming,
    structure,
    resources,
    referencedTaskIds
  };
}

// ---- meta / health ---------------------------------------------------------

function buildMeta(plan: Plan, insights: PlanInsightsReport): AIPayloadMeta {
  return {
    title: plan.title,
    startDate: plan.startDate,
    finishDate: plan.finishDate,
    totalTasks: plan.tasks.length,
    percentComplete: computeOverallPercentComplete(plan),
    ragStatus: insights.summary.healthStatus,
    criticalPathDurationDays: computeCriticalPathDuration(insights),
    mode: insights.mode
  };
}

function buildHealth(insights: PlanInsightsReport): AIPayloadHealth {
  const bottleneckCount = insights.insights.bottlenecks.length;
  const lateCount = insights.summary.lateTasks;
  const atRiskCount = insights.summary.atRiskTasks;
  const criticalCount = insights.summary.criticalTasks;
  const laggingCount = insights.summary.laggingTasks;

  const parts: string[] = [];
  if (lateCount > 0) parts.push(`${lateCount} late`);
  if (atRiskCount > 0) parts.push(`${atRiskCount} at-risk`);
  if (criticalCount > 0) parts.push(`${criticalCount} critical`);
  if (laggingCount > 0) parts.push(`${laggingCount} lagging`);
  if (bottleneckCount > 0) parts.push(`${bottleneckCount} bottlenecks`);
  const riskSummary = parts.length > 0 ? parts.join(", ") : "no active risks detected";

  return {
    lateCount,
    atRiskCount,
    criticalCount,
    laggingCount,
    bottleneckCount,
    riskSummary
  };
}

function computeOverallPercentComplete(plan: Plan): number | null {
  const childCounts = new Map<number, number>();
  for (const task of plan.tasks) {
    if (task.parentId != null) {
      childCounts.set(task.parentId, (childCounts.get(task.parentId) ?? 0) + 1);
    }
  }
  const leaves = plan.tasks.filter((task) => (childCounts.get(task.id) ?? 0) === 0);
  if (leaves.length === 0) return null;

  const completed = leaves.filter((task) => (task.percentComplete ?? 0) >= 100).length;
  return Math.round((completed / leaves.length) * 100);
}

function computeCriticalPathDuration(insights: PlanInsightsReport): number | null {
  if (insights.mode !== "cpm") return null;
  const longestPath = insights.insights.criticalPaths[0];
  if (!longestPath || longestPath.length === 0) return null;

  const criticalTasksById = new Map(insights.insights.criticalTasks.map((task) => [task.id, task] as const));
  let total = 0;
  for (const idStr of longestPath) {
    const id = Number.parseInt(idStr, 10);
    if (!Number.isFinite(id)) continue;
    const task = criticalTasksById.get(id);
    if (task) total += task.durationDays;
  }
  return total;
}

// ---- flag sets -------------------------------------------------------------

type FlagSets = {
  criticalIds: Set<number>;
  lateIds: Set<number>;
  atRiskIds: Set<number>;
  bottleneckIds: Set<number>;
};

function buildFlagSets(insights: PlanInsightsReport): FlagSets {
  // In approximate mode, "potentialCriticalTasks" carries the data — the
  // canonical criticalTasks array is empty by design in that mode.
  const criticalSource =
    insights.mode === "approximate"
      ? insights.insights.potentialCriticalTasks
      : insights.insights.criticalTasks;

  return {
    criticalIds: new Set(criticalSource.map((task) => task.id)),
    lateIds: new Set(insights.insights.lateTasks.map((task) => task.id)),
    atRiskIds: new Set(insights.insights.atRiskTasks.map((task) => task.id)),
    bottleneckIds: new Set(insights.insights.bottlenecks.map((task) => task.id))
  };
}

// ---- task sections (criticalTasks, lateTasks, atRiskTasks, milestones, bottlenecks, upcoming) ----

function buildCriticalTasks(
  insights: PlanInsightsReport,
  taskById: Map<number, PlanTask>,
  flagSets: FlagSets
): AIPayloadTask[] {
  if (insights.mode === "cpm") {
    // All zero-slack by definition; sort by durationDays desc (longer
    // critical tasks are the bigger schedule risk), id asc as tiebreaker.
    const sorted = [...insights.insights.criticalTasks].sort((a, b) => {
      if (b.durationDays !== a.durationDays) return b.durationDays - a.durationDays;
      return a.id - b.id;
    });
    return capAndMapToTaskPayload(sorted, PAYLOAD_CAPS.criticalTasks, taskById, flagSets);
  }

  // Approximate mode: insights already sorts potentialCriticalTasks by
  // daysFromProjectEnd asc, then durationDays desc, then id asc — matches
  // the brief's "least-interesting trimmed last" rule. Cap and map.
  return capAndMapToTaskPayload(
    insights.insights.potentialCriticalTasks,
    PAYLOAD_CAPS.criticalTasks,
    taskById,
    flagSets
  );
}

function buildLateTasks(
  insights: PlanInsightsReport,
  taskById: Map<number, PlanTask>,
  flagSets: FlagSets
): AIPayloadTask[] {
  // Insights returns these sorted by daysLate desc, id asc — matches brief.
  return capAndMapToTaskPayload(
    insights.insights.lateTasks,
    PAYLOAD_CAPS.lateTasks,
    taskById,
    flagSets
  );
}

function buildAtRiskTasks(
  insights: PlanInsightsReport,
  taskById: Map<number, PlanTask>,
  flagSets: FlagSets
): AIPayloadTask[] {
  // Insights returns these sorted by daysRemaining asc, id asc — matches brief.
  return capAndMapToTaskPayload(
    insights.insights.atRiskTasks,
    PAYLOAD_CAPS.atRiskTasks,
    taskById,
    flagSets
  );
}

function buildBottlenecks(
  insights: PlanInsightsReport,
  taskById: Map<number, PlanTask>,
  flagSets: FlagSets
): AIPayloadTask[] {
  // Insights returns these sorted by dependentTaskCount desc, id asc.
  return capAndMapToTaskPayload(
    insights.insights.bottlenecks,
    PAYLOAD_CAPS.bottlenecks,
    taskById,
    flagSets
  );
}

function buildMilestones(
  plan: Plan,
  taskById: Map<number, PlanTask>,
  flagSets: FlagSets
): AIPayloadTask[] {
  const milestones = plan.tasks.filter((task) => task.milestone === true);
  milestones.sort((a, b) => {
    const aCritical = flagSets.criticalIds.has(a.id) ? 0 : 1;
    const bCritical = flagSets.criticalIds.has(b.id) ? 0 : 1;
    if (aCritical !== bCritical) return aCritical - bCritical;
    const aFinish = a.finish ?? "";
    const bFinish = b.finish ?? "";
    const dateCmp = aFinish.localeCompare(bFinish);
    if (dateCmp !== 0) return dateCmp;
    return a.id - b.id;
  });
  return milestones
    .slice(0, PAYLOAD_CAPS.milestones)
    .map((task) => toAIPayloadTask(task, flagSets));
}

function buildUpcoming(
  plan: Plan,
  todayIdx: number,
  flagSets: FlagSets
): AIPayloadTask[] {
  const windowEndIdx = todayIdx + UPCOMING_WINDOW_DAYS;

  const upcoming = plan.tasks.filter((task) => {
    if (task.summary) return false;
    const startIdx = dateStringToDayIndex(task.start);
    const finishIdx = dateStringToDayIndex(task.finish);
    if (startIdx != null && startIdx >= todayIdx && startIdx <= windowEndIdx) return true;
    if (finishIdx != null && finishIdx >= todayIdx && finishIdx <= windowEndIdx) return true;
    return false;
  });

  upcoming.sort((a, b) => {
    const aDate = a.start ?? a.finish ?? "";
    const bDate = b.start ?? b.finish ?? "";
    const cmp = aDate.localeCompare(bDate);
    if (cmp !== 0) return cmp;
    return a.id - b.id;
  });

  return upcoming.slice(0, PAYLOAD_CAPS.upcoming).map((task) => toAIPayloadTask(task, flagSets));
}

// ---- structure / resources -------------------------------------------------

function buildStructure(plan: Plan): AIPayloadStructureNode[] {
  const summaries = plan.tasks.filter(
    (task) => task.summary && task.outlineLevel >= 1 && task.outlineLevel <= 3
  );
  if (summaries.length === 0) return [];

  const leafCounts = buildLeafCountByTaskId(plan);

  const sorted = [...summaries].sort((a, b) => {
    const aNum = a.outlineNumber ?? "";
    const bNum = b.outlineNumber ?? "";
    const cmp = aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: "base" });
    if (cmp !== 0) return cmp;
    return a.id - b.id;
  });

  return sorted.slice(0, PAYLOAD_CAPS.structure).map((task) => ({
    id: task.id,
    outlineNumber: task.outlineNumber,
    level: task.outlineLevel,
    name: task.name,
    leafTaskCount: leafCounts.get(task.id) ?? 0
  }));
}

function buildLeafCountByTaskId(plan: Plan): Map<number, number> {
  // Single-pass build of parent → children adjacency, then memoized
  // post-order counting. O(V) total.
  const childrenByParent = new Map<number, PlanTask[]>();
  for (const task of plan.tasks) {
    if (task.parentId != null) {
      const list = childrenByParent.get(task.parentId);
      if (list) {
        list.push(task);
      } else {
        childrenByParent.set(task.parentId, [task]);
      }
    }
  }

  const counts = new Map<number, number>();
  function count(taskId: number): number {
    const memo = counts.get(taskId);
    if (memo != null) return memo;
    const children = childrenByParent.get(taskId);
    if (!children || children.length === 0) {
      counts.set(taskId, 1);
      return 1;
    }
    let total = 0;
    for (const child of children) {
      total += count(child.id);
    }
    counts.set(taskId, total);
    return total;
  }
  for (const task of plan.tasks) count(task.id);
  return counts;
}

function buildResources(plan: Plan, todayIdx: number): AIPayloadResource[] {
  const taskCount = new Map<string, number>();
  const activeCount = new Map<string, number>();

  for (const task of plan.tasks) {
    if (task.summary) continue;
    const isActive = isCurrentlyActive(task, todayIdx);
    for (const rawName of task.resourceNames) {
      const name = rawName.trim();
      if (!name) continue;
      taskCount.set(name, (taskCount.get(name) ?? 0) + 1);
      if (isActive) {
        activeCount.set(name, (activeCount.get(name) ?? 0) + 1);
      }
    }
  }

  const entries: AIPayloadResource[] = [];
  taskCount.forEach((count, name) => {
    entries.push({
      name,
      taskCount: count,
      overallocated: (activeCount.get(name) ?? 0) >= 2
    });
  });

  entries.sort((a, b) => {
    if (a.taskCount !== b.taskCount) return b.taskCount - a.taskCount;
    return a.name.localeCompare(b.name);
  });

  return entries.slice(0, PAYLOAD_CAPS.resources);
}

function isCurrentlyActive(task: PlanTask, todayIdx: number): boolean {
  if ((task.percentComplete ?? 0) >= 100) return false;
  const startIdx = dateStringToDayIndex(task.start);
  const finishIdx = dateStringToDayIndex(task.finish);
  if (startIdx == null || finishIdx == null) return false;
  return startIdx <= todayIdx && finishIdx >= todayIdx;
}

// ---- task mapping ----------------------------------------------------------

function capAndMapToTaskPayload<T extends { id: number }>(
  sourceList: readonly T[],
  cap: number,
  taskById: Map<number, PlanTask>,
  flagSets: FlagSets
): AIPayloadTask[] {
  const out: AIPayloadTask[] = [];
  for (const entry of sourceList) {
    if (out.length >= cap) break;
    const raw = taskById.get(entry.id);
    if (!raw) continue;
    out.push(toAIPayloadTask(raw, flagSets));
  }
  return out;
}

function toAIPayloadTask(task: PlanTask, flagSets: FlagSets): AIPayloadTask {
  const startDate = parsePlanDate(task.start);
  const finishDate = parsePlanDate(task.finish);
  const durationDays =
    startDate && finishDate
      ? task.milestone
        ? 0
        : Math.max(1, dayIndex(finishDate) - dayIndex(startDate) + 1)
      : 0;

  const predecessorIds: number[] = [];
  const seen = new Set<number>();
  for (const dep of task.predecessors) {
    if (dep.predecessorTaskId == null) continue;
    if (seen.has(dep.predecessorTaskId)) continue;
    seen.add(dep.predecessorTaskId);
    predecessorIds.push(dep.predecessorTaskId);
    if (predecessorIds.length >= PAYLOAD_CAPS.predecessorIdsPerTask) break;
  }

  const flags: AIPayloadTaskFlags = {
    critical: flagSets.criticalIds.has(task.id),
    late: flagSets.lateIds.has(task.id),
    atRisk: flagSets.atRiskIds.has(task.id),
    milestone: task.milestone,
    bottleneck: flagSets.bottleneckIds.has(task.id)
  };

  return {
    id: task.id,
    name: task.name,
    start: task.start,
    finish: task.finish,
    durationDays,
    percentComplete: task.percentComplete,
    flags,
    predecessorIds
  };
}

function collectReferencedTaskIds(...sections: AIPayloadTask[][]): number[] {
  const set = new Set<number>();
  for (const section of sections) {
    for (const task of section) {
      for (const id of task.predecessorIds) {
        set.add(id);
      }
    }
  }
  return Array.from(set).sort((a, b) => a - b);
}

// ---- date helpers ----------------------------------------------------------

function dayIndex(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000
  );
}

function dateStringToDayIndex(value: string | null): number | null {
  if (!value) return null;
  const parsed = parsePlanDate(value);
  return parsed ? dayIndex(parsed) : null;
}
