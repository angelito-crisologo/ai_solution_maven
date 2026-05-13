import Link from "next/link";
import { Download, Filter, X } from "lucide-react";
import type {
  FeedbackFilter,
  FeedbackSeverityFilter,
  FeedbackTypeFilter
} from "@/lib/feedback/queries";
import {
  FEEDBACK_SEVERITIES,
  FEEDBACK_TYPES
} from "@/lib/feedback/queries";

const typeLabel: Record<FeedbackTypeFilter, string> = {
  general_feedback: "General feedback",
  feature_request: "Feature requests",
  bug_report: "Bug reports"
};

const severityLabel: Record<FeedbackSeverityFilter, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical"
};

type Props = {
  /** Path the filter form submits back to. Same page that rendered it. */
  basePath: string;
  /** Product slug used both as the eq filter and on the CSV export URL. */
  product: string;
  /** Current filter state, read from the URL. */
  current: FeedbackFilter;
  /** Accent colour for the Clear link. */
  accent: "cyan" | "emerald";
};

export function FeedbackFilters({
  basePath,
  product,
  current,
  accent
}: Props) {
  const hasFilters =
    !!current.type || !!current.severity || !!current.status;

  const exportHref = (() => {
    const params = new URLSearchParams();
    params.set("product", product);
    if (current.type) params.set("type", current.type);
    if (current.severity) params.set("severity", current.severity);
    if (current.status) params.set("status", current.status);
    return `/api/admin/feedback/export?${params.toString()}`;
  })();

  const accentText =
    accent === "cyan" ? "text-cyan-700" : "text-emerald-700";
  const accentHoverBorder =
    accent === "cyan" ? "hover:border-cyan-300" : "hover:border-emerald-300";

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <form
        action={basePath}
        method="get"
        className="flex flex-wrap items-end gap-3"
      >
        <div>
          <label
            htmlFor="filter-type"
            className="block text-micro font-semibold uppercase text-slate-500"
          >
            <span className="inline-flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Type
            </span>
          </label>
          <select
            id="filter-type"
            name="type"
            defaultValue={current.type ?? ""}
            className="mt-1 h-9 rounded-md border border-slate-200 bg-white px-3 text-body text-ink"
          >
            <option value="">All types</option>
            {FEEDBACK_TYPES.map((t) => (
              <option key={t} value={t}>
                {typeLabel[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-severity"
            className="block text-micro font-semibold uppercase text-slate-500"
          >
            Severity
          </label>
          <select
            id="filter-severity"
            name="severity"
            defaultValue={current.severity ?? ""}
            className="mt-1 h-9 rounded-md border border-slate-200 bg-white px-3 text-body text-ink"
          >
            <option value="">All severities</option>
            {FEEDBACK_SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {severityLabel[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-status"
            className="block text-micro font-semibold uppercase text-slate-500"
          >
            Status
          </label>
          <input
            id="filter-status"
            name="status"
            defaultValue={current.status ?? ""}
            placeholder="e.g. new"
            className="mt-1 h-9 w-32 rounded-md border border-slate-200 bg-white px-3 text-body text-ink"
          />
        </div>

        <button
          type="submit"
          className={`inline-flex h-9 items-center gap-2 rounded-md bg-slate-900 px-3 text-caption font-semibold text-white transition hover:bg-slate-800`}
        >
          Apply
        </button>

        {hasFilters ? (
          <Link
            href={basePath}
            className={`inline-flex h-9 items-center gap-1 text-caption ${accentText} transition hover:underline`}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Link>
        ) : null}

        <a
          href={exportHref}
          className={`ml-auto inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-caption font-semibold text-slate-700 transition ${accentHoverBorder}`}
        >
          <Download className="h-3.5 w-3.5" />
          Download CSV
        </a>
      </form>
    </div>
  );
}
