import type { Plan, PlanTask } from "./types";

// How many days before today the sample project is anchored to start.
// At load time the visitor is 28 days into the plan — phases 1-2 are
// complete, design is finishing up with several late tasks, and dev +
// content have just started. This produces a rich mid-flight AI analysis.
const SAMPLE_DAYS_AGO = 28;

function shiftDateStr(dateStr: string | null, offsetDays: number): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

/**
 * Shift every task start/finish (and the plan start/finish) so the
 * project began SAMPLE_DAYS_AGO days before today. The percent_complete
 * values baked into the seed already reflect where a real project would
 * stand at that point, so they are left unchanged.
 */
export function shiftSampleToCurrentDates(plan: Plan): Plan {
  const starts = plan.tasks
    .map((t) => t.start)
    .filter((d): d is string => !!d)
    .map((d) => new Date(d).getTime());

  if (!starts.length) return plan;

  const planStartMs = Math.min(...starts);
  const targetStartMs = Date.now() - SAMPLE_DAYS_AGO * 24 * 60 * 60 * 1000;
  const offsetDays = Math.round((targetStartMs - planStartMs) / (24 * 60 * 60 * 1000));

  const shiftedTasks: PlanTask[] = plan.tasks.map((t) => ({
    ...t,
    start: shiftDateStr(t.start, offsetDays),
    finish: shiftDateStr(t.finish, offsetDays)
  }));

  return {
    ...plan,
    startDate: shiftDateStr(plan.startDate, offsetDays),
    finishDate: shiftDateStr(plan.finishDate, offsetDays),
    tasks: shiftedTasks
  };
}
