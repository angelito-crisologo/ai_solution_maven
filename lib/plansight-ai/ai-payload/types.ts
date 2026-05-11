/**
 * AI payload contract — the fixed-shape, size-bounded summary sent to
 * Claude in the v2 analysis flow. See AI_PAYLOAD_IMPLEMENTATION_BRIEF.md.
 *
 * The whole point of this module is that the payload size is roughly
 * constant regardless of plan size — a 100-task plan and a 25,000-task
 * plan produce payloads in the same 3k-10k token range. Cost and latency
 * stay flat.
 *
 * Caps below are HARD limits enforced by buildAIPayload(). Sort orders
 * are chosen so the cap removes the *least interesting* items first.
 */

export const PAYLOAD_CAPS = {
  criticalTasks: 20,
  lateTasks: 20,
  atRiskTasks: 20,
  milestones: 15,
  bottlenecks: 10,
  upcoming: 30,
  structure: 50,
  resources: 10,
  /** Per-task: only the first N predecessors are included. */
  predecessorIdsPerTask: 5
} as const;

/** Window used for the "upcoming work" section. */
export const UPCOMING_WINDOW_DAYS = 30;

export type AIPayloadTaskFlags = {
  critical: boolean;
  late: boolean;
  atRisk: boolean;
  milestone: boolean;
  bottleneck: boolean;
};

export type AIPayloadTask = {
  id: number;
  name: string;
  start: string | null;
  finish: string | null;
  durationDays: number;
  /** 0-100. Null if the plan didn't carry a value. */
  percentComplete: number | null;
  flags: AIPayloadTaskFlags;
  /** Capped at PAYLOAD_CAPS.predecessorIdsPerTask. */
  predecessorIds: number[];
};

/** A node from the WBS hierarchy, levels 1-3 only. Summary tasks, not leaves. */
export type AIPayloadStructureNode = {
  id: number;
  outlineNumber: string | null;
  level: number;
  name: string;
  /** Number of leaf tasks under this summary in the plan. */
  leafTaskCount: number;
};

export type AIPayloadResource = {
  name: string;
  /** Number of tasks this resource is assigned to. */
  taskCount: number;
  /**
   * True when the resource is assigned to 2+ tasks that are currently in
   * progress (i.e., today falls between start and finish and the task is
   * not 100% complete). Rough proxy for "this person is stretched."
   */
  overallocated: boolean;
};

export type AIPayloadMeta = {
  title: string;
  startDate: string | null;
  finishDate: string | null;
  totalTasks: number;
  /** 0-100. Null if no task carried a percent complete. */
  percentComplete: number | null;
  ragStatus: "green" | "amber" | "red";
  /**
   * Sum of durationDays along the longest critical path. Null in
   * approximate mode (no dependencies) since there's no zero-slack path.
   */
  criticalPathDurationDays: number | null;
  /** "cpm" when dependencies are present, "approximate" otherwise. */
  mode: "cpm" | "approximate";
};

export type AIPayloadHealth = {
  lateCount: number;
  atRiskCount: number;
  criticalCount: number;
  laggingCount: number;
  bottleneckCount: number;
  /** One-line summary like "5 late, 12 at-risk, 3 bottlenecks". */
  riskSummary: string;
};

export type AIPayload = {
  meta: AIPayloadMeta;
  health: AIPayloadHealth;
  criticalTasks: AIPayloadTask[];
  lateTasks: AIPayloadTask[];
  atRiskTasks: AIPayloadTask[];
  milestones: AIPayloadTask[];
  bottlenecks: AIPayloadTask[];
  upcoming: AIPayloadTask[];
  structure: AIPayloadStructureNode[];
  resources: AIPayloadResource[];
  /**
   * Every distinct task ID referenced as a predecessor across the
   * included tasks — even predecessors that were themselves trimmed
   * from the payload. Lets Claude reference task IDs by number + count
   * (e.g., "Task 47 blocks 3 downstream") without us needing to
   * pre-include every blocked task.
   */
  referencedTaskIds: number[];
};

export type BuildAIPayloadOptions = {
  /** Anchor "today" for at-risk / upcoming / late math. Defaults to new Date(). */
  now?: Date;
};
