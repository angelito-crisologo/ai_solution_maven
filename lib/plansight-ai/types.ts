export type PlanDependency = {
  predecessorTaskId: number | null;
  type: string | null;
  lag: string | null;
};

export type PlanTask = {
  id: number;
  uniqueId: number | null;
  parentId: number | null;
  name: string;
  outlineLevel: number;
  outlineNumber: string | null;
  wbs: string | null;
  start: string | null;
  finish: string | null;
  duration: string | null;
  percentComplete: number | null;
  summary: boolean;
  milestone: boolean;
  predecessors: PlanDependency[];
  resourceNames: string[];
};

export type Plan = {
  id: string;
  title: string;
  sourceFormat: "mpp" | "xlsx" | "smartsheet" | "other";
  importedAt: string;
  startDate: string | null;
  finishDate: string | null;
  tasks: PlanTask[];
};

export type PlanMetrics = {
  totalTasks: number;
  summaryTasks: number;
  milestoneTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  tasksWithoutDates: number;
  dependencyIssues: number;
  unassignedTasks: number;
  myTasks: number;
};
