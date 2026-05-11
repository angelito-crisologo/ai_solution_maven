import { buildInsightsReport, summarizePlan } from "./analysis";
import {
  currentWeek,
  daysBetweenUploadAndPeriodEnd,
  type ReportingPeriod
} from "./reporting-period";
import type { WeekStartDay } from "@/lib/auth/preferences";
import type { Plan, PlanTask } from "./types";

export type ReportTask = {
  id: number;
  name: string;
  finish: string | null;
  percentComplete: number | null;
  /** Auxiliary single-line caption rendered under the task name. PM-side
   * commentary first (task.notes), falling back to derived status. */
  caption: string | null;
};

export type SlippedTask = ReportTask & {
  /** Days late as of the reporting-period end. Used for the "+N days"
   * badge in the slipped row. */
  daysLate: number;
};

export type AtRiskRow = ReportTask & {
  /** Short trailing badge — "Nd float", "on CP", etc. */
  badge: string | null;
};

export type ReportMilestone = ReportTask & {
  /** Hit = milestone completed within or before the period end. Miss =
   * scheduled within the period but still incomplete. */
  hit: boolean;
};

export type ReportCounts = {
  total: number;
  completed: number;
  completePct: number;
  inProgress: number;
  notStarted: number;
  atRisk: number;
  late: number;
  slipped: number;
};

export type NextMilestone = {
  id: number;
  name: string;
  daysUntil: number;
  finish: string | null;
};

export type WeeklyReportData = {
  plan: Plan;
  weekStartDay: WeekStartDay;
  /** The week the report is *about* — last completed week by default,
   * or an explicit override. */
  reportingPeriod: ReportingPeriod;
  /** The week the PM is currently in — drives "Milestones coming up". */
  currentPeriod: ReportingPeriod;
  /** Project health derived from current plan state. */
  health: "green" | "amber" | "red";
  /** One-line caption next to the RAG pill — short context for the
   * stakeholder ("3 tasks late, 7 at risk", "On track", etc.). */
  healthCaption: string;
  /** Aggregate counts driving the stat-card row. */
  counts: ReportCounts;
  /** Earliest upcoming milestone with a day-delta from today. Null when
   * no milestones remain in the plan. */
  nextMilestone: NextMilestone | null;
  /** Tasks scheduled to finish during the reporting period but not yet
   * complete — "what slipped this week." */
  slippedTasks: SlippedTask[];
  /** Tasks currently flagged at risk by the deterministic engine. */
  atRiskTasks: AtRiskRow[];
  /** Milestones whose finish falls inside the reporting period, with hit/miss. */
  milestonesInPeriod: ReportMilestone[];
  /** Milestones falling within the *current* week. */
  milestonesUpcoming: ReportTask[];
  /** Plan staleness: > 7 days between import and reporting-period end. */
  staleness: {
    isStale: boolean;
    daysOld: number;
  };
};

function isWithin(value: string | null, period: ReportingPeriod): boolean {
  if (!value) return false;
  const t = Date.parse(value);
  return Number.isFinite(t) && t >= period.start.getTime() && t <= period.end.getTime();
}

function deriveCaption(task: PlanTask): string | null {
  if (task.notes && task.notes.trim().length > 0) {
    return task.notes.trim().slice(0, 120);
  }
  const pct = task.percentComplete ?? 0;
  if (pct === 0) return "Not started";
  if (pct >= 100) return "Complete";
  return `${Math.round(pct)}% complete`;
}

function toReportTask(task: PlanTask): ReportTask {
  return {
    id: task.id,
    name: task.name,
    finish: task.finish,
    percentComplete: task.percentComplete,
    caption: deriveCaption(task)
  };
}

function toMilestone(task: PlanTask, period: ReportingPeriod): ReportMilestone {
  const finishTime = task.finish ? Date.parse(task.finish) : NaN;
  const completedPct = task.percentComplete ?? 0;
  // "Hit" requires both: scheduled within period (or before) AND complete.
  // "Miss" = scheduled within period but not yet complete.
  const hit = completedPct >= 100 && Number.isFinite(finishTime) && finishTime <= period.end.getTime();
  return { ...toReportTask(task), hit };
}

function buildHealthCaption(
  health: "green" | "amber" | "red",
  lateCount: number,
  atRiskCount: number,
  slippedCount: number
): string {
  if (health === "green") return "On track";
  if (health === "red") {
    if (lateCount > 0 && atRiskCount > 0) {
      return `${lateCount} late · ${atRiskCount} at risk`;
    }
    if (lateCount > 0) return `${lateCount} task${lateCount === 1 ? "" : "s"} late`;
    return `${atRiskCount} at risk`;
  }
  // amber
  if (slippedCount > 0 && atRiskCount > 0) {
    return `${slippedCount} slipped · ${atRiskCount} at risk`;
  }
  if (atRiskCount > 0) return `${atRiskCount} at risk`;
  if (slippedCount > 0) return `${slippedCount} slipped this period`;
  return "Watch this week";
}

function daysBetween(later: Date, earlier: Date): number {
  return Math.max(0, Math.round((later.getTime() - earlier.getTime()) / 86400000));
}

/**
 * Build the structured data the PDF + AI prompt both consume. Keeps the
 * date-range, slip detection, and milestone logic in one place so the
 * two surfaces never drift.
 */
export function buildWeeklyReportData(
  plan: Plan,
  reportingPeriod: ReportingPeriod,
  weekStartDay: WeekStartDay,
  today: Date
): WeeklyReportData {
  const metrics = summarizePlan(plan);
  const insights = buildInsightsReport(plan, reportingPeriod.end);

  const slippedTasks: SlippedTask[] = plan.tasks
    .filter((task) => {
      if (task.summary) return false;
      if (!isWithin(task.finish, reportingPeriod)) return false;
      const pct = task.percentComplete ?? 0;
      return pct < 100;
    })
    .slice(0, 8)
    .map((task) => {
      const base = toReportTask(task);
      const finishTime = task.finish ? Date.parse(task.finish) : NaN;
      const daysLate = Number.isFinite(finishTime)
        ? Math.max(1, daysBetween(reportingPeriod.end, new Date(finishTime)))
        : 1;
      return { ...base, daysLate };
    });

  const milestonesInPeriod: ReportMilestone[] = plan.tasks
    .filter((task) => task.milestone && isWithin(task.finish, reportingPeriod))
    .sort((a, b) => {
      const ta = a.finish ? Date.parse(a.finish) : Infinity;
      const tb = b.finish ? Date.parse(b.finish) : Infinity;
      return ta - tb;
    })
    .slice(0, 8)
    .map((task) => toMilestone(task, reportingPeriod));

  const upcoming = currentWeek(today, weekStartDay);
  const milestonesUpcoming: ReportTask[] = plan.tasks
    .filter((task) => task.milestone && isWithin(task.finish, upcoming))
    // De-dupe — a milestone in the just-completed week shouldn't double-render.
    .filter((task) => !milestonesInPeriod.some((m) => m.id === task.id))
    .sort((a, b) => {
      const ta = a.finish ? Date.parse(a.finish) : Infinity;
      const tb = b.finish ? Date.parse(b.finish) : Infinity;
      return ta - tb;
    })
    .slice(0, 8)
    .map(toReportTask);

  const atRiskTasks: AtRiskRow[] = insights.insights.atRiskTasks
    .slice(0, 8)
    .map((task) => {
      const pct = task.progress ?? 0;
      const caption =
        pct === 0
          ? "Not started"
          : pct >= 100
            ? "Complete"
            : `${Math.round(pct)}% complete`;
      const badge =
        typeof task.daysRemaining === "number" && task.daysRemaining >= 0
          ? `${task.daysRemaining}d float`
          : null;
      return {
        id: task.id,
        name: task.name,
        finish: task.finish,
        percentComplete: pct,
        caption,
        badge
      };
    });

  const lateCount = insights.insights.lateTasks.length;
  const atRiskCount = insights.insights.atRiskTasks.length;
  const completePct =
    metrics.totalTasks > 0
      ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100)
      : 0;

  // Earliest milestone >= today across the whole plan (not just the
  // upcoming week) for the "Next milestone" stat card countdown.
  const nextMilestoneCandidate = [...plan.tasks]
    .filter(
      (task) =>
        task.milestone &&
        task.finish &&
        Date.parse(task.finish) >= today.getTime()
    )
    .sort((a, b) => {
      const ta = a.finish ? Date.parse(a.finish) : Infinity;
      const tb = b.finish ? Date.parse(b.finish) : Infinity;
      return ta - tb;
    })[0];

  const nextMilestone: NextMilestone | null = nextMilestoneCandidate
    ? {
        id: nextMilestoneCandidate.id,
        name: nextMilestoneCandidate.name,
        finish: nextMilestoneCandidate.finish,
        daysUntil: nextMilestoneCandidate.finish
          ? daysBetween(new Date(nextMilestoneCandidate.finish), today)
          : 0
      }
    : null;

  const daysOld = daysBetweenUploadAndPeriodEnd(plan.importedAt, reportingPeriod);
  const isStale = daysOld > 7;

  return {
    plan,
    weekStartDay,
    reportingPeriod,
    currentPeriod: upcoming,
    health: insights.summary.healthStatus,
    healthCaption: buildHealthCaption(
      insights.summary.healthStatus,
      lateCount,
      atRiskCount,
      slippedTasks.length
    ),
    counts: {
      total: metrics.totalTasks,
      completed: metrics.completedTasks,
      completePct,
      inProgress: metrics.inProgressTasks,
      notStarted: metrics.notStartedTasks,
      atRisk: atRiskCount,
      late: lateCount,
      slipped: slippedTasks.length
    },
    nextMilestone,
    slippedTasks,
    atRiskTasks,
    milestonesInPeriod,
    milestonesUpcoming,
    staleness: { isStale, daysOld }
  };
}
