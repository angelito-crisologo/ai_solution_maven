import type { Plan, PlanDependency, PlanTask } from "../../types";

/**
 * Deterministic LCG. Same seed → same sequence. Used so fixture-driven
 * tests don't flake.
 */
function makeRand(seed: number): () => number {
  let state = seed >>> 0;
  if (state === 0) state = 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const RESOURCE_POOL = [
  "Alice Smith",
  "Bob Chen",
  "Carol Diaz",
  "David Patel",
  "Eve Johnson",
  "Frank Lee",
  "Grace Kim",
  "Henry Singh",
  "Iris Brown",
  "Jack White",
  "Kate Green",
  "Leo Black"
] as const;

const ONE_DAY_MS = 86_400_000;

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export type FixtureOptions = {
  taskCount: number;
  seed?: number;
  /** Anchor "now" for relative date generation. Defaults to Date.now(). */
  nowMs?: number;
  /** When false, leaves have no predecessors (forces approximate mode). */
  withDependencies?: boolean;
};

/**
 * Generate a deterministic Plan fixture of approximately the requested
 * task count. Structure:
 *
 * - L1 summary tasks ("Phase N") parent groups of leaves.
 * - For larger plans, some L1 phases nest an L2 summary ("Workstream")
 *   to exercise the multi-level WBS structure section.
 * - Leaves get start/finish dates spread across plan timeline, with
 *   varying progress based on whether the task is past/active/future.
 * - Linear FS dependency chains within each L1 group → produces a long
 *   critical path with many zero-slack tasks.
 * - Every ~25th leaf is flagged as a milestone.
 * - Resources round-robin from the pool; some leaves carry 2.
 */
export function generateFixturePlan(opts: FixtureOptions): Plan {
  const taskCount = Math.max(10, opts.taskCount);
  const seed = opts.seed ?? 42;
  const withDependencies = opts.withDependencies ?? true;
  const rand = makeRand(seed);

  const nowMs = opts.nowMs ?? Date.now();
  const planStartMs = nowMs - 30 * ONE_DAY_MS;
  const planEndMs = nowMs + 335 * ONE_DAY_MS;

  // L1 phases: aim for one per ~150 leaves, clamped so structure section
  // has enough nodes to exceed its cap of 50 on large fixtures.
  const numL1 = Math.min(60, Math.max(3, Math.floor(taskCount / 100)));
  // Distribute the remaining task budget across L1 phases.
  const leavesBudget = taskCount - numL1;
  const baseLeavesPerL1 = Math.floor(leavesBudget / numL1);
  const remainder = leavesBudget % numL1;

  const tasks: PlanTask[] = [];

  // L1 summary tasks first.
  for (let i = 1; i <= numL1; i++) {
    tasks.push({
      id: i,
      uniqueId: i,
      parentId: null,
      name: `Phase ${i}`,
      outlineLevel: 1,
      outlineNumber: `${i}`,
      wbs: `${i}`,
      start: null,
      finish: null,
      duration: null,
      percentComplete: null,
      summary: true,
      milestone: false,
      predecessors: [],
      resourceNames: [],
      notes: null
    });
  }

  let nextId = numL1 + 1;
  const phaseSpanMs = (planEndMs - planStartMs) / numL1;

  for (let phaseIdx = 0; phaseIdx < numL1; phaseIdx++) {
    const l1Id = phaseIdx + 1;
    const phaseStartMs = planStartMs + phaseIdx * phaseSpanMs;
    const numLeavesForPhase = baseLeavesPerL1 + (phaseIdx < remainder ? 1 : 0);

    // For phases with at least 6 leaves, carve out an L2 sub-summary
    // owning the first ~half. Produces a 3-level WBS for the structure section.
    const useL2 = numLeavesForPhase >= 6 && rand() < 0.7;
    const l2LeafCount = useL2 ? Math.floor(numLeavesForPhase / 2) : 0;
    let l2Id: number | null = null;
    if (useL2) {
      l2Id = nextId++;
      tasks.push({
        id: l2Id,
        uniqueId: l2Id,
        parentId: l1Id,
        name: `Workstream ${l1Id}.A`,
        outlineLevel: 2,
        outlineNumber: `${l1Id}.1`,
        wbs: `${l1Id}.1`,
        start: null,
        finish: null,
        duration: null,
        percentComplete: null,
        summary: true,
        milestone: false,
        predecessors: [],
        resourceNames: [],
        notes: null
      });
    }

    let previousLeafId: number | null = null;

    for (let j = 0; j < numLeavesForPhase; j++) {
      if (tasks.length >= taskCount) break;

      const taskId = nextId++;
      const parentId = useL2 && j < l2LeafCount ? (l2Id as number) : l1Id;
      const level = parentId === l1Id ? 2 : 3;
      const outlinePrefix = parentId === l1Id ? `${l1Id}` : `${l1Id}.1`;

      // Date placement within phase span, with a small jitter
      const jitter = (rand() - 0.5) * ONE_DAY_MS * 4;
      const taskStartMs = Math.round(
        phaseStartMs + (j / Math.max(numLeavesForPhase, 1)) * phaseSpanMs + jitter
      );
      const durationDays = 1 + Math.floor(rand() * 9);
      const taskFinishMs = taskStartMs + durationDays * ONE_DAY_MS;

      // Milestones: every ~25th leaf. Duration 0, no start date.
      const isMilestone = taskId % 25 === 0;

      // Progress: drift toward "completed" for past tasks, "in progress"
      // for current, "not started" for future. With some noise so we get
      // late-but-incomplete and lagging tasks naturally.
      let percentComplete: number | null;
      if (isMilestone) {
        percentComplete = taskFinishMs < nowMs ? (rand() < 0.7 ? 100 : 0) : 0;
      } else if (taskFinishMs < nowMs) {
        percentComplete = rand() < 0.75 ? 100 : Math.floor(rand() * 95);
      } else if (taskStartMs < nowMs) {
        percentComplete = 5 + Math.floor(rand() * 90);
      } else {
        percentComplete = 0;
      }

      const predecessors: PlanDependency[] = [];
      if (withDependencies && previousLeafId != null) {
        predecessors.push({
          predecessorTaskId: previousLeafId,
          type: "FS",
          lag: null
        });
        // Every 7th leaf also depends on the leaf one before that, to
        // create some bottlenecks (tasks with 2+ successors).
        if (j > 1 && j % 7 === 0) {
          predecessors.push({
            predecessorTaskId: previousLeafId - 1,
            type: "FS",
            lag: null
          });
        }
      }

      const resourceNames: string[] = [];
      const primary = RESOURCE_POOL[(taskId + phaseIdx) % RESOURCE_POOL.length];
      resourceNames.push(primary);
      if (rand() < 0.3) {
        const secondary =
          RESOURCE_POOL[(taskId * 3 + phaseIdx) % RESOURCE_POOL.length];
        if (secondary !== primary) resourceNames.push(secondary);
      }

      tasks.push({
        id: taskId,
        uniqueId: taskId,
        parentId,
        name: `${outlinePrefix}.${j + 1} ${isMilestone ? "Milestone" : "Task"} ${taskId}`,
        outlineLevel: level,
        outlineNumber: `${outlinePrefix}.${j + 1}`,
        wbs: `${outlinePrefix}.${j + 1}`,
        start: isMilestone ? null : isoDate(taskStartMs),
        finish: isoDate(taskFinishMs),
        duration: isMilestone ? "0d" : `${durationDays}d`,
        percentComplete,
        summary: false,
        milestone: isMilestone,
        predecessors,
        resourceNames,
        notes: null
      });

      previousLeafId = taskId;
    }
  }

  return {
    id: `fixture-${seed}-${taskCount}`,
    title: `Fixture Plan (${taskCount} tasks, seed ${seed})`,
    sourceFormat: "mpp",
    importedAt: new Date(nowMs).toISOString(),
    startDate: isoDate(planStartMs),
    finishDate: isoDate(planEndMs),
    tasks
  };
}
