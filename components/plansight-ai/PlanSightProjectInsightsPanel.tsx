"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  GitBranch,
  Link2
} from "lucide-react";
import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import type {
  ApproximateCriticalTask,
  CriticalPathTask,
  PlanInsightsReport,
  PlanInsightTask
} from "@/lib/plansight-ai/analysis";
import type { PlanMetrics } from "@/lib/plansight-ai/types";
import type { SharePayload } from "@/lib/plansight-ai/share";
import { parsePlanDate } from "./plansight-utils";

type Props = {
  analysis: PlanInsightsReport;
  share: SharePayload;
  metrics: PlanMetrics;
  selectedTaskIds: Set<number>;
  onSelectTask: (taskId: number) => void;
};

export function PlanSightProjectInsightsPanel({
  analysis,
  share,
  metrics,
  selectedTaskIds,
  onSelectTask
}: Props) {
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [showCriticalPaths, setShowCriticalPaths] = useState(false);
  const isApproximateMode = analysis.mode === "approximate";

  const health = useMemo(() => {
    if (isApproximateMode) {
      return {
        label: "Project Health (Timeline-Based)",
        tone: "bg-amber-50 text-amber-800 border-amber-100",
        banner: "⚠️ Limited Analysis Mode (No Task Dependencies)",
        explanation:
          "Task dependencies are not available. Showing approximate impact analysis."
      };
    }

    if (analysis.summary.healthStatus === "red") {
      return {
        label: "Red",
        tone: "bg-red-50 text-red-700 border-red-100",
        banner: "Project health is red",
        explanation:
          "The plan has critical lateness or a critical-path delay and needs immediate attention."
      };
    }

    if (analysis.summary.healthStatus === "amber") {
      return {
        label: "Amber",
        tone: "bg-amber-50 text-amber-800 border-amber-100",
        banner: "Project health is amber",
        explanation:
          "The plan has near-term risk or lagging work and should be monitored closely."
      };
    }

    return {
      label: "Green",
      tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
      banner: "Project health is green",
      explanation: "The plan is tracking cleanly with no major late or critical-path issues."
    };
  }, [analysis.summary.healthStatus, isApproximateMode]);

  const isVisibleInsightTask = (task: PlanInsightTask) => task.isLeaf;
  const isApproximateCriticalTask = (
    task: CriticalPathTask | ApproximateCriticalTask
  ): task is ApproximateCriticalTask => "signals" in task;

  const visibleCriticalTasks = useMemo(
    () => {
      const source: Array<CriticalPathTask | ApproximateCriticalTask> = isApproximateMode
        ? analysis.insights.potentialCriticalTasks
        : analysis.insights.criticalTasks;

      return source
        .filter((task) => !task.isSummary && (task.isLeaf || task.milestone))
        .sort((a, b) => {
          const finishDiff =
            (parsePlanDate(b.finish)?.getTime() ?? Number.NEGATIVE_INFINITY) -
            (parsePlanDate(a.finish)?.getTime() ?? Number.NEGATIVE_INFINITY);
          if (finishDiff !== 0) return finishDiff;

          const startDiff =
            (parsePlanDate(b.start)?.getTime() ?? Number.NEGATIVE_INFINITY) -
            (parsePlanDate(a.start)?.getTime() ?? Number.NEGATIVE_INFINITY);
          if (startDiff !== 0) return startDiff;

          return a.id - b.id;
        });
    },
    [analysis.insights.criticalTasks, analysis.insights.potentialCriticalTasks, isApproximateMode]
  );

  const criticalTaskById = useMemo(() => {
    const source = isApproximateMode ? analysis.insights.potentialCriticalTasks : analysis.insights.criticalTasks;
    return new Map(source.map((task) => [String(task.id), task] as const));
  }, [analysis.insights.criticalTasks, analysis.insights.potentialCriticalTasks, isApproximateMode]);

  const criticalPathCards = useMemo(() => {
    if (isApproximateMode) {
      return [] as Array<{ key: string; pathIndex: number; label: string; durationDays: number }>;
    }

    return analysis.insights.criticalPaths.map((path, index) => {
      const tasks = path.map((taskId) => criticalTaskById.get(taskId)).filter(Boolean) as CriticalPathTask[];
      const durationDays = tasks.reduce((sum, task) => {
        const start = parsePlanDate(task.start);
        const finish = parsePlanDate(task.finish);
        if (!start || !finish) return sum;
        return sum + Math.max(0, Math.round((finish.getTime() - start.getTime()) / 86400000) + 1);
      }, 0);

      return {
        key: `${path.join("-")}-${index}`,
        pathIndex: index + 1,
        label: path.join(" → "),
        durationDays
      };
    });
  }, [analysis.insights.criticalPaths, criticalTaskById, isApproximateMode]);

  const criticalPathCount = criticalPathCards.length;

  const summaryCards = useMemo(
    () => [
      {
        label: "Late Tasks",
        value: analysis.summary.lateTasks,
        icon: Clock3,
        tone: "text-red-700 bg-red-50 border-red-100"
      },
      {
        label: "At Risk Tasks",
        value: analysis.summary.atRiskTasks,
        icon: AlertTriangle,
        tone: "text-amber-800 bg-amber-50 border-amber-100"
      },
      {
        label: isApproximateMode ? "Potential Critical Tasks" : "Critical Path Tasks",
        value: visibleCriticalTasks.length,
        icon: isApproximateMode ? AlertTriangle : GitBranch,
        tone: isApproximateMode
          ? "text-amber-800 bg-amber-50 border-amber-100"
          : "text-blue-700 bg-blue-50 border-blue-100"
      },
      {
        label: "Completed Tasks",
        value: `${analysis.summary.completedTasks} / ${analysis.summary.totalTasks}`,
        icon: CheckCircle2,
        tone: "text-emerald-700 bg-emerald-50 border-emerald-100"
      }
    ],
    [analysis]
  );

  const lateTasks = analysis.insights.lateTasks.filter(isVisibleInsightTask);
  const atRiskTasks = analysis.insights.atRiskTasks.filter(isVisibleInsightTask);
  const criticalTasks = visibleCriticalTasks;
  const laggingTasks = analysis.insights.laggingTasks.filter(isVisibleInsightTask);
  const laggingTaskCount = laggingTasks.length;

  const keyInsights = useMemo(() => {
    const items: string[] = [];

    if (isApproximateMode) {
      items.push("⚠️ Limited Analysis Mode (No Task Dependencies).");
      items.push("Task dependencies are not available. Showing approximate impact analysis.");
      items.push("Tasks near project completion are more likely to impact delivery if delayed.");
    }

    if (analysis.summary.lateTasks > 0) {
      items.push(`${analysis.summary.lateTasks} tasks are late.`);
    }
    if (analysis.summary.atRiskTasks > 0) {
      items.push(`${analysis.summary.atRiskTasks} tasks are at risk.`);
    }
    if (isApproximateMode) {
      if (visibleCriticalTasks.length > 0) {
        items.push(`🔥 ${visibleCriticalTasks.length} potential critical tasks detected near project completion.`);
      }
    } else if (criticalPathCount > 0) {
      const criticalPathMessage =
        `🔥 ${criticalPathCount} critical paths detected with a total of ${visibleCriticalTasks.length} tasks.` +
        (criticalPathCount > 1
          ? " ⚠️ Multiple critical paths detected. This increases project risk and reduces scheduling flexibility."
          : "");
      items.push(criticalPathMessage);
    }
    if (laggingTaskCount > 0) {
      items.push(`${laggingTaskCount} tasks are lagging behind expected progress.`);
    }
    if (analysis.insights.bottlenecks.length > 0) {
      items.push(
        `${analysis.insights.bottlenecks[0].name} is the biggest dependency bottleneck with ${analysis.insights.bottlenecks[0].dependentTaskCount} successors.`
      );
    }

    return items.length > 0 ? items : ["No immediate execution risk detected from the imported plan."];
  }, [analysis, criticalPathCount, isApproximateMode, laggingTaskCount, visibleCriticalTasks.length]);

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(share.shareUrl);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1200);
    } catch {
      setCopyState("idle");
    }
  }

  return (
    <section className="px-6 py-10">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className={`rounded-2xl border p-6 shadow-soft ${health.tone}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal">Project Insights</p>
                <h3 className="mt-2 text-2xl font-semibold text-dark">{health.banner}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{health.explanation}</p>
                {isApproximateMode ? (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-normal text-slate-500">
                    Tasks near project completion are more likely to impact delivery if delayed.
                  </p>
                ) : null}
              </div>
              <div className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-normal text-dark">
                {health.label}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className={`flex h-full min-h-[120px] flex-col rounded-2xl border p-4 shadow-soft ${card.tone}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-normal">{card.label}</p>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="mt-auto pt-4">
                      <p className="text-2xl font-semibold text-dark">{card.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                <Link2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-secondary">
                  Stakeholder sharing
                </p>
                <h3 className="text-lg font-semibold text-dark">Read-only plan link</h3>
              </div>
            </div>

            <div className="mt-3 rounded-2xl bg-dark p-3 text-white">
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                {share.shareUrl}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copyState === "copied" ? "Copied" : "Copy"}
                </button>
                <a
                  href={share.shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </a>
              </div>
            </div>

            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
              Share a read-only version of this project without exposing the editing surface.
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-normal text-dark">Key insights</p>
          <ul className="mt-4 space-y-3">
            {keyInsights.map((insight) => (
              <li
                key={insight}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
              >
                {insight}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <InsightSection
            title={`Late Tasks (${lateTasks.length})`}
            icon={Clock3}
            details="Most overdue tasks first"
            items={lateTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  selected={selectedTaskIds.has(task.id)}
                  onSelect={onSelectTask}
                  meta={`${task.daysLate} day${task.daysLate === 1 ? "" : "s"} late`}
                  rightLabel={formatCardDate(task.finish)}
                  detail={`Assigned to ${task.assignee}`}
                />
              ))}
            emptyText="No late tasks found."
          />

          <InsightSection
            title={`At Risk Tasks (${atRiskTasks.length})`}
            icon={AlertTriangle}
            details="Due soon and still incomplete"
            items={atRiskTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  selected={selectedTaskIds.has(task.id)}
                  onSelect={onSelectTask}
                  meta={`${task.daysRemaining} day${task.daysRemaining === 1 ? "" : "s"} remaining`}
                  rightLabel={`${task.progress ?? 0}%`}
                  detail={`Due ${formatCardDate(task.finish)} · ${task.assignee}`}
                />
              ))}
            emptyText="No at-risk tasks found."
          />

          <CriticalTasksCard
            title={`${isApproximateMode ? "Potential Critical Tasks" : "Critical Tasks"} (${criticalTasks.length})`}
            icon={isApproximateMode ? AlertTriangle : GitBranch}
            details={
              isApproximateMode
                ? `Tasks near ${analysis.insights.projectEndDate ? formatCardDate(analysis.insights.projectEndDate) : "project completion"} or with longer schedule impact`
                : "Zero-slack tasks that drive the project finish date"
            }
            tasks={criticalTasks.map((task, index) => (
              <TaskRow
                key={task.id}
                task={task}
                selected={selectedTaskIds.has(task.id)}
                onSelect={onSelectTask}
                meta={
                  isApproximateCriticalTask(task)
                    ? formatApproximateTaskMeta(task)
                    : `#${index + 1} · Slack ${(task as CriticalPathTask).slackDays}d`
                }
                rightLabel={`${task.durationDays}d`}
                detail={`${formatCardDate(task.start)} → ${formatCardDate(task.finish)} · ${task.assignee}`}
              />
            ))}
            emptyText={
              isApproximateMode
                ? "No high-impact tasks were identified from the imported schedule."
                : "The plan does not currently expose a zero-slack critical task."
            }
            paths={criticalPathCards}
            expanded={showCriticalPaths}
            onToggleExpanded={() => setShowCriticalPaths((value) => !value)}
            showPaths={!isApproximateMode}
          />

          <InsightSection
            title={`Lagging Tasks (${laggingTasks.length})`}
            icon={AlertTriangle}
            details="Expected progress versus actual progress"
            items={laggingTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  selected={selectedTaskIds.has(task.id)}
                  onSelect={onSelectTask}
                  meta={`Expected ${task.expectedProgress}%`}
                  rightLabel={`Actual ${task.progress ?? 0}%`}
                  detail={`Gap ${task.gap}% · ${formatCardDate(task.start)} → ${formatCardDate(task.finish)}`}
                />
              ))}
            emptyText="No lagging tasks detected."
          />
        </div>
      </div>
    </section>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-white/70 px-3 py-1.5 text-dark">{children}</span>;
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

function InsightSection({
  title,
  icon: Icon,
  details,
  items,
  emptyText
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  details: string;
  items: ReactNode[];
  emptyText: string;
}) {
  return (
    <details open className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold uppercase tracking-normal text-dark">{title}</p>
          </div>
          <p className="mt-1 text-sm text-slate-500">{details}</p>
        </div>
      </summary>
      <div className="mt-4 max-h-[320px] space-y-3 overflow-y-auto pr-1">
        {items.length > 0 ? (
          items
        ) : (
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">{emptyText}</div>
        )}
      </div>
    </details>
  );
}

function CriticalTasksCard({
  title,
  icon: Icon,
  details,
  tasks,
  emptyText,
  paths,
  expanded,
  onToggleExpanded,
  showPaths
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  details: string;
  tasks: ReactNode[];
  emptyText: string;
  paths: Array<{ key: string; pathIndex: number; label: string; durationDays: number }>;
  expanded: boolean;
  onToggleExpanded: () => void;
  showPaths: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-500" />
        <p className="text-sm font-semibold uppercase tracking-normal text-dark">{title}</p>
      </div>
      <p className="mt-1 text-sm text-slate-500">{details}</p>
      {showPaths ? (
        <>
          <button
            type="button"
            onClick={onToggleExpanded}
            className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-normal text-slate-700 transition hover:bg-slate-100"
          >
            {expanded ? "Hide Critical Paths" : "View Critical Paths"}
          </button>

          {expanded ? (
            <div className="mt-4 max-h-[180px] space-y-3 overflow-y-auto pr-1">
              {paths.length > 0 ? (
                paths.map((path) => (
                  <div key={path.key} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                    <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                      Path {path.pathIndex}
                    </p>
                    <p className="mt-1 font-medium text-dark">{path.label}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-normal text-slate-500">
                      Duration: {path.durationDays} days
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  No ordered critical path sequence could be computed from the imported schedule.
                </div>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      <div className="mt-4 max-h-[240px] space-y-3 overflow-y-auto pr-1">
        {tasks.length > 0 ? (
          tasks
        ) : (
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">{emptyText}</div>
        )}
      </div>
    </div>
  );
}

function formatApproximateTaskMeta(task: CriticalPathTask | ApproximateCriticalTask) {
  if ("signals" in task) {
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
  }

  return "Potential impact";
}

function TaskRow({
  task,
  selected,
  onSelect,
  meta,
  rightLabel,
  detail
}: {
  task: PlanInsightTask;
  selected: boolean;
  onSelect: (taskId: number) => void;
  meta: string;
  rightLabel: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(task.id)}
      title={`${task.name} · ${detail} · ${meta}`}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
        selected ? "border-secondary/40 bg-secondary/5" : "border-slate-100 bg-slate-50 hover:bg-slate-100"
      }`}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium text-dark">
          {task.id} · {task.name}
        </p>
        <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{meta}</p>
      </div>
      <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-slate-600">{detail}</p>
        <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{rightLabel}</p>
      </div>
    </button>
  );
}
