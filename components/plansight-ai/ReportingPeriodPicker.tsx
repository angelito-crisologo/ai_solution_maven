"use client";

import { CalendarRange, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  currentWeek,
  formatPeriodLabel,
  resolveReportingPeriod,
  snapOverrideToWeek,
  type WeekStartDay
} from "@/lib/plansight-ai/reporting-period";

type Props = {
  weekStartDay: WeekStartDay;
  /** Override (ISO YYYY-MM-DD) chosen by the user, or null for default. */
  overrideStart: string | null;
  onChange: (overrideStart: string | null) => void;
};

function toIsoDate(date: Date): string {
  // YYYY-MM-DD in local time.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Renders the "Reporting on: <date range>" badge next to the Weekly
 * Report button, with a [Change] action that opens a dropdown listing
 * the last N completed weeks the user can choose from. Defaults to the
 * last completed week and is the source of truth for the workspace
 * override; the server still authoritatively snaps the input to the
 * user's week-start preference.
 */
export function ReportingPeriodPicker({ weekStartDay, overrideStart, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const today = useMemo(() => new Date(), []);

  const resolvedPeriod = useMemo(() => {
    const override = overrideStart
      ? snapOverrideToWeek({ start: overrideStart }, weekStartDay)
      : null;
    return override ?? resolveReportingPeriod(today, weekStartDay);
  }, [overrideStart, weekStartDay, today]);

  // Show the last 12 completed weeks plus the just-completed one as
  // selectable options.
  const choices = useMemo(() => {
    const defaultPeriod = resolveReportingPeriod(today, weekStartDay);
    const out: { value: string; label: string }[] = [];
    for (let i = 0; i < 12; i += 1) {
      const weekStart = new Date(defaultPeriod.start);
      weekStart.setDate(defaultPeriod.start.getDate() - i * 7);
      const period = snapOverrideToWeek({ start: weekStart }, weekStartDay);
      if (!period) continue;
      out.push({
        value: toIsoDate(period.start),
        label: formatPeriodLabel(period)
      });
    }
    return out;
  }, [today, weekStartDay]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function handleClick() {
      setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("click", handleClick);
    };
  }, [open]);

  const isDefault = overrideStart === null;
  const currentLabel = formatPeriodLabel(resolvedPeriod);
  const upcomingLabel = formatPeriodLabel(currentWeek(today, weekStartDay));

  return (
    <div className="relative inline-flex items-center gap-2 text-caption">
      <span className="inline-flex items-center gap-1.5 text-slate-500">
        <CalendarRange className="h-3.5 w-3.5" />
        Reporting on
      </span>
      <span className="font-mono text-caption text-slate-700">{currentLabel}</span>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className="inline-flex h-6 items-center gap-1 rounded border border-slate-200 bg-white px-2 text-caption font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-50"
        title={`Coming up next week: ${upcomingLabel}`}
      >
        Change
        <ChevronDown className="h-3 w-3" />
      </button>

      {open ? (
        <div
          onClick={(event) => event.stopPropagation()}
          className="absolute left-0 top-full z-40 mt-1 w-72 overflow-hidden rounded-md border border-slate-200 bg-white shadow-card"
        >
          <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-micro tracking-wider text-slate-500">
            Pick a {weekStartDay === "monday" ? "Mon–Sun" : "Sun–Sat"} week
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {choices.map((choice, index) => {
              const isSelected =
                (overrideStart && overrideStart === choice.value) ||
                (isDefault && index === 0);
              return (
                <li key={choice.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(index === 0 ? null : choice.value);
                      setOpen(false);
                    }}
                    className={`block w-full px-3 py-1.5 text-left text-caption transition hover:bg-cyan-50 ${
                      isSelected ? "bg-cyan-50 text-cyan-800" : "text-slate-700"
                    }`}
                  >
                    {choice.label}
                    {index === 0 ? (
                      <span className="ml-2 text-micro uppercase tracking-wider text-slate-500">
                        Last completed
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
