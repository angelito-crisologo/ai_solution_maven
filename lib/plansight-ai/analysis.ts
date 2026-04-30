import type { Plan, PlanMetrics, PlanTask } from "./types";
import { parsePlanDate } from "@/components/plansight-ai/plansight-utils";

export type PlanInsightTask = {
  id: number;
  name: string;
  start: string | null;
  finish: string | null;
  progress: number | null;
  assignee: string;
  isSummary: boolean;
  isLeaf: boolean;
  milestone: boolean;
};

export type CriticalPathTask = PlanInsightTask & {
  slackDays: number;
  durationDays: number;
};

export type ApproximateCriticalTask = PlanInsightTask & {
  durationDays: number;
  daysFromProjectEnd: number;
  signals: Array<"near-end" | "project-end" | "long-duration">;
};

export type LateTask = PlanInsightTask & {
  daysLate: number;
};

export type AtRiskTask = PlanInsightTask & {
  daysRemaining: number;
};

export type LaggingTask = PlanInsightTask & {
  expectedProgress: number;
  gap: number;
};

export type BottleneckTask = PlanInsightTask & {
  dependentTaskCount: number;
};

export type PlanInsightsReport = {
  mode: "cpm" | "approximate";
  summary: {
    totalTasks: number;
    completedTasks: number;
    lateTasks: number;
    criticalTasks: number;
    atRiskTasks: number;
    laggingTasks: number;
    healthStatus: "green" | "amber" | "red";
  };
  insights: {
    criticalTasks: CriticalPathTask[];
    criticalPaths: string[][];
    potentialCriticalTasks: ApproximateCriticalTask[];
    projectEndDate: string | null;
    lateTasks: LateTask[];
    atRiskTasks: AtRiskTask[];
    laggingTasks: LaggingTask[];
    bottlenecks: BottleneckTask[];
  };
};

export type PlanInsight = {
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
};

type IndexedTask = PlanTask & {
  startDate: Date | null;
  finishDate: Date | null;
  durationDays: number | null;
};

type RelationType = "FS" | "SS" | "FF" | "SF";

type DependencyEdge = {
  predecessorId: number;
  successorId: number;
  relation: RelationType;
  lagDays: number;
};

type CriticalPathSequence = {
  path: number[];
  durationDays: number;
};

const MY_TASK_OWNER = "Angelito Crisologo";
const DEFAULT_AT_RISK_WINDOW_DAYS = 14;

function normalizeDate(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function toDayIndex(date: Date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / (24 * 60 * 60 * 1000));
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getProgressBucket(task: PlanTask) {
  if (task.percentComplete == null) {
    return "not-started";
  }

  if (task.percentComplete >= 100) {
    return "completed";
  }

  if (task.percentComplete > 0) {
    return "in-progress";
  }

  return "not-started";
}

function hasValidDependency(task: PlanTask, taskIds: Set<number>) {
  return task.predecessors.every((dependency) => {
    if (dependency.predecessorTaskId == null) {
      return false;
    }

    return taskIds.has(dependency.predecessorTaskId);
  });
}

function hasProvidedDependencies(tasks: PlanTask[]) {
  return tasks.some((task) => task.predecessors.some((dependency) => dependency.predecessorTaskId != null));
}

function parseLagDays(lag: string | null) {
  if (!lag) return 0;

  const match = lag.trim().match(/[-+]?\d+/);
  if (!match) return 0;

  const parsed = Number.parseInt(match[0], 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeRelation(type: string | null): RelationType {
  const normalized = (type ?? "").trim().toUpperCase();

  if (normalized === "SS" || normalized === "START_START") return "SS";
  if (normalized === "FF" || normalized === "FINISH_FINISH") return "FF";
  if (normalized === "SF" || normalized === "START_FINISH") return "SF";
  return "FS";
}

function buildChildCounts(tasks: PlanTask[]) {
  const childCounts = new Map<number, number>();

  for (const task of tasks) {
    if (task.parentId == null) continue;
    childCounts.set(task.parentId, (childCounts.get(task.parentId) ?? 0) + 1);
  }

  return childCounts;
}

function toInsightTask(task: PlanTask, childCounts: Map<number, number>): PlanInsightTask {
  return {
    id: task.id,
    name: task.name,
    start: task.start,
    finish: task.finish,
    progress: task.percentComplete,
    assignee: task.resourceNames.length > 0 ? task.resourceNames.join(", ") : "Unassigned",
    isSummary: task.summary,
    isLeaf: (childCounts.get(task.id) ?? 0) === 0,
    milestone: task.milestone
  };
}

function buildIndexedTasks(plan: Plan) {
  return plan.tasks.map<IndexedTask>((task) => {
    const startDate = parsePlanDate(task.start);
    const finishDate = parsePlanDate(task.finish);
    const durationDays =
      startDate && finishDate
        ? task.milestone
          ? 0
          : Math.max(1, toDayIndex(finishDate) - toDayIndex(startDate) + 1)
        : null;

    return {
      ...task,
      startDate,
      finishDate,
      durationDays
    };
  });
}

function buildDependencyGraph(tasks: IndexedTask[]) {
  const taskIds = new Set(tasks.map((task) => task.id));
  const outgoing = new Map<number, DependencyEdge[]>();
  const incoming = new Map<number, DependencyEdge[]>();
  const incomingCount = new Map<number, number>();

  for (const task of tasks) {
    outgoing.set(task.id, []);
    incoming.set(task.id, []);
    incomingCount.set(task.id, 0);
  }

  for (const task of tasks) {
    for (const dependency of task.predecessors) {
      if (dependency.predecessorTaskId == null) continue;
      if (!taskIds.has(dependency.predecessorTaskId)) continue;

      const edge = {
        predecessorId: dependency.predecessorTaskId,
        successorId: task.id,
        relation: normalizeRelation(dependency.type),
        lagDays: parseLagDays(dependency.lag)
      } satisfies DependencyEdge;

      outgoing.get(edge.predecessorId)?.push(edge);
      incoming.get(edge.successorId)?.push(edge);
      incomingCount.set(task.id, (incomingCount.get(task.id) ?? 0) + 1);
    }
  }

  return { taskIds, outgoing, incoming, incomingCount };
}

function topologicalOrder(tasks: IndexedTask[], incomingCount: Map<number, number>, outgoing: Map<number, DependencyEdge[]>) {
  const queue = tasks.filter((task) => (incomingCount.get(task.id) ?? 0) === 0).map((task) => task.id);
  const order: number[] = [];
  const remaining = new Map(incomingCount);

  while (queue.length > 0) {
    const id = queue.shift();
    if (id == null) continue;

    order.push(id);

    for (const edge of outgoing.get(id) ?? []) {
      const nextCount = (remaining.get(edge.successorId) ?? 0) - 1;
      remaining.set(edge.successorId, nextCount);
      if (nextCount === 0) {
        queue.push(edge.successorId);
      }
    }
  }

  if (order.length !== tasks.length) {
    const visited = new Set(order);
    for (const task of tasks) {
      if (!visited.has(task.id)) {
        order.push(task.id);
      }
    }
  }

  return order;
}

function getSuccessorsMap(tasks: IndexedTask[]) {
  const map = new Map<number, Array<{ id: number; relation: RelationType; lagDays: number }>>();
  const taskIds = new Set(tasks.map((task) => task.id));

  for (const task of tasks) {
    if (!map.has(task.id)) {
      map.set(task.id, []);
    }

    for (const dependency of task.predecessors) {
      if (dependency.predecessorTaskId == null || !taskIds.has(dependency.predecessorTaskId)) continue;

      const list = map.get(dependency.predecessorTaskId) ?? [];
      list.push({
        id: task.id,
        relation: normalizeRelation(dependency.type),
        lagDays: parseLagDays(dependency.lag)
      });
      map.set(dependency.predecessorTaskId, list);
    }
  }

  return map;
}

function computeCriticalPath(tasks: IndexedTask[], childCounts: Map<number, number>) {
  const schedulableTasks = tasks.filter(
    (task) => !task.summary && task.startDate && task.finishDate && task.durationDays != null
  );
  if (schedulableTasks.length === 0) {
    return {
      mode: "cpm" as const,
      criticalTasks: [],
      criticalPaths: [],
      potentialCriticalTasks: [] as ApproximateCriticalTask[],
      projectEndDate: null
    };
  }

  const { outgoing, incoming, incomingCount } = buildDependencyGraph(schedulableTasks);
  const order = topologicalOrder(schedulableTasks, incomingCount, outgoing);
  const taskById = new Map(schedulableTasks.map((task) => [task.id, task] as const));

  const earliestStart = new Map<number, number>();
  const earliestFinish = new Map<number, number>();

  for (const id of order) {
    const task = taskById.get(id);
    if (!task || task.durationDays == null) continue;

    let start = 0;
    for (const dependency of incoming.get(id) ?? []) {
      const predecessor = taskById.get(dependency.predecessorId);
      if (!predecessor || predecessor.durationDays == null) continue;

      const predStart = earliestStart.get(predecessor.id) ?? 0;
      const predFinish = earliestFinish.get(predecessor.id) ?? predStart + predecessor.durationDays;
      const lagDays = dependency.lagDays;

      if (dependency.relation === "FS") {
        start = Math.max(start, predFinish + lagDays);
      } else if (dependency.relation === "SS") {
        start = Math.max(start, predStart + lagDays);
      } else if (dependency.relation === "FF") {
        start = Math.max(start, predFinish + lagDays - task.durationDays);
      } else {
        start = Math.max(start, predStart + lagDays - task.durationDays);
      }
    }

    earliestStart.set(id, start);
    earliestFinish.set(id, start + task.durationDays);
  }

  const projectFinish = order.reduce((max, id) => Math.max(max, earliestFinish.get(id) ?? 0), 0) || 0;

  const latestStart = new Map<number, number>();
  const latestFinish = new Map<number, number>();

  for (const id of [...order].reverse()) {
    const task = taskById.get(id);
    if (!task || task.durationDays == null) continue;

    const taskSuccessors = outgoing.get(id) ?? [];
    let finish = taskSuccessors.length === 0 ? projectFinish : Number.POSITIVE_INFINITY;

    for (const successor of taskSuccessors) {
      const succTask = taskById.get(successor.successorId);
      if (!succTask || succTask.durationDays == null) continue;

      const succLatestStart = latestStart.get(successor.successorId);
      const succLatestFinish = latestFinish.get(successor.successorId);
      if (succLatestStart == null || succLatestFinish == null) continue;

      let candidateFinish = projectFinish;
      if (successor.relation === "FS") {
        candidateFinish = succLatestStart - successor.lagDays;
      } else if (successor.relation === "SS") {
        candidateFinish = succLatestStart - successor.lagDays + task.durationDays;
      } else if (successor.relation === "FF") {
        candidateFinish = succLatestFinish - successor.lagDays;
      } else {
        candidateFinish = succLatestFinish - successor.lagDays + task.durationDays;
      }

      finish = Math.min(finish, candidateFinish);
    }

    if (!Number.isFinite(finish)) {
      finish = projectFinish;
    }

    latestFinish.set(id, finish);
    latestStart.set(id, finish - task.durationDays);
  }

  const criticalEntries = schedulableTasks
    .map((task) => {
      const es = earliestStart.get(task.id);
      const ls = latestStart.get(task.id);
      if (es == null || ls == null) return null;

      return {
        task,
        earliestStart: es,
        slackDays: Math.max(0, ls - es)
      };
    })
    .filter((entry): entry is { task: IndexedTask; earliestStart: number; slackDays: number } => entry !== null)
    .filter((entry) => entry.slackDays === 0)
    .sort((a, b) => a.earliestStart - b.earliestStart || a.task.id - b.task.id);

  const criticalTaskIds = new Set(criticalEntries.map((entry) => entry.task.id));
  const allCriticalPaths = buildCriticalPaths({
    criticalTaskIds,
    incoming,
    outgoing,
    earliestStart,
    taskById
  });

  const maxDurationDays = allCriticalPaths.reduce((max, entry) => Math.max(max, entry.durationDays), 0);
  const selectedCriticalPaths =
    maxDurationDays > 0
      ? allCriticalPaths.filter((entry) => entry.durationDays === maxDurationDays)
      : allCriticalPaths;
  const uniqueCriticalPaths = dedupeCriticalPaths(selectedCriticalPaths);

  const selectedCriticalTaskIds = new Set(uniqueCriticalPaths.flatMap((entry) => entry.path));
  const criticalTasks = criticalEntries
    .filter((entry) => selectedCriticalTaskIds.has(entry.task.id))
    .map((entry) => ({
      ...toInsightTask(entry.task, childCounts),
      slackDays: entry.slackDays,
      durationDays: entry.task.durationDays ?? 0
    }));

  return {
    mode: "cpm" as const,
    criticalTasks,
    criticalPaths: uniqueCriticalPaths.map((entry) => entry.path.map(String)),
    potentialCriticalTasks: [] as ApproximateCriticalTask[],
    projectEndDate: null
  };
}

function computeApproximateCriticalTasks(tasks: IndexedTask[], childCounts: Map<number, number>) {
  const candidateTasks = tasks.filter((task) => {
    const isLeaf = (childCounts.get(task.id) ?? 0) === 0;
    return !task.summary && (isLeaf || task.milestone) && task.finishDate != null;
  });

  if (candidateTasks.length === 0) {
    return {
      mode: "approximate" as const,
      projectEndDate: null,
      criticalTasks: [] as CriticalPathTask[],
      criticalPaths: [] as string[][],
      potentialCriticalTasks: [] as ApproximateCriticalTask[]
    };
  }

  const projectEndTask = candidateTasks.reduce((latest, task) => {
    if (!latest.finishDate) return task;
    if (!task.finishDate) return latest;
    return toDayIndex(task.finishDate) >= toDayIndex(latest.finishDate) ? task : latest;
  }, candidateTasks[0]);
  const projectEndDate = projectEndTask.finishDate ? normalizeDate(projectEndTask.finishDate).toISOString() : null;

  const firstTaskDate = candidateTasks.reduce((earliest, task) => {
    const taskStart = task.startDate ?? task.finishDate;
    if (!taskStart) return earliest;
    if (!earliest) return taskStart;
    return toDayIndex(taskStart) <= toDayIndex(earliest) ? taskStart : earliest;
  }, candidateTasks[0].startDate ?? candidateTasks[0].finishDate);

  const projectStartIndex = firstTaskDate ? toDayIndex(firstTaskDate) : toDayIndex(projectEndTask.finishDate as Date);
  const projectEndIndex = toDayIndex(projectEndTask.finishDate as Date);
  const projectSpanDays = Math.max(1, projectEndIndex - projectStartIndex + 1);
  const nearEndWindowDays = Math.max(3, Math.ceil(projectSpanDays * 0.1));
  const longDurationThreshold = Math.max(3, Math.ceil(projectSpanDays * 0.2));

  const potentialCriticalTasks = candidateTasks
    .map((task) => {
      const finishIndex = toDayIndex(task.finishDate as Date);
      const startIndex = task.startDate ? toDayIndex(task.startDate) : finishIndex;
      const durationDays = task.durationDays ?? Math.max(1, finishIndex - startIndex + 1);
      const daysFromProjectEnd = Math.max(0, projectEndIndex - finishIndex);
      const signals: Array<"near-end" | "project-end" | "long-duration"> = [];

      if (daysFromProjectEnd === 0) {
        signals.push("project-end");
      }

      if (daysFromProjectEnd <= nearEndWindowDays) {
        signals.push("near-end");
      }

      if (durationDays >= longDurationThreshold) {
        signals.push("long-duration");
      }

      return {
        task,
        durationDays,
        daysFromProjectEnd,
        signals
      };
    })
    .filter((entry) => entry.signals.length > 0)
    .sort((a, b) => {
      const projectEndDiff = a.daysFromProjectEnd - b.daysFromProjectEnd;
      if (projectEndDiff !== 0) return projectEndDiff;

      const durationDiff = b.durationDays - a.durationDays;
      if (durationDiff !== 0) return durationDiff;

      return a.task.id - b.task.id;
    })
    .map((entry) => ({
      ...toInsightTask(entry.task, childCounts),
      durationDays: entry.durationDays,
      daysFromProjectEnd: entry.daysFromProjectEnd,
      signals: entry.signals
    }));

  return {
    mode: "approximate" as const,
    projectEndDate,
    criticalTasks: [] as CriticalPathTask[],
    criticalPaths: [] as string[][],
    potentialCriticalTasks
  };
}

function dedupeCriticalPaths(paths: CriticalPathSequence[]) {
  const unique = new Map<string, CriticalPathSequence>();

  for (const path of paths) {
    const key = path.path.join(">");
    const existing = unique.get(key);
    if (!existing || path.durationDays > existing.durationDays) {
      unique.set(key, path);
    }
  }

  return Array.from(unique.values()).sort((a, b) => {
    const durationDiff = b.durationDays - a.durationDays;
    if (durationDiff !== 0) return durationDiff;

    const aKey = a.path.join(">");
    const bKey = b.path.join(">");
    return aKey.localeCompare(bKey);
  });
}

function buildCriticalPaths({
  criticalTaskIds,
  incoming,
  outgoing,
  earliestStart,
  taskById
}: {
  criticalTaskIds: Set<number>;
  incoming: Map<number, DependencyEdge[]>;
  outgoing: Map<number, DependencyEdge[]>;
  earliestStart: Map<number, number>;
  taskById: Map<number, IndexedTask>;
}) {
  if (criticalTaskIds.size === 0) {
    return [] as CriticalPathSequence[];
  }

  const sortedCriticalIds = Array.from(criticalTaskIds).sort((a, b) => {
    const startDiff = (earliestStart.get(a) ?? 0) - (earliestStart.get(b) ?? 0);
    return startDiff !== 0 ? startDiff : a - b;
  });

  const startIds = sortedCriticalIds.filter((id) => (incoming.get(id) ?? []).length === 0);
  const entryIds = startIds.length > 0 ? startIds : sortedCriticalIds;
  const paths: CriticalPathSequence[] = [];
  const seen = new Set<string>();

  const getCriticalSuccessors = (id: number) =>
    (outgoing.get(id) ?? [])
      .map((edge) => edge.successorId)
      .filter((successorId) => criticalTaskIds.has(successorId))
      .sort((a, b) => {
        const startDiff = (earliestStart.get(a) ?? 0) - (earliestStart.get(b) ?? 0);
        return startDiff !== 0 ? startDiff : a - b;
      });

  const walk = (currentId: number, path: number[], visited: Set<number>) => {
    const successors = getCriticalSuccessors(currentId).filter((successorId) => !visited.has(successorId));

    if (successors.length === 0) {
      const key = path.join(">");
      if (!seen.has(key)) {
        seen.add(key);
        const firstId = path[0];
        const durationDays = path.reduce((sum, taskId) => {
          const task = taskById.get(taskId);
          return sum + (task?.durationDays ?? 0);
        }, 0);
        paths.push({
          path: [...path],
          durationDays
        });
      }
      return;
    }

    for (const successorId of successors) {
      const nextVisited = new Set(visited);
      nextVisited.add(successorId);
      walk(successorId, [...path, successorId], nextVisited);
    }
  };

  for (const startId of entryIds) {
    walk(startId, [startId], new Set([startId]));
  }

  return paths;
}

function computeLateTasks(tasks: IndexedTask[], referenceDate: Date, childCounts: Map<number, number>) {
  const today = toDayIndex(normalizeDate(referenceDate));

  return tasks
    .filter((task) => task.finishDate && clampPercent(task.percentComplete ?? 0) < 100)
    .map((task) => {
      const finish = toDayIndex(task.finishDate as Date);
      return {
        task,
        daysLate: today - finish
      };
    })
    .filter((entry) => entry.daysLate > 0)
    .map((entry) => ({
      ...toInsightTask(entry.task, childCounts),
      daysLate: entry.daysLate
    }))
    .sort((a, b) => b.daysLate - a.daysLate || a.id - b.id);
}

function computeAtRiskTasks(tasks: IndexedTask[], referenceDate: Date, windowDays: number, childCounts: Map<number, number>) {
  const today = toDayIndex(normalizeDate(referenceDate));

  return tasks
    .filter((task) => task.finishDate && clampPercent(task.percentComplete ?? 0) < 100)
    .map((task) => {
      const finish = toDayIndex(task.finishDate as Date);
      return {
        task,
        daysRemaining: finish - today
      };
    })
    .filter((entry) => entry.daysRemaining >= 0 && entry.daysRemaining <= windowDays)
    .map((entry) => ({
      ...toInsightTask(entry.task, childCounts),
      daysRemaining: entry.daysRemaining
    }))
    .sort((a, b) => a.daysRemaining - b.daysRemaining || a.id - b.id);
}

function computeLaggingTasks(tasks: IndexedTask[], referenceDate: Date, childCounts: Map<number, number>) {
  const today = toDayIndex(normalizeDate(referenceDate));

  return tasks
    .filter((task) => task.startDate && task.finishDate)
    .map((task) => {
      const start = toDayIndex(task.startDate as Date);
      const finish = toDayIndex(task.finishDate as Date);
      const span = Math.max(1, finish - start + 1);
      const elapsed = Math.max(0, Math.min(span, today - start + 1));
      const expectedProgress = clampPercent((elapsed / span) * 100);
      const actualProgress = clampPercent(task.percentComplete ?? 0);
      return {
        task,
        expectedProgress,
        actualProgress,
        gap: Math.max(0, expectedProgress - actualProgress)
      };
    })
    .filter((entry) => entry.gap > 0)
    .map((entry) => ({
      ...toInsightTask(entry.task, childCounts),
      expectedProgress: entry.expectedProgress,
      gap: entry.gap
    }))
    .sort((a, b) => b.gap - a.gap || a.id - b.id);
}

function computeBottlenecks(tasks: IndexedTask[], childCounts: Map<number, number>) {
  const successors = getSuccessorsMap(tasks);

  return tasks
    .map((task) => ({
      task,
      dependentTaskCount: (successors.get(task.id) ?? []).length
    }))
    .filter((entry) => entry.dependentTaskCount > 0)
    .sort((a, b) => b.dependentTaskCount - a.dependentTaskCount || a.task.id - b.task.id)
    .map((entry) => ({
      ...toInsightTask(entry.task, childCounts),
      dependentTaskCount: entry.dependentTaskCount
    }));
}

function computeApproximateHealthStatus({
  totalLeafTasks,
  lateCount,
  laggingCount,
  nearEndCount
}: {
  totalLeafTasks: number;
  lateCount: number;
  laggingCount: number;
  nearEndCount: number;
}): "green" | "amber" | "red" {
  const lateRatio = totalLeafTasks > 0 ? lateCount / totalLeafTasks : 0;
  const laggingRatio = totalLeafTasks > 0 ? laggingCount / totalLeafTasks : 0;
  const nearEndRatio = totalLeafTasks > 0 ? nearEndCount / totalLeafTasks : 0;
  const manyLaggingTasks = laggingCount >= Math.max(4, Math.ceil(totalLeafTasks * 0.15));
  const highCongestion = nearEndCount >= Math.max(5, Math.ceil(totalLeafTasks * 0.25));

  if (lateRatio > 0.2 || manyLaggingTasks || nearEndRatio >= 0.3) {
    return "red";
  }

  if (lateRatio > 0.05 || laggingRatio > 0.1 || highCongestion) {
    return "amber";
  }

  return "green";
}

export function summarizePlan(plan: Plan): PlanMetrics {
  const taskIds = new Set(plan.tasks.map((task) => task.id));
  const childCounts = buildChildCounts(plan.tasks);
  const leafTasks = plan.tasks.filter((task) => (childCounts.get(task.id) ?? 0) === 0);

  let summaryTasks = 0;
  let milestoneTasks = 0;
  let completedTasks = 0;
  let inProgressTasks = 0;
  let notStartedTasks = 0;
  let tasksWithoutDates = 0;
  let dependencyIssues = 0;
  let unassignedTasks = 0;
  let myTasks = 0;

  for (const task of leafTasks) {
    if (task.summary) summaryTasks += 1;
    if (task.milestone) milestoneTasks += 1;
    if (task.start == null || task.finish == null) tasksWithoutDates += 1;
    if (task.resourceNames.length === 0) unassignedTasks += 1;
    if (task.resourceNames.some((resource) => resource === MY_TASK_OWNER)) {
      myTasks += 1;
    }

    const progress = getProgressBucket(task);
    if (progress === "completed") completedTasks += 1;
    if (progress === "in-progress") inProgressTasks += 1;
    if (progress === "not-started") notStartedTasks += 1;

    if (!hasValidDependency(task, taskIds)) {
      dependencyIssues += 1;
    }
  }

  return {
    totalTasks: leafTasks.length,
    summaryTasks,
    milestoneTasks,
    completedTasks,
    inProgressTasks,
    notStartedTasks,
    tasksWithoutDates,
    dependencyIssues,
    unassignedTasks,
    myTasks
  };
}

export function buildInsightsReport(
  plan: Plan,
  referenceDate: Date = new Date(),
  atRiskWindowDays = DEFAULT_AT_RISK_WINDOW_DAYS
): PlanInsightsReport {
  const tasks = buildIndexedTasks(plan);
  const childCounts = buildChildCounts(plan.tasks);
  const leafTasks = tasks.filter((task) => (childCounts.get(task.id) ?? 0) === 0);
  const approximateMode = !hasProvidedDependencies(plan.tasks);
  const critical = approximateMode ? computeApproximateCriticalTasks(tasks, childCounts) : computeCriticalPath(tasks, childCounts);
  const lateTasks = computeLateTasks(tasks, referenceDate, childCounts);
  const atRiskTasks = computeAtRiskTasks(tasks, referenceDate, atRiskWindowDays, childCounts);
  const laggingTasks = computeLaggingTasks(tasks, referenceDate, childCounts);
  const laggingLeafTasks = laggingTasks.filter((task) => task.isLeaf);
  const bottlenecks = computeBottlenecks(tasks, childCounts);
  const lateTaskRatio = leafTasks.length > 0 ? lateTasks.filter((task) => task.isLeaf).length / leafTasks.length : 0;
  const criticalTasksForHealth = approximateMode
    ? critical.potentialCriticalTasks
    : critical.criticalTasks;
  const criticalLateCount = criticalTasksForHealth.filter((task) => lateTasks.some((lateTask) => lateTask.id === task.id)).length;
  const criticalAtRiskCount = criticalTasksForHealth.filter((task) =>
    atRiskTasks.some((atRiskTask) => atRiskTask.id === task.id)
  ).length;
  const laggingRatio = leafTasks.length > 0 ? laggingLeafTasks.length / leafTasks.length : 0;
  const approximateNearEndCount = approximateMode
    ? critical.potentialCriticalTasks.filter((task) => task.signals.includes("near-end") || task.signals.includes("project-end")).length
    : 0;
  const healthStatus: "green" | "amber" | "red" = approximateMode
    ? computeApproximateHealthStatus({
        totalLeafTasks: leafTasks.length,
        lateCount: lateTasks.filter((task) => task.isLeaf).length,
        laggingCount: laggingLeafTasks.length,
        nearEndCount: approximateNearEndCount
      })
    : lateTaskRatio > 0.2 || criticalLateCount > 0
      ? "red"
      : lateTaskRatio >= 0.05 || laggingRatio > 0.1 || criticalAtRiskCount > 0
        ? "amber"
        : "green";

  return {
    mode: approximateMode ? "approximate" : "cpm",
    summary: {
      totalTasks: leafTasks.length,
      completedTasks: leafTasks.filter((task) => clampPercent(task.percentComplete ?? 0) >= 100).length,
      lateTasks: lateTasks.filter((task) => task.isLeaf).length,
      criticalTasks: criticalTasksForHealth.length,
      atRiskTasks: atRiskTasks.filter((task) => task.isLeaf).length,
      laggingTasks: laggingLeafTasks.length,
      healthStatus
    },
    insights: {
      criticalTasks: approximateMode ? critical.criticalTasks : critical.criticalTasks,
      criticalPaths: critical.criticalPaths,
      potentialCriticalTasks: approximateMode ? critical.potentialCriticalTasks : [],
      projectEndDate: approximateMode ? critical.projectEndDate : null,
      lateTasks,
      atRiskTasks,
      laggingTasks,
      bottlenecks
    }
  };
}

export function analyzePlan(plan: Plan): PlanInsight[] {
  const report = buildInsightsReport(plan);
  const insights: PlanInsight[] = [];

  insights.push({
    title:
      report.summary.healthStatus === "red"
        ? "Project health is red"
        : report.summary.healthStatus === "amber"
          ? "Project health is amber"
          : "Project health is green",
    description:
      report.summary.healthStatus === "red"
        ? "The schedule has critical lateness or a critical-path delay that needs immediate attention."
        : report.summary.healthStatus === "amber"
          ? "The schedule has near-term risk or lagging work and should be monitored closely."
          : "The schedule is currently tracking cleanly with no major late or critical-path issues.",
    severity: report.summary.healthStatus === "red" ? "high" : report.summary.healthStatus === "amber" ? "medium" : "low"
  });

  if (report.mode === "approximate") {
    insights.push({
      title: "Approximate impact analysis",
      description:
        "Task dependencies are not available, so the engine is highlighting likely high-impact tasks near project completion instead of computing a true critical path.",
      severity: "medium"
    });
  }

  if (report.summary.criticalTasks > 0) {
    insights.push({
      title: report.mode === "approximate" ? "Potential critical tasks identified" : "Critical path identified",
      description:
        report.mode === "approximate"
          ? `${report.summary.criticalTasks} tasks land near the project end date or carry longer schedule impact.`
          : `${report.summary.criticalTasks} tasks currently sit on the zero-slack path that determines the project finish date.`,
      severity: report.mode === "approximate" ? "medium" : "high"
    });
  }

  if (report.mode === "approximate") {
    insights.push({
      title: "Near-completion risk",
      description:
        "Tasks near project completion are likely to impact delivery if delayed.",
      severity: "medium"
    });
  }

  if (report.summary.lateTasks > 0) {
    insights.push({
      title: "Late work detected",
      description:
        `${report.summary.lateTasks} tasks have slipped past their end date without reaching completion.`,
      severity: "high"
    });
  }

  if (report.summary.atRiskTasks > 0) {
    insights.push({
      title: "Near-term risk",
      description:
        `${report.summary.atRiskTasks} tasks are due within the next two weeks and still need attention.`,
      severity: "medium"
    });
  }

  if (report.insights.laggingTasks.length > 0) {
    insights.push({
      title: "Progress lag",
      description:
        `${report.summary.laggingTasks} tasks are behind their expected progress based on schedule elapsed.`,
      severity: "medium"
    });
  }

  if (report.insights.bottlenecks.length > 0) {
    insights.push({
      title: "Dependency bottlenecks",
      description:
        `${report.insights.bottlenecks[0].name} blocks ${report.insights.bottlenecks[0].dependentTaskCount} downstream tasks.`,
      severity: "medium"
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: "Plan structure looks ready",
      description:
        "The uploaded plan has enough structure to generate a readable summary and a stakeholder-friendly share view.",
      severity: "low"
    });
  }

  return insights;
}
