import { XMLParser } from "fast-xml-parser";
import type { ParsedProject, ParsedTask } from "./mpp";
import type { Plan } from "../types";

// ─── Raw shapes from fast-xml-parser output ──────────────────────────────────

type RawPredecessorLink = {
  PredecessorUID?: number;
  Type?: number;
  Lag?: string;
};

type RawTask = {
  UID?: number;
  ID?: number;
  Name?: string;
  OutlineLevel?: number;
  OutlineNumber?: string | number;
  WBS?: string | number;
  Start?: string;
  Finish?: string;
  Duration?: string;
  PercentComplete?: number;
  Summary?: number;
  Milestone?: number;
  PredecessorLink?: RawPredecessorLink[];
  Notes?: string;
};

type RawResource = {
  UID?: number;
  Name?: string;
};

type RawAssignment = {
  TaskUID?: number;
  ResourceUID?: number;
};

type RawProject = {
  Title?: string;
  Name?: string;
  StartDate?: string;
  FinishDate?: string;
  Tasks?: { Task?: RawTask[] };
  Resources?: { Resource?: RawResource[] };
  Assignments?: { Assignment?: RawAssignment[] };
};

// ─── Dependency type codes ────────────────────────────────────────────────────

const PREDECESSOR_TYPE_MAP: Record<number, string> = {
  0: "FF",
  1: "FS",
  2: "SF",
  3: "SS",
};

// ─── Value helpers ────────────────────────────────────────────────────────────

function toNum(value: unknown): number | null {
  if (typeof value === "number") return isNaN(value) ? null : value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return isNaN(n) ? null : n;
  }
  return null;
}

function toStr(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

/** Strip time component from MS Project datetime strings: "2024-01-15T08:00:00" → "2024-01-15". */
function toDateStr(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  const t = s.indexOf("T");
  return t > 0 ? s.slice(0, t) : s;
}

// ─── Lookup map builders ──────────────────────────────────────────────────────

/**
 * Builds a taskUID → resourceNames[] map by joining Resources + Assignments.
 * Skips UID=0 (the MS Project "unassigned" placeholder resource).
 */
function buildResourceMap(
  resources: RawResource[],
  assignments: RawAssignment[]
): Map<number, string[]> {
  const nameByUid = new Map<number, string>();
  for (const r of resources) {
    const uid = toNum(r.UID);
    const name = toStr(r.Name);
    if (uid != null && uid !== 0 && name) {
      nameByUid.set(uid, name);
    }
  }

  const taskResources = new Map<number, string[]>();
  for (const a of assignments) {
    const taskUid = toNum(a.TaskUID);
    const resourceUid = toNum(a.ResourceUID);
    if (taskUid == null || resourceUid == null || resourceUid === 0) continue;
    const name = nameByUid.get(resourceUid);
    if (!name) continue;
    const existing = taskResources.get(taskUid) ?? [];
    existing.push(name);
    taskResources.set(taskUid, existing);
  }

  return taskResources;
}

/**
 * Builds a UID → ID map so PredecessorLink UIDs can be resolved to the task
 * row numbers our system and the UI use.
 */
function buildUidToIdMap(tasks: RawTask[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const t of tasks) {
    const uid = toNum(t.UID);
    const id = toNum(t.ID);
    if (uid != null && id != null) map.set(uid, id);
  }
  return map;
}

/**
 * Reconstructs parentId for every task from outline levels and task order.
 * MS Project XML does not store parent IDs directly.
 *
 * Uses a stack: for each task, pop entries at the same or deeper outline level,
 * then the remaining top of the stack is the parent.
 */
function reconstructParentIds(
  tasks: Array<{ id: number; outlineLevel: number }>
): Map<number, number | null> {
  const parentMap = new Map<number, number | null>();
  const stack: Array<{ outlineLevel: number; id: number }> = [];

  for (const task of tasks) {
    while (stack.length > 0 && stack[stack.length - 1].outlineLevel >= task.outlineLevel) {
      stack.pop();
    }
    parentMap.set(task.id, stack.length > 0 ? stack[stack.length - 1].id : null);
    stack.push({ outlineLevel: task.outlineLevel, id: task.id });
  }

  return parentMap;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse an MS Project XML export into the ParsedProject intermediate shape.
 * Throws on malformed XML or missing <Project> root.
 *
 * Handles:
 * - UTF-8 BOM stripping
 * - Project summary task exclusion (UID=0 / ID=0)
 * - Parent ID reconstruction from outline levels
 * - Resource assignment join (Assignments table → task.resourceNames)
 * - Predecessor UID→ID resolution
 * - DateTime → date-only normalization ("2024-01-15T08:00:00" → "2024-01-15")
 */
export function parseMppXml(xmlText: string): ParsedProject {
  // Strip UTF-8 BOM if present (some MS Project exports include it)
  const text = xmlText.charCodeAt(0) === 0xfeff ? xmlText.slice(1) : xmlText;

  const parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: true,
    trimValues: true,
    // Force these to always be arrays so single-element cases parse correctly
    isArray: (tagName) =>
      tagName === "Task" ||
      tagName === "Resource" ||
      tagName === "Assignment" ||
      tagName === "PredecessorLink",
  });

  let parsed: { Project?: RawProject };
  try {
    parsed = parser.parse(text) as { Project?: RawProject };
  } catch (err) {
    throw new Error(
      `XML parse error: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const project = parsed.Project;
  if (!project) {
    throw new Error(
      "Not a valid MS Project XML file — missing <Project> root element. " +
        "Export via File → Save As → XML Format in MS Project."
    );
  }

  const rawTasks = project.Tasks?.Task ?? [];
  const rawResources = project.Resources?.Resource ?? [];
  const rawAssignments = project.Assignments?.Assignment ?? [];

  const resourceMap = buildResourceMap(rawResources, rawAssignments);
  const uidToId = buildUidToIdMap(rawTasks);

  // Exclude the project summary task (UID=0, ID=0) — it represents the
  // project itself, not a schedulable task.
  const workTasks = rawTasks.filter((t) => {
    const uid = toNum(t.UID);
    const id = toNum(t.ID);
    return uid !== 0 && id !== 0 && id != null;
  });

  const parentMap = reconstructParentIds(
    workTasks.map((t) => ({
      id: toNum(t.ID) ?? 0,
      outlineLevel: toNum(t.OutlineLevel) ?? 1,
    }))
  );

  const tasks: ParsedTask[] = workTasks.map((raw) => {
    const id = toNum(raw.ID) ?? 0;
    const uid = toNum(raw.UID);

    const predecessors = (raw.PredecessorLink ?? [])
      .map((link) => {
        const predUid = toNum(link.PredecessorUID);
        const predId = predUid != null ? (uidToId.get(predUid) ?? null) : null;
        const typeCode = toNum(link.Type);
        return {
          predecessorTaskId: predId,
          type: typeCode != null ? (PREDECESSOR_TYPE_MAP[typeCode] ?? "FS") : "FS",
          lag: toStr(link.Lag),
        };
      })
      .filter((p) => p.predecessorTaskId != null);

    return {
      id,
      uniqueId: uid,
      parentId: parentMap.get(id) ?? null,
      name: toStr(raw.Name) ?? "(unnamed task)",
      outlineLevel: toNum(raw.OutlineLevel) ?? 1,
      outlineNumber: toStr(raw.OutlineNumber),
      wbs: toStr(raw.WBS),
      start: toDateStr(raw.Start),
      finish: toDateStr(raw.Finish),
      duration: toStr(raw.Duration),
      percentComplete: toNum(raw.PercentComplete),
      summary: Number(raw.Summary) === 1,
      milestone: Number(raw.Milestone) === 1,
      predecessors,
      resourceNames: uid != null ? (resourceMap.get(uid) ?? []) : [],
      notes: toStr(raw.Notes),
    };
  });

  return {
    projectName: toStr(project.Title ?? project.Name),
    startDate: toDateStr(project.StartDate),
    finishDate: toDateStr(project.FinishDate),
    tasks,
  };
}

export function normalizeParsedXmlProject(parsed: ParsedProject, importedAt: string): Plan {
  return {
    id: `xml-${importedAt}`,
    title: parsed.projectName ?? "Untitled MS Project plan",
    sourceFormat: "xml",
    importedAt,
    startDate: parsed.startDate,
    finishDate: parsed.finishDate,
    tasks: parsed.tasks.map((task) => ({
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
      predecessors: task.predecessors,
      resourceNames: task.resourceNames,
      notes: task.notes,
    })),
  };
}
