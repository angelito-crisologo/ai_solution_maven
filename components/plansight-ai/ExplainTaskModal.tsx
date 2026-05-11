"use client";

import { Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  shareId: string;
  taskId: number;
  taskName: string;
  onClose: () => void;
};

type Status =
  | { kind: "loading" }
  | { kind: "loaded"; explanation: string }
  | { kind: "error"; message: string };

/**
 * Modal that calls /api/plansight/explain-task when mounted and renders
 * the AI explanation. Pro-only on the server side; anything that opens
 * this should already gate on `canExplainTask`. Empty cache deliberate —
 * explanations are ~$0.005 per call and a stale one is worse than fresh.
 */
export function ExplainTaskModal({ shareId, taskId, taskName, onClose }: Props) {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/plansight/explain-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shareId, taskId })
        });
        const payload = (await response.json().catch(() => ({}))) as {
          explanation?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!response.ok || !payload.explanation) {
          setStatus({
            kind: "error",
            message: payload.error || "Failed to explain task."
          });
          return;
        }
        setStatus({ kind: "loaded", explanation: payload.explanation });
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

        <div className="mt-5 min-h-[6rem] rounded-md border border-slate-200 bg-slate-50 p-4">
          {status.kind === "loading" ? (
            <div className="flex items-center gap-2 text-body text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating explanation...
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
