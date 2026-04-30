"use client";

import { Link2, MessageSquare, PanelTop, Share2 } from "lucide-react";
import type { ReactNode } from "react";
import type { PlanMetrics } from "@/lib/plansight-ai/types";
import type { PlanInsightsReport } from "@/lib/plansight-ai/analysis";
import type { SharePayload } from "@/lib/plansight-ai/share";

type Props = {
  analysis: PlanInsightsReport;
  share: SharePayload;
  metrics: PlanMetrics;
};

type CriticalItem = {
  id: number;
  name: string;
  start: string | null;
  finish: string | null;
  assignee: string;
  slackDays?: number;
  durationDays?: number;
  signals?: Array<"near-end" | "project-end" | "long-duration">;
};

export function PlanSightAnalysisPanel({ analysis, share, metrics }: Props) {
  const isApproximateMode = analysis.mode === "approximate";
  const criticalItems = (isApproximateMode
    ? analysis.insights.potentialCriticalTasks
    : analysis.insights.criticalTasks) as CriticalItem[];

  return (
    <section className="px-6 py-10">
      <div className="mx-auto grid max-w-[1200px] gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                  Insights engine
                </p>
                <h3 className="text-xl font-semibold text-dark">Programmatic project facts</h3>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <Metric label="Total tasks" value={analysis.summary.totalTasks} />
              <Metric label="Completed" value={analysis.summary.completedTasks} />
              <Metric label="Late tasks" value={analysis.summary.lateTasks} />
              <Metric
                label={isApproximateMode ? "Potential critical tasks" : "Critical tasks"}
                value={analysis.summary.criticalTasks}
              />
              <Metric label="At-risk tasks" value={analysis.summary.atRiskTasks} />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                Output format
              </p>
              <pre className="mt-3 overflow-x-auto text-xs leading-6 text-slate-700">
{JSON.stringify(
  {
    summary: analysis.summary,
    insights: {
      mode: analysis.mode,
      projectEndDate: analysis.insights.projectEndDate,
      criticalTasks: criticalItems.map((task) => task.id),
      criticalPaths: isApproximateMode ? [] : analysis.insights.criticalPaths,
      potentialCriticalTasks: analysis.insights.potentialCriticalTasks.map((task) => task.id),
      lateTasks: analysis.insights.lateTasks.map((task) => task.id),
      atRiskTasks: analysis.insights.atRiskTasks.map((task) => task.id),
      laggingTasks: analysis.insights.laggingTasks.map((task) => task.id),
      bottlenecks: analysis.insights.bottlenecks.map((task) => task.id)
    }
  },
  null,
  2
)}
              </pre>
            </div>
          </div>

          <InsightSection
            title={isApproximateMode ? "Potential critical tasks" : "Critical tasks"}
            subtitle={
              isApproximateMode
                ? "Tasks near project completion or with longer schedule impact."
                : "Zero-slack tasks that drive the project finish date."
            }
            items={criticalItems.map((task) => (
              <InsightRow
                key={task.id}
                title={`${task.id} · ${task.name}`}
                meta={
                  isApproximateMode
                    ? formatApproximateMeta(task)
                    : `Slack ${task.slackDays ?? 0}d · Duration ${task.durationDays ?? 0}d`
                }
                detail={`${task.start ?? "Not set"} → ${task.finish ?? "Not set"} · ${task.assignee}`}
              />
            ))}
            emptyText={
              isApproximateMode
                ? "No high-impact tasks could be identified from the imported schedule."
                : "No critical-path tasks could be computed from the imported schedule."
            }
          />

          <InsightSection
            title="Late tasks"
            subtitle="Tasks past finish date and still incomplete."
            items={analysis.insights.lateTasks.map((task) => (
              <InsightRow
                key={task.id}
                title={`${task.id} · ${task.name}`}
                meta={`${task.daysLate} day${task.daysLate === 1 ? "" : "s"} late`}
                detail={`${task.start ?? "Not set"} → ${task.finish ?? "Not set"} · ${task.assignee}`}
              />
            ))}
            emptyText="No late tasks found."
          />

          <InsightSection
            title="At-risk tasks"
            subtitle="Due soon and not yet complete."
            items={analysis.insights.atRiskTasks.map((task) => (
              <InsightRow
                key={task.id}
                title={`${task.id} · ${task.name}`}
                meta={`${task.daysRemaining} day${task.daysRemaining === 1 ? "" : "s"} remaining`}
                detail={`${task.start ?? "Not set"} → ${task.finish ?? "Not set"} · ${task.assignee}`}
              />
            ))}
            emptyText="No at-risk tasks found within the current lookahead window."
          />

          <InsightSection
            title="Lagging tasks"
            subtitle="Actual progress trails the schedule-based expectation."
            items={analysis.insights.laggingTasks.map((task) => (
              <InsightRow
                key={task.id}
                title={`${task.id} · ${task.name}`}
                meta={`Expected ${task.expectedProgress}% · Actual ${task.progress ?? 0}%`}
                detail={`Gap ${task.gap}% · ${task.start ?? "Not set"} → ${task.finish ?? "Not set"}`}
              />
            ))}
            emptyText="No lagging tasks detected."
          />

          <InsightSection
            title="Dependency bottlenecks"
            subtitle="Tasks that unblock the most downstream work."
            items={analysis.insights.bottlenecks.map((task) => (
              <InsightRow
                key={task.id}
                title={`${task.id} · ${task.name}`}
                meta={`${task.dependentTaskCount} downstream task${task.dependentTaskCount === 1 ? "" : "s"}`}
                detail={`${task.start ?? "Not set"} → ${task.finish ?? "Not set"} · ${task.assignee}`}
              />
            ))}
            emptyText="No bottlenecks found."
          />
        </div>

        <div className="grid gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-secondary">
                  Stakeholder sharing
                </p>
                <h3 className="text-xl font-semibold text-dark">Read-only plan link</h3>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-dark p-4 text-white">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Link2 className="h-4 w-4" />
                {share.isPublic ? "Public stakeholder link" : "Private link"}
              </div>
              <p className="mt-2 text-lg font-semibold">{share.title}</p>
              <p className="mt-1 text-sm text-slate-300">{share.summary}</p>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                {share.shareUrl}
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              The PM uploads a plan, gets a deterministic analysis, then shares a stakeholder-safe
              version without exposing the full editing surface.
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <PanelTop className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
                  Plan metrics
                </p>
                <h3 className="text-xl font-semibold text-dark">Quick plan health view</h3>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Metric label="Total tasks" value={metrics.totalTasks} />
              <Metric label="Summary tasks" value={metrics.summaryTasks} />
              <Metric label="Milestones" value={metrics.milestoneTasks} />
              <Metric label="My Tasks" value={metrics.myTasks} />
              <Metric label="Unassigned" value={metrics.unassignedTasks} />
              <Metric label="Tasks without dates" value={metrics.tasksWithoutDates} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InsightSection({
  title,
  subtitle,
  items,
  emptyText
}: {
  title: string;
  subtitle: string;
  items: ReactNode[];
  emptyText: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-normal text-dark">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items
        ) : (
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">{emptyText}</div>
        )}
      </div>
    </div>
  );
}

function InsightRow({
  title,
  meta,
  detail
}: {
  title: string;
  meta: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium text-dark">{title}</p>
        <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{meta}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-dark">{value}</p>
    </div>
  );
}

function formatApproximateMeta(task: { signals?: Array<"near-end" | "project-end" | "long-duration"> }) {
  if (!task.signals || task.signals.length === 0) {
    return "Potential impact";
  }

  if (task.signals.includes("project-end")) {
    return "Ends at project end";
  }

  if (task.signals.includes("near-end") && task.signals.includes("long-duration")) {
    return "Near end · Long duration";
  }

  if (task.signals.includes("near-end")) {
    return "Near project end";
  }

  if (task.signals.includes("long-duration")) {
    return "Long duration";
  }

  return "Potential impact";
}
