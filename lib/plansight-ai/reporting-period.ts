/**
 * Week-boundary math for the Weekly Status Report.
 *
 * The report defaults to the LAST COMPLETED week ending immediately before
 * "today". Two preferences exist for what a week is:
 *   - 'monday' (default): Monday–Sunday (ISO 8601)
 *   - 'sunday': Sunday–Saturday (some US/regional conventions)
 *
 * Edge-case rule from the spec: when run on the LAST day of the week
 * (i.e. the day the week ends), treat the week ending today as the
 * just-completed week, NOT the prior one. This matches the PM's mental
 * model — "last week" means "the week that just ended this morning"
 * when they sit down Sunday morning to write status.
 */

export type WeekStartDay = "monday" | "sunday";

export type ReportingPeriod = {
  /** Inclusive start of the period (midnight local). */
  start: Date;
  /** Inclusive end of the period (23:59:59.999 local). */
  end: Date;
  /** Convenience: start of the next day after end (useful for [start, exclusiveEnd) range queries). */
  exclusiveEnd: Date;
};

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

/**
 * Returns the start of the *current* week that contains `date`, based on
 * the user's week-start preference. The result is at midnight local.
 */
export function startOfWeek(date: Date, weekStartDay: WeekStartDay): Date {
  const dow = date.getDay(); // 0=Sun..6=Sat
  const targetDow = weekStartDay === "monday" ? 1 : 0;
  // Distance back to the target day-of-week.
  let backDays = dow - targetDow;
  if (backDays < 0) backDays += 7;
  return startOfDay(addDays(date, -backDays));
}

/**
 * Returns the last completed week's boundaries given a "today" reference.
 *
 * - On the last day of the week (Sunday for Mon-start, Saturday for Sun-
 *   start), treat that week as just-completed (week ends today).
 * - On any other day, return the prior full week.
 */
export function resolveReportingPeriod(
  today: Date,
  weekStartDay: WeekStartDay
): ReportingPeriod {
  const dow = today.getDay();
  const lastDow = weekStartDay === "monday" ? 0 : 6; // Sunday or Saturday

  if (dow === lastDow) {
    // The week ending today is the just-completed week.
    const start = startOfWeek(today, weekStartDay);
    const end = endOfDay(today);
    return {
      start,
      end,
      exclusiveEnd: addDays(startOfDay(today), 1)
    };
  }

  // Otherwise back up to the start of the current week, then take the
  // 7 days immediately before that.
  const currentWeekStart = startOfWeek(today, weekStartDay);
  const start = addDays(currentWeekStart, -7);
  const end = endOfDay(addDays(start, 6));
  return {
    start,
    end,
    exclusiveEnd: addDays(startOfDay(end), 1)
  };
}

/**
 * Returns the boundaries of the CURRENT week containing `today` (i.e.
 * Mon..today's-week-end or Sun..today's-week-end). Used for the
 * "Milestones coming up" section.
 */
export function currentWeek(
  today: Date,
  weekStartDay: WeekStartDay
): ReportingPeriod {
  const start = startOfWeek(today, weekStartDay);
  const end = endOfDay(addDays(start, 6));
  return {
    start,
    end,
    exclusiveEnd: addDays(startOfDay(end), 1)
  };
}

/**
 * Validates and snaps an arbitrary [start, end] override to the
 * appropriate week boundary. Returns null if the override is missing or
 * invalid; callers should fall back to resolveReportingPeriod in that
 * case.
 *
 * "Valid" means: start is the configured week-start day-of-week, and
 * end is start + 6 days. We allow callers to send either Date or ISO
 * string. The override is treated as describing a period in the user's
 * local time.
 */
export function snapOverrideToWeek(
  override: { start?: string | Date; end?: string | Date } | null | undefined,
  weekStartDay: WeekStartDay
): ReportingPeriod | null {
  if (!override?.start) return null;
  const raw = override.start instanceof Date ? override.start : new Date(override.start);
  if (Number.isNaN(raw.getTime())) return null;

  const start = startOfWeek(raw, weekStartDay);
  const end = endOfDay(addDays(start, 6));
  return {
    start,
    end,
    exclusiveEnd: addDays(startOfDay(end), 1)
  };
}

/**
 * Format a reporting period as "28 Apr – 4 May 2026" for headers and
 * the UI badge. Falls back to ISO format on bad inputs.
 */
export function formatPeriodLabel(period: ReportingPeriod): string {
  const start = period.start;
  const end = period.end;

  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const sameYear = start.getFullYear() === end.getFullYear();

  const dayMonthShort = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short"
  });
  const dayMonthYearShort = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  if (sameMonth) {
    // 28 – 30 Apr 2026
    const startPart = start.getDate();
    return `${startPart} – ${dayMonthYearShort.format(end)}`;
  }
  if (sameYear) {
    // 28 Apr – 4 May 2026
    return `${dayMonthShort.format(start)} – ${dayMonthYearShort.format(end)}`;
  }
  return `${dayMonthYearShort.format(start)} – ${dayMonthYearShort.format(end)}`;
}

/**
 * Days between an upload timestamp and the reporting-period end. Used to
 * decide whether to surface the staleness banner (≥ 8 days = stale).
 */
export function daysBetweenUploadAndPeriodEnd(
  importedAt: string,
  period: ReportingPeriod
): number {
  const uploaded = new Date(importedAt);
  if (Number.isNaN(uploaded.getTime())) return 0;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((period.end.getTime() - uploaded.getTime()) / msPerDay));
}
