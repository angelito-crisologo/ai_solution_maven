import type { Plan } from "../types";

type ParsedDependency = {
  predecessorTaskId: number | null;
  type: string | null;
  lag: string | null;
};

export type ParsedTask = {
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
  predecessors: ParsedDependency[];
  resourceNames: string[];
  notes: string | null;
};

export type ParsedProject = {
  projectName: string | null;
  startDate: string | null;
  finishDate: string | null;
  tasks: ParsedTask[];
};

function normalizeDependency(dependency: ParsedDependency) {
  return {
    predecessorTaskId: dependency.predecessorTaskId,
    type: dependency.type,
    lag: dependency.lag
  };
}

function normalizeTask(task: ParsedTask) {
  return {
    id: task.id,
    uniqueId: task.uniqueId,
    parentId: task.parentId,
    name: task.name,
    outlineLevel: task.outlineLevel,
    outlineNumber: task.outlineNumber,
    wbs: task.wbs,
    start: task.start,
    finish: task.finish,
    duration: task.duration,
    percentComplete: task.percentComplete,
    summary: task.summary,
    milestone: task.milestone,
    predecessors: task.predecessors.map(normalizeDependency),
    resourceNames: task.resourceNames,
    notes: task.notes
  };
}

export function normalizeParsedProject(parsed: ParsedProject, importedAt: string): Plan {
  return {
    id: `mpp-${importedAt}`,
    title: parsed.projectName ?? "Untitled MPP plan",
    sourceFormat: "mpp",
    importedAt,
    startDate: parsed.startDate,
    finishDate: parsed.finishDate,
    tasks: parsed.tasks.map(normalizeTask)
  };
}
