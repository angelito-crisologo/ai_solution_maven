import { Bug, Lightbulb, MessageSquare } from "lucide-react";
import type { FeedbackRow } from "@/lib/feedback/queries";

const typeLabel: Record<FeedbackRow["feedback_type"], string> = {
  general_feedback: "Feedback",
  feature_request: "Feature",
  bug_report: "Bug"
};

const typeBadge: Record<FeedbackRow["feedback_type"], string> = {
  general_feedback: "bg-slate-100 text-slate-700",
  feature_request: "bg-emerald-100 text-emerald-800",
  bug_report: "bg-rose-100 text-rose-800"
};

const severityBadge: Record<
  NonNullable<FeedbackRow["severity"]>,
  string
> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800"
};

function TypeIcon({ kind }: { kind: FeedbackRow["feedback_type"] }) {
  if (kind === "bug_report") return <Bug className="h-3.5 w-3.5" />;
  if (kind === "feature_request") return <Lightbulb className="h-3.5 w-3.5" />;
  return <MessageSquare className="h-3.5 w-3.5" />;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

type Props = {
  rows: FeedbackRow[];
  emptyMessage: string;
};

export function FeedbackTable({ rows, emptyMessage }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 p-6 text-center text-body text-slate-600">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <article
          key={row.id}
          className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
        >
          <header className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-micro font-semibold ${typeBadge[row.feedback_type]}`}
            >
              <TypeIcon kind={row.feedback_type} />
              {typeLabel[row.feedback_type]}
            </span>
            {row.severity ? (
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-micro font-semibold uppercase ${severityBadge[row.severity]}`}
              >
                {row.severity}
              </span>
            ) : null}
            <span className="ml-auto text-micro text-slate-500">
              {formatTimestamp(row.created_at)}
            </span>
          </header>

          <h3 className="mt-2 text-body font-semibold text-ink">{row.subject}</h3>
          <p className="mt-1 whitespace-pre-wrap text-body text-slate-700">
            {row.message}
          </p>

          {row.feedback_type === "bug_report" &&
          (row.steps_to_reproduce || row.desired_outcome) ? (
            <div className="mt-3 grid gap-3 rounded-md bg-slate-50 p-3 text-caption text-slate-700 md:grid-cols-2">
              {row.steps_to_reproduce ? (
                <div>
                  <p className="text-micro font-semibold uppercase text-slate-500">
                    Steps to reproduce
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">
                    {row.steps_to_reproduce}
                  </p>
                </div>
              ) : null}
              {row.desired_outcome ? (
                <div>
                  <p className="text-micro font-semibold uppercase text-slate-500">
                    Desired outcome
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{row.desired_outcome}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          <footer className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-micro text-slate-500">
            {row.email ? (
              <span>
                <span className="font-semibold text-slate-600">Contact:</span>{" "}
                {row.name ? `${row.name} · ` : ""}
                <a
                  href={`mailto:${row.email}?subject=${encodeURIComponent("Re: " + row.subject)}`}
                  className="text-cyan-700 underline-offset-2 hover:underline"
                >
                  {row.email}
                </a>
              </span>
            ) : (
              <span className="italic">No reply address</span>
            )}
            {row.page_path ? <span>Page: {row.page_path}</span> : null}
            {row.share_id ? <span>Share: {row.share_id.slice(0, 8)}…</span> : null}
            {row.plan_title ? <span>Plan: {row.plan_title}</span> : null}
            {row.browser ? <span>Browser: {row.browser}</span> : null}
            <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
              {row.status}
            </span>
          </footer>
        </article>
      ))}
    </div>
  );
}
