"use client";

import { CalendarDays, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  initial: "monday" | "sunday";
};

/**
 * Two-state pill toggle for the user's week-start preference. POSTs to
 * /api/account/preferences on click, then refreshes the route so any
 * server-rendered surfaces (the workspace's reporting-period picker)
 * pick up the new value.
 */
export function WeekStartDayToggle({ initial }: Props) {
  const router = useRouter();
  const [value, setValue] = useState<"monday" | "sunday">(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(next: "monday" | "sunday") {
    if (next === value || pending) return;
    setPending(true);
    setError(null);
    const previous = value;
    setValue(next);
    try {
      const response = await fetch("/api/account/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStartDay: next })
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Failed to save preference.");
      }
      router.refresh();
    } catch (caught) {
      setValue(previous);
      setError(caught instanceof Error ? caught.message : "Failed to save preference.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2 text-caption">
      <span className="inline-flex items-center gap-1.5 text-slate-300">
        <CalendarDays className="h-3.5 w-3.5" />
        Week starts
      </span>
      <div className="inline-flex overflow-hidden rounded-md border border-slate-700 bg-navy-800">
        {(["monday", "sunday"] as const).map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => update(option)}
              disabled={pending}
              className={`px-2.5 py-1 text-caption font-semibold transition disabled:opacity-60 ${
                active
                  ? "bg-cyan-700 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-cyan-300"
              }`}
            >
              {option === "monday" ? "Mon" : "Sun"}
            </button>
          );
        })}
      </div>
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" /> : null}
      {error ? <span className="text-caption text-red-400">{error}</span> : null}
    </div>
  );
}
