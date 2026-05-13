import { Info } from "lucide-react";

/**
 * Muted, non-dismissible note above the Insights tab content. NOT an AI
 * disclaimer — Insights are deterministic CPM math, and disclaiming them
 * as AI would undersell the engine and overclaim about the AI side. This
 * frames the legitimate limit: math is only as good as the source data.
 *
 * See docs/plansight-ai/specs/IN_PRODUCT_DISCLAIMERS_SPEC.md §Surface 2.
 */
export function InsightsDataQualityNote() {
  return (
    <div className="flex items-start gap-2 text-caption text-slate-500">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <p className="italic">
        Insights are calculated from the task data in your uploaded plan.
        Accuracy depends on data quality — missing dependencies, incorrect
        durations, or unset baselines will produce misleading results.
        Review the underlying tasks if any insight looks unexpected.
      </p>
    </div>
  );
}
