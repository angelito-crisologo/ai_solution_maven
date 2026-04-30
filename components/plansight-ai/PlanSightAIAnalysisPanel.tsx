"use client";

import { MessageSquare, Sparkles, TriangleAlert } from "lucide-react";
import type { ComponentType } from "react";
import type { PlanInsightsReport } from "@/lib/plansight-ai/analysis";
import { parsePlanDate } from "./plansight-utils";

type Props = {
  analysis: PlanInsightsReport;
};

export function PlanSightAIAnalysisPanel({ analysis }: Props) {
  const isApproximateMode = analysis.mode === "approximate";
  const topLate = analysis.insights.lateTasks[0];
  const topBottleneck = analysis.insights.bottlenecks[0];
  const topAtRisk = analysis.insights.atRiskTasks[0];

  const summary = [
    `This project has ${analysis.summary.totalTasks} tasks.`,
    `${analysis.summary.lateTasks} are late.`,
    `${analysis.summary.atRiskTasks} are at risk.`,
    isApproximateMode
      ? `${analysis.summary.criticalTasks} are potential critical tasks near project completion.`
      : `${analysis.summary.criticalTasks} sit on the critical path.`
  ].join(" ");

  return (
    <section className="px-6 py-10">
      <div className="mx-auto grid max-w-[1200px] gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">AI summary</p>
              <h3 className="text-xl font-semibold text-dark">Readable narrative for the PM</h3>
            </div>
          </div>
          <div className="mt-5 rounded-2xl bg-slate-50 p-5">
            <p className="text-base leading-7 text-slate-700">{summary}</p>
          </div>

          <div className="mt-5 space-y-3">
            <RiskCard
              icon={TriangleAlert}
              title="Risks"
              items={[
                topLate
                  ? `${topLate.name} is late by ${analysis.insights.lateTasks[0].daysLate} days (due ${formatCardDate(topLate.finish)}).`
                  : "No late tasks detected.",
                topAtRisk
                  ? `${topAtRisk.name} is due in ${topAtRisk.daysRemaining} days and still needs attention (due ${formatCardDate(topAtRisk.finish)}).`
                  : "No immediate at-risk work found.",
                topBottleneck
                  ? `${topBottleneck.name} blocks ${topBottleneck.dependentTaskCount} downstream tasks.`
                  : "No bottlenecks detected."
              ]}
            />
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-secondary">
                  Recommendations
                </p>
                <h3 className="text-xl font-semibold text-dark">What the AI layer should say next</h3>
              </div>
            </div>

            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li className="rounded-2xl bg-slate-50 px-4 py-3">
                {analysis.summary.criticalTasks > 0
                  ? isApproximateMode
                    ? "Prioritize the tasks near project completion before anything else."
                    : "Prioritize the critical path before anything else."
                  : isApproximateMode
                    ? "Validate whether any dependency data can be added to improve the analysis."
                    : "Validate whether the current plan has a clear dependency chain."}
              </li>
              <li className="rounded-2xl bg-slate-50 px-4 py-3">
                {analysis.summary.lateTasks > 0
                  ? "Resolve the late tasks first to reduce schedule risk."
                  : "Keep watching the near-term schedule for slips."}
              </li>
              <li className="rounded-2xl bg-slate-50 px-4 py-3">
                {analysis.summary.atRiskTasks > 0
                  ? "Focus attention on the tasks due within the next two weeks."
                  : "Use the stakeholder share view to communicate the current healthy status."}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function RiskCard({
  icon: Icon,
  title,
  items
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-500" />
        <p className="text-sm font-semibold uppercase tracking-normal text-dark">{title}</p>
      </div>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li key={item} className="rounded-xl bg-slate-50 px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatCardDate(value: string | null) {
  const date = parsePlanDate(value);
  if (!date) return "Not set";

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "2-digit"
  }).format(date);
}
