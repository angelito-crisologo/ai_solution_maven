"use client";

import { useMemo, useState } from "react";
import { Link2, MessageSquare, PanelTop, Share2 } from "lucide-react";
import type { Plan, PlanMetrics, PlanTask } from "@/lib/plansight-ai/types";
import type { PlanInsight } from "@/lib/plansight-ai/analysis";
import type { SharePayload } from "@/lib/plansight-ai/share";

type Props = {
  plan: Plan;
  metrics: PlanMetrics;
  insights: PlanInsight[];
  share: SharePayload;
};

const MY_TASK_OWNER = "Angelito Crisologo";

type ViewFilter = "all" | "my-tasks" | "milestones";

function formatDate(value: string | null) {
  if (!value) return "Not set";

  const date = new Date(value);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function progressLabel(task: PlanTask) {
  if (task.percentComplete == null || task.percentComplete === 0) return "Not started";
  if (task.percentComplete >= 100) return "Complete";
  return `${task.percentComplete}%`;
}

function progressTone(task: PlanTask) {
  if (task.percentComplete == null || task.percentComplete === 0) return "bg-slate-100 text-slate-700";
  if (task.percentComplete >= 100) return "bg-emerald-100 text-emerald-800";
  return "bg-amber-100 text-amber-800";
}

export function PlanSightWorkspace({ plan, metrics, insights, share }: Props) {
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");

  const visibleTasks = useMemo(() => {
    if (viewFilter === "milestones") {
      return plan.tasks.filter((task) => task.milestone);
    }

    if (viewFilter === "my-tasks") {
      return plan.tasks.filter((task) =>
        task.resourceNames.some((resource) => resource === MY_TASK_OWNER)
      );
    }

    return plan.tasks;
  }, [plan.tasks, viewFilter]);

  return (
    <section className="px-6 py-10">
      <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Imported plan
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-dark">{plan.title}</h2>
              <p className="mt-2 text-sm text-slate-500">
                {plan.sourceFormat.toUpperCase()} uploaded {formatDate(plan.importedAt)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["all", "my-tasks", "milestones"] as ViewFilter[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setViewFilter(filter)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    viewFilter === filter
                      ? "bg-dark text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {filter === "all" ? "All tasks" : filter === "my-tasks" ? "My Tasks" : "Milestones"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <StatCard label="Total tasks" value={metrics.totalTasks} />
            <StatCard label="Completed" value={metrics.completedTasks} />
            <StatCard label="My Tasks" value={metrics.myTasks} />
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[minmax(0,2fr)_110px_110px_120px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-normal text-slate-500">
              <span>Task</span>
              <span>Dates</span>
              <span>Owner</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-slate-200">
              {visibleTasks.map((task) => (
                <div
                  key={task.id}
                  className="grid grid-cols-[minmax(0,2fr)_110px_110px_120px] gap-3 px-4 py-4 text-sm"
                >
                  <div>
                    <p className="font-medium text-dark">{task.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {task.summary ? "Summary task" : `WBS ${task.wbs ?? "—"}`}
                      {task.milestone ? " · Milestone" : ""}
                    </p>
                  </div>
                  <div className="text-slate-600">
                    {formatDate(task.start)}
                    <br />
                    {formatDate(task.finish)}
                  </div>
                  <div className="text-slate-600">
                    {task.resourceNames.length > 0 ? task.resourceNames.join(", ") : "Unassigned"}
                  </div>
                  <span
                    className={`inline-flex h-fit w-fit rounded-full px-3 py-1 text-xs font-semibold ${progressTone(task)}`}
                  >
                    {progressLabel(task)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                  AI summary
                </p>
                <h3 className="text-xl font-semibold text-dark">What the PM can say</h3>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {insights.map((insight) => (
                <div key={insight.title} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-dark">{insight.title}</p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-normal ${
                        insight.severity === "high"
                          ? "bg-red-100 text-red-700"
                          : insight.severity === "medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {insight.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>

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
              This is the product boundary for PlanSight AI: the PM uploads a plan, gets a
              readable analysis, then shares a stakeholder-safe version without exposing the
              full editing surface.
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <PanelTop className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
                  Product line
                </p>
                <h3 className="text-xl font-semibold text-dark">First product, shared foundation</h3>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              PlanSight AI is the first hosted product on <span className="font-medium text-dark">aisolutionmaven.com</span>.
              The structure here should scale to future products without changing the product
              contract: upload, analyze, share.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-dark">{value}</p>
    </div>
  );
}
