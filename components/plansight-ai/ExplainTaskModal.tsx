"use client";

import { Loader2, Sparkles, TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  shareId: string;
  taskId: number;
  taskName: string;
  onClose: () => void;
};

type Status =
  | { kind: "loading" }
  | { kind: "loaded"; explanation: string; softCapShown: boolean }
  | { kind: "rate_limited"; message: string }
  | { kind: "error"; message: string };

/** localStorage key recording the date on which the user dismissed the
 * soft-cap nudge. We include the date so dismissal resets at UTC midnight,
 * matching the server-side rate-limit reset window. */
const SOFT_CAP_DISMISS_KEY = "plansight:explain-task:soft-cap-dismissed";

function todayUtcKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readDismissedToday(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SOFT_CAP_DISMISS_KEY) === todayUtcKey();
  } catch {
    return false;
  }
}

function markDismissedToday() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SOFT_CAP_DISMISS_KEY, todayUtcKey());
  } catch {
    // Ignore — telemetry is best-effort.
  }
}

/**
 * Modal that calls /api/plansight/explain-task when mounted and renders
 * the AI explanation. Pro-only on the server side; anything that opens
 * this should already gate on `canExplainTask`.
 *
 * Phase 9 — handles three response shapes from the route:
 *   - 200 with explanation + softCapShown=true: render the answer with a
 *     dismissable "you've explained a lot today" banner.
 *   - 200 with explanation: render the answer directly.
 *   - 429 with rateLimited=true: render the friendly hard-cap message
 *     (the route already includes the contact line).
 */
export function ExplainTaskModal({ shareId, taskId, taskName, onClose }: Props) {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/plansight/explain-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shareId,
            taskId,
            softCapDismissed: readDismissedToday()
          })
        });
        const payload = (await response.json().catch(() => ({}))) as {
          explanation?: string;
          error?: string;
          softCapShown?: boolean;
          rateLimited?: boolean;
        };
        if (cancelled) return;

        if (response.status === 429 || payload.rateLimited) {
          setStatus({
            kind: "rate_limited",
            message: payload.error || "You've hit today's limit."
          });
          return;
        }

        if (!response.ok || !payload.explanation) {
          setStatus({
            kind: "error",
            message: payload.error || "Failed to explain task."
          });
          return;
        }

        const softCapShown =
          payload.softCapShown === true && !readDismissedToday();
        setBannerVisible(softCapShown);
        setStatus({
          kind: "loaded",
          explanation: payload.explanation,
          softCapShown
        });
      } catch (error) {
        if (cancelled) return;
        setStatus({
          kind: "error",
          message: error instanceof Error ? error.message : "Failed to explain task."
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shareId, taskId]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="explain-task-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 px-4"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-modal"
      >
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-micro text-cyan-700">Explain task</p>
            <h3 id="explain-task-title" className="mt-1 truncate text-h3 text-ink">
              {taskName}
            </h3>
            <p className="mt-1 text-caption text-slate-500">
              Task <span className="font-mono">{taskId}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {status.kind === "loaded" && status.softCapShown && bannerVisible ? (
          <div className="mt-4 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-body text-amber-900">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">You&apos;ve explained a lot today.</p>
              <p className="mt-1 text-amber-800">
                You can keep going — this is just a check-in. You&apos;ll hit a
                daily ceiling further on.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                markDismissedToday();
                setBannerVisible(false);
              }}
              className="inline-flex h-8 items-center rounded-md border border-amber-300 bg-white px-3 text-caption font-semibold text-amber-900 transition hover:border-amber-400 hover:bg-amber-100"
            >
              Got it
            </button>
          </div>
        ) : null}

        <div className="mt-5 min-h-[6rem] rounded-md border border-slate-200 bg-slate-50 p-4">
          {status.kind === "loading" ? (
            <div className="flex items-center gap-2 text-body text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating explanation...
            </div>
          ) : status.kind === "rate_limited" ? (
            <div className="flex items-start gap-2 text-body text-amber-900">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <p>{status.message}</p>
            </div>
          ) : status.kind === "error" ? (
            <p className="text-body text-red-700">{status.message}</p>
          ) : (
            <p className="whitespace-pre-line text-body text-slate-800">
              {status.explanation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
