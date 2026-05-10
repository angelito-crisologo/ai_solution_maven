"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  shareId: string;
  title: string;
};

type Status =
  | { kind: "idle" }
  | { kind: "confirm" }
  | { kind: "deleting" }
  | { kind: "error"; message: string };

/**
 * Inline delete button for /my-plans rows. First click flips the row into
 * a confirm state with a Cancel + Confirm pair. Confirm calls
 * DELETE /api/plansight/share?shareId=... and refreshes the page on
 * success. Plan deletion invalidates the share link, which is permanent —
 * we make that explicit in the confirm copy so users don't lose stake-
 * holder access by accident.
 */
export function DeletePlanButton({ shareId, title }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleConfirm() {
    setStatus({ kind: "deleting" });
    try {
      const response = await fetch(
        `/api/plansight/share?shareId=${encodeURIComponent(shareId)}`,
        { method: "DELETE" }
      );

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to delete plan.");
      }

      router.refresh();
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Failed to delete plan."
      });
    }
  }

  if (status.kind === "confirm" || status.kind === "deleting" || status.kind === "error") {
    const isDeleting = status.kind === "deleting";
    return (
      <div className="flex flex-col items-end gap-2">
        <p className="max-w-[320px] text-right text-caption text-slate-600">
          Delete <span className="font-mono text-caption text-slate-700">{title}</span>?
          This breaks its share link permanently.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => setStatus({ kind: "idle" })}
            className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-caption font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-red-600 px-3 text-caption font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            {isDeleting ? "Deleting..." : "Confirm delete"}
          </button>
        </div>
        {status.kind === "error" ? (
          <p className="text-caption text-red-700">{status.message}</p>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setStatus({ kind: "confirm" })}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-body font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
      title="Delete this plan"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Remove
    </button>
  );
}
