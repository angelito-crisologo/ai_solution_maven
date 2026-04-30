import type { Plan, PlanTask } from "@/lib/plansight-ai/types";

export type TaskNode = PlanTask & {
  depth: number;
  children: TaskNode[];
};

export type ViewMode = "day" | "week" | "month";

export const PLAN_TABLE_HEADER_HEIGHT = 48;
export const PLAN_TABLE_ROW_HEIGHT = 40;
export const PLAN_GANTT_HEADER_HEIGHT = 48;
export const PLAN_GANTT_ROW_HEIGHT = 40;

function toLocalCalendarDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parsePlanDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : toLocalCalendarDate(date);
}

export function formatShortDate(value: string | null, options?: Intl.DateTimeFormatOptions) {
  const date = parsePlanDate(value);
  if (!date) return "Not set";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    ...options
  }).format(date);
}

export function formatLongDate(value: string | null) {
  const date = parsePlanDate(value);
  if (!date) return "Not set";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function daysBetween(start: Date, end: Date) {
  const normalizedStart = toLocalCalendarDate(start);
  const normalizedEnd = toLocalCalendarDate(end);
  const ms = 24 * 60 * 60 * 1000;
  return Math.round((normalizedEnd.getTime() - normalizedStart.getTime()) / ms);
}

export function addDays(date: Date, days: number) {
  const next = toLocalCalendarDate(date);
  next.setDate(next.getDate() + days);
  return next;
}

function taskSortKey(task: PlanTask) {
  return [task.outlineNumber ?? "", task.id] as const;
}

export function buildTaskTree(tasks: PlanTask[]): TaskNode[] {
  const byParent = new Map<number | null, PlanTask[]>();

  for (const task of tasks) {
    const bucket = byParent.get(task.parentId) ?? [];
    bucket.push(task);
    byParent.set(task.parentId, bucket);
  }

  const sortTasks = (items: PlanTask[]) =>
    [...items].sort((a, b) => {
      const [aOutline, aId] = taskSortKey(a);
      const [bOutline, bId] = taskSortKey(b);
      if (aOutline === bOutline) return aId - bId;
      return aOutline.localeCompare(bOutline, undefined, { numeric: true });
    });

  const visit = (parentId: number | null, depth: number): TaskNode[] => {
    const children = sortTasks(byParent.get(parentId) ?? []);
    return children.map((task) => ({
      ...task,
      depth,
      children: visit(task.id, depth + 1)
    }));
  };

  return visit(null, 0);
}

export function flattenVisibleTasks(
  nodes: TaskNode[],
  expanded: Set<number>,
  predicate: (task: TaskNode) => boolean
): TaskNode[] {
  const output: TaskNode[] = [];

  const visit = (node: TaskNode): boolean => {
    const childMatches: TaskNode[] = [];
    for (const child of node.children) {
      if (visit(child)) {
        childMatches.push(child);
      }
    }

    const selfMatches = predicate(node);
    const shouldInclude = selfMatches || childMatches.length > 0;

    if (!shouldInclude) {
      return false;
    }

    output.push({
      ...node,
      children: childMatches
    });

    return true;
  };

  for (const node of nodes) {
    visit(node);
  }

  return output;
}

export function filterTaskTree(
  nodes: TaskNode[],
  predicate: (task: TaskNode) => boolean
): TaskNode[] {
  const output: TaskNode[] = [];

  const visit = (node: TaskNode): TaskNode | null => {
    const children = node.children
      .map(visit)
      .filter((child): child is TaskNode => child !== null);
    const matches = predicate(node);

    if (!matches && children.length === 0) {
      return null;
    }

    return {
      ...node,
      children
    };
  };

  for (const node of nodes) {
    const result = visit(node);
    if (result) output.push(result);
  }

  return output;
}

export function collectNodeIdsWithChildren(nodes: TaskNode[]) {
  const ids = new Set<number>();

  const visit = (node: TaskNode) => {
    if (node.children.length > 0) ids.add(node.id);
    node.children.forEach(visit);
  };

  nodes.forEach(visit);
  return ids;
}

export function getPlanDateRange(plan: Plan) {
  const taskDates = plan.tasks.flatMap((task) => [parsePlanDate(task.start), parsePlanDate(task.finish)]);
  const dates = taskDates.filter((date): date is Date => date !== null);

  const start = plan.startDate ? parsePlanDate(plan.startDate) : null;
  const finish = plan.finishDate ? parsePlanDate(plan.finishDate) : null;

  const sorted = [...dates];
  if (start) sorted.push(start);
  if (finish) sorted.push(finish);

  if (sorted.length === 0) {
    const today = new Date();
    return { start: addDays(today, -7), end: addDays(today, 21) };
  }

  let min = sorted[0];
  let max = sorted[0];

  for (const date of sorted) {
    if (date < min) min = date;
    if (date > max) max = date;
  }

  return { start: addDays(min, -3), end: addDays(max, 3) };
}

export function getBucketKey(date: Date, mode: ViewMode) {
  const normalized = toLocalCalendarDate(date);

  if (mode === "day") {
    return `${normalized.getFullYear()}-${String(normalized.getMonth() + 1).padStart(2, "0")}-${String(
      normalized.getDate()
    ).padStart(2, "0")}`;
  }

  if (mode === "week") {
    const copy = new Date(normalized);
    const day = copy.getDay();
    copy.setDate(copy.getDate() - day);
    return `${copy.getFullYear()}-${String(copy.getMonth() + 1).padStart(2, "0")}-${String(
      copy.getDate()
    ).padStart(2, "0")}`;
  }

  return `${normalized.getFullYear()}-${String(normalized.getMonth() + 1).padStart(2, "0")}`;
}

export function getBucketLabel(date: Date, mode: ViewMode) {
  if (mode === "day") {
    const weekday = new Intl.DateTimeFormat("en", { weekday: "short" }).format(date);
    const monthDay = new Intl.DateTimeFormat("en", { month: "2-digit", day: "2-digit" }).format(date);
    return `${weekday}, ${monthDay}`;
  }

  if (mode === "week") {
    const end = addDays(date, 6);
    const monthDay = new Intl.DateTimeFormat("en", { month: "2-digit", day: "2-digit" }).format(end);
    return `WE ${monthDay}`;
  }

  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(date);
}

export function enumerateBuckets(start: Date, end: Date, mode: ViewMode) {
  const buckets: Date[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  const step = mode === "day" ? 1 : mode === "week" ? 7 : 1;

  while (current <= end) {
    buckets.push(new Date(current));
    if (mode === "month") {
      current.setMonth(current.getMonth() + 1);
      current.setDate(1);
    } else {
      current.setDate(current.getDate() + step);
    }
  }

  return buckets;
}

export function bucketWidth(mode: ViewMode) {
  if (mode === "day") return 64;
  if (mode === "week") return 128;
  return 256;
}

export function getBucketLabelParts(date: Date, mode: ViewMode) {
  if (mode === "day") {
    return {
      primary: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date),
      secondary: new Intl.DateTimeFormat("en", { month: "2-digit", day: "2-digit" }).format(date)
    };
  }

  if (mode === "week") {
    const end = addDays(date, 6);
    return {
      primary: "WE",
      secondary: new Intl.DateTimeFormat("en", { month: "2-digit", day: "2-digit" }).format(end)
    };
  }

  return {
    primary: new Intl.DateTimeFormat("en", { month: "short" }).format(date),
    secondary: new Intl.DateTimeFormat("en", { year: "2-digit" }).format(date)
  };
}
