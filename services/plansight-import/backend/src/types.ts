export type ParsedDependency = {
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
