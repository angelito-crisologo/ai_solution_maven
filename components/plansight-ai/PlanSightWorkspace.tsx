"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileBarChart, FileText, Loader2 } from "lucide-react";
import type { Plan, PlanMetrics } from "@/lib/plansight-ai/types";
import type { PlanInsight, PlanInsightsReport } from "@/lib/plansight-ai/analysis";
import type { SharePayload } from "@/lib/plansight-ai/share";
import { GanttChart } from "./GanttChart";
import { ReportingPeriodPicker } from "./ReportingPeriodPicker";
import { TaskTable } from "./TaskTable";
import { buildTaskTree, collectNodeIdsWithChildren, filterTaskTree, formatLongDate, ViewMode } from "./plansight-utils";

type Props = {
  plan: Plan;
  metrics: PlanMetrics;
  insights: PlanInsight[];
  analysis: PlanInsightsReport;
  share: SharePayload;
  highlightedTaskIds?: Set<number>;
  stakeholderName?: string;
  onStakeholderNameChange?: (value: string) => void;
  containerMaxWidthClassName?: string;
  outerSectionClassName?: string;
  /** Pro-only Export PDF + Weekly report buttons. Defaults to false so
   * the stakeholder share view stays unchanged. */
  canExportPdf?: boolean;
  /** Pro-only inline AI in the task table. Defaults to false so the
   * stakeholder share view stays clean. */
  canExplainTask?: boolean;
  /** User's week-start preference (controls the Weekly Report reporting
   * period). Defaults to "monday". */
  weekStartDay?: "monday" | "sunday";
};

type QuickViewFilter = "all" | "in-progress" | "late" | "at-risk" | "critical-path" | "completed";
type TaskTreeNode = ReturnType<typeof buildTaskTree>[number];
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <p className="text-caption text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-ink">
        {value}
      </p>
    </div>
  );
}

function renderViewLabel(mode: ViewMode) {
  if (mode === "day") return "Daily";
  if (mode === "week") return "Weekly";
  return "Monthly";
}

function countLeafTasks(nodes: TaskTreeNode[]): number {
  let total = 0;

  const walk = (items: TaskTreeNode[]) => {
    for (const node of items) {
      if (node.children.length === 0) {
        total += 1;
      } else {
        walk(node.children as TaskTreeNode[]);
      }
    }
  };

  walk(nodes);
  return total;
}

function collectResourceOptions(nodes: TaskTreeNode[]) {
  const values = new Set<string>();

  const walk = (items: TaskTreeNode[]) => {
    for (const node of items) {
      node.resourceNames.forEach((name) => {
        if (name.trim()) {
          values.add(name.trim());
        }
      });

      if (node.children.length > 0) {
        walk(node.children as TaskTreeNode[]);
      }
    }
  };

  walk(nodes);

  return {
    values: Array.from(values).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
  };
}

export function PlanSightWorkspace({
  plan,
  metrics,
  insights,
  analysis,
  share,
  highlightedTaskIds,
  stakeholderName,
  onStakeholderNameChange,
  containerMaxWidthClassName = "max-w-[1200px]",
  outerSectionClassName = "px-6 py-10",
  canExportPdf = false,
  canExplainTask = false,
  weekStartDay = "monday"
}: Props) {
  const [quickViewFilter, setQuickViewFilter] = useState<QuickViewFilter>("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<number>>(new Set());
  const [leftPaneWidth, setLeftPaneWidth] = useState(520);
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);
  const [rowHeights, setRowHeights] = useState<number[]>([]);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  // Pro PDF surfaces. Each tracks its own loading state so users can see
  // which button they pressed if a request is slow.
  const [pdfPending, setPdfPending] = useState<null | "share" | "report">(null);
  // ISO start date (YYYY-MM-DD) of the user-chosen reporting period for
  // the Weekly Report. null means "default to last completed week."
  const [weeklyOverrideStart, setWeeklyOverrideStart] = useState<string | null>(null);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const taskPaneRef = useRef<HTMLDivElement | null>(null);
  const ganttPaneRef = useRef<HTMLDivElement | null>(null);
  const syncingScrollRef = useRef<"task" | "gantt" | null>(null);
  const [splitWidth, setSplitWidth] = useState(0);

  const taskTree = useMemo(() => buildTaskTree(plan.tasks), [plan.tasks]);
  const hasChildrenTaskIds = useMemo(() => collectNodeIdsWithChildren(taskTree), [taskTree]);
  const criticalTaskIds = useMemo(() => {
    const source = analysis.mode === "approximate" ? analysis.insights.potentialCriticalTasks : analysis.insights.criticalTasks;
    return new Set(source.map((task) => task.id));
  }, [analysis]);
  const lateTaskIds = useMemo(() => new Set(analysis.insights.lateTasks.map((task) => task.id)), [analysis]);
  const atRiskTaskIds = useMemo(() => new Set(analysis.insights.atRiskTasks.map((task) => task.id)), [analysis]);

  useEffect(() => {
    setExpandedTaskIds(new Set(Array.from(hasChildrenTaskIds)));
  }, [hasChildrenTaskIds, plan.id]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 768px) and (orientation: portrait)");

    const update = () => {
      setIsMobilePortrait(query.matches);
    };

    update();

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }

    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  const resourceOptions = useMemo(() => collectResourceOptions(taskTree), [taskTree]);

  useEffect(() => {
    if (resourceFilter === "all") return;

    const available = resourceOptions.values.includes(resourceFilter);
    if (!available) {
      setResourceFilter("all");
    }
  }, [resourceFilter, resourceOptions.values]);

  const filteredTree = useMemo(() => {
    const predicate = (task: (typeof taskTree)[number]) => {
      const quickViewMatch = (() => {
        if (quickViewFilter === "all") return true;
        const percent = Math.max(0, Math.min(100, Math.round(task.percentComplete ?? 0)));
        const isCompleted = percent >= 100;
        if (quickViewFilter === "completed") return isCompleted;
        if (quickViewFilter === "late") return lateTaskIds.has(task.id);
        if (quickViewFilter === "at-risk") return atRiskTaskIds.has(task.id);
        if (quickViewFilter === "critical-path") return criticalTaskIds.has(task.id);
        if (quickViewFilter === "in-progress") return percent > 0 && !isCompleted;
        return true;
      })();

      const resourceMatch =
        resourceFilter === "all"
          ? true
          : task.resourceNames.some((name) => name.trim() === resourceFilter);

      return quickViewMatch && resourceMatch;
    };

    return filterTaskTree(taskTree, predicate);
  }, [
    resourceFilter,
    quickViewFilter,
    taskTree,
    criticalTaskIds,
    lateTaskIds,
    atRiskTaskIds
  ]);

  const visibleTasks = useMemo(() => {
    const output: typeof filteredTree = [];

    const walk = (nodes: typeof filteredTree) => {
      for (const node of nodes) {
        output.push(node);
        if (node.children.length > 0 && expandedTaskIds.has(node.id)) {
          walk(node.children as typeof filteredTree);
        }
      }
    };

    walk(filteredTree);
    return output;
  }, [expandedTaskIds, filteredTree]);

  const filteredLeafTaskCount = useMemo(() => countLeafTasks(filteredTree), [filteredTree]);
  const displayedTotalTaskCount = filteredLeafTaskCount;
  const filteredStatusCounts = useMemo(() => {
    let notStarted = 0;
    let inProgress = 0;
    let completed = 0;

    const walk = (nodes: TaskTreeNode[]) => {
      for (const node of nodes) {
        if (node.children.length === 0) {
          const percent = Math.max(0, Math.min(100, Math.round(node.percentComplete ?? 0)));
          if (percent >= 100) {
            completed += 1;
          } else if (percent > 0) {
            inProgress += 1;
          } else {
            notStarted += 1;
          }
        } else {
          walk(node.children as TaskTreeNode[]);
        }
      }
    };

    walk(filteredTree);

    return {
      notStarted,
      inProgress,
      completed
    };
  }, [filteredTree]);

  const allVisibleExpandableIds = useMemo(() => {
    const ids = new Set<number>();

    const walk = (nodes: typeof filteredTree) => {
      for (const node of nodes) {
        if (node.children.length > 0) {
          ids.add(node.id);
          walk(node.children as typeof filteredTree);
        }
      }
    };

    walk(filteredTree);
    return ids;
  }, [filteredTree]);

  const allVisibleExpanded = useMemo(() => {
    for (const id of Array.from(allVisibleExpandableIds)) {
      if (!expandedTaskIds.has(id)) return false;
    }
    return allVisibleExpandableIds.size > 0;
  }, [allVisibleExpandableIds, expandedTaskIds]);

  useEffect(() => {
    const node = splitRef.current;
    if (!node) return;

    const updateWidth = () => {
      setSplitWidth(node.getBoundingClientRect().width);
    };

    updateWidth();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => updateWidth());
      observer.observe(node);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const maxLeftPaneWidth = useMemo(() => {
    if (splitWidth <= 0) {
      return 740;
    }

    const minGanttPeekWidth = 48;
    return Math.max(360, splitWidth - minGanttPeekWidth);
  }, [splitWidth]);

  useEffect(() => {
    setLeftPaneWidth((current) => Math.min(current, maxLeftPaneWidth));
  }, [maxLeftPaneWidth]);

  useEffect(() => {
    if (!isDraggingDivider) return;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = splitRef.current?.getBoundingClientRect();
      const nextWidth = rect ? event.clientX - rect.left : event.clientX;
      const clampedWidth = Math.min(maxLeftPaneWidth, Math.max(360, nextWidth));
      setLeftPaneWidth(clampedWidth);
    };

    const handlePointerUp = () => {
      setIsDraggingDivider(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDraggingDivider, maxLeftPaneWidth]);

  function handleTaskScroll() {
    const taskPane = taskPaneRef.current;
    const ganttPane = ganttPaneRef.current;
    if (!taskPane || !ganttPane) return;

    if (syncingScrollRef.current === "task") {
      syncingScrollRef.current = null;
      return;
    }

    syncingScrollRef.current = "gantt";
    ganttPane.scrollTop = taskPane.scrollTop;
  }

  function handleGanttScroll() {
    const taskPane = taskPaneRef.current;
    const ganttPane = ganttPaneRef.current;
    if (!taskPane || !ganttPane) return;

    if (syncingScrollRef.current === "gantt") {
      syncingScrollRef.current = null;
      return;
    }

    syncingScrollRef.current = "task";
    taskPane.scrollTop = ganttPane.scrollTop;
  }

  function toggleTask(taskId: number) {
    setExpandedTaskIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function toggleAll() {
    setExpandedTaskIds((current) => {
      if (allVisibleExpanded) {
        return new Set<number>();
      }

      return new Set(allVisibleExpandableIds);
    });
  }

  async function downloadPdf(
    endpoint: "/api/plansight/export-pdf" | "/api/plansight/weekly-snapshot",
    body: Record<string, unknown>,
    fallbackSuffix: string,
    kind: "share" | "report"
  ) {
    setPdfPending(kind);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Failed to generate the PDF.");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition") ?? "";
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);
      const filename = filenameMatch?.[1] ?? `${plan.title}-${fallbackSuffix}.pdf`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.rel = "noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to generate the PDF.");
    } finally {
      setPdfPending(null);
    }
  }

  async function exportSharePdf() {
    await downloadPdf(
      "/api/plansight/export-pdf",
      { shareId: share.shareId, format: "share" },
      "share",
      "share"
    );
  }

  async function exportWeeklyReport() {
    await downloadPdf(
      "/api/plansight/weekly-snapshot",
      {
        shareId: share.shareId,
        ...(weeklyOverrideStart ? { weekStart: weeklyOverrideStart } : {})
      },
      "weekly-report",
      "report"
    );
  }

  async function exportWorkbook() {
    setIsExporting(true);

    try {
      const response = await fetch("/api/plansight/export-xlsx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ plan })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Failed to export the plan to Excel.");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition") ?? "";
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);
      const filename = filenameMatch?.[1] ?? `${plan.title}.xlsx`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.rel = "noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to export the plan to Excel.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section className={outerSectionClassName}>
      <div className={`mx-auto w-full ${containerMaxWidthClassName}`}>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div>
              <p className="text-micro text-cyan-700">Imported plan</p>
              <h2 className="mt-2 text-h2 text-ink">{plan.title}</h2>
              <p className="mt-2 text-caption text-slate-500">
                <span className="font-mono">{plan.sourceFormat.toUpperCase()}</span>{" "}
                uploaded{" "}
                <span className="font-mono">{formatLongDate(plan.importedAt)}</span>
              </p>
              <p className="mt-1 text-caption text-slate-500">
                <span className="font-mono">
                  {plan.startDate ? formatLongDate(plan.startDate) : "No start date"}
                </span>{" "}
                to{" "}
                <span className="font-mono">
                  {plan.finishDate ? formatLongDate(plan.finishDate) : "No finish date"}
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:ml-auto">
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={exportWorkbook}
                  disabled={isExporting}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-body font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? "Exporting..." : "Export Excel"}
                </button>
                {canExportPdf ? (
                  <>
                    <button
                      type="button"
                      onClick={exportSharePdf}
                      disabled={pdfPending !== null}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-body font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      title="Download a PDF version of the share view (stakeholder-friendly)"
                    >
                      {pdfPending === "share" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      {pdfPending === "share" ? "Generating..." : "Export PDF"}
                    </button>
                    <button
                      type="button"
                      onClick={exportWeeklyReport}
                      disabled={pdfPending !== null}
                      className="inline-flex h-9 items-center gap-2 rounded-md bg-cyan-700 px-3 text-body font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                      title="One-page weekly status report covering the last completed week"
                    >
                      {pdfPending === "report" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileBarChart className="h-4 w-4" />
                      )}
                      {pdfPending === "report" ? "Generating..." : "Weekly report"}
                    </button>
                  </>
                ) : null}
              </div>
              {canExportPdf ? (
                <div className="flex justify-end">
                  <ReportingPeriodPicker
                    weekStartDay={weekStartDay}
                    overrideStart={weeklyOverrideStart}
                    onChange={setWeeklyOverrideStart}
                  />
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total tasks" value={displayedTotalTaskCount} />
                <StatCard label="Not started" value={filteredStatusCounts.notStarted} />
                <StatCard label="In progress" value={filteredStatusCounts.inProgress} />
                <StatCard label="Completed" value={filteredStatusCounts.completed} />
              </div>
            </div>
          </div>

        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "in-progress", "late", "at-risk", "critical-path", "completed"] as QuickViewFilter[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setQuickViewFilter(filter)}
                  className={`h-9 rounded-md px-3 text-body font-semibold transition ${
                    quickViewFilter === filter
                      ? "bg-navy text-slate-100"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {filter === "all"
                    ? "All"
                    : filter === "in-progress"
                      ? "In progress"
                      : filter === "late"
                        ? "Late"
                        : filter === "at-risk"
                          ? "At risk"
                          : filter === "critical-path"
                            ? "Critical path"
                          : "Completed"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <label className="text-body font-semibold text-ink">Resource:</label>
              <select
                value={resourceFilter}
                onChange={(event) => setResourceFilter(event.target.value)}
                className="h-9 min-w-[180px] rounded-md border border-slate-200 bg-white px-3 text-body text-ink outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
              >
                <option value="all">All</option>
                {resourceOptions.values.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["day", "week", "month"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`h-9 rounded-md px-3 text-body font-semibold transition ${
                  viewMode === mode
                    ? "bg-cyan-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {renderViewLabel(mode)}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={splitRef}
          className="mt-6 flex h-[72vh] min-h-[640px] gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div
            className="min-w-0 shrink-0 h-full overflow-hidden bg-white"
            style={{ width: isMobilePortrait ? "100%" : leftPaneWidth }}
          >
            <TaskTable
              tasks={visibleTasks}
              expandedTaskIds={expandedTaskIds}
              onToggleTask={toggleTask}
              onToggleAll={toggleAll}
              hasChildrenTaskIds={hasChildrenTaskIds}
              highlightedTaskIds={highlightedTaskIds}
              onRowHeightsChange={setRowHeights}
              scrollContainerRef={(element) => {
                taskPaneRef.current = element;
              }}
              onScroll={handleTaskScroll}
              canExplainTask={canExplainTask}
              shareId={share.shareId}
            />
          </div>

          {!isMobilePortrait ? (
            <>
              <div
                className={`group relative z-10 w-px cursor-col-resize bg-slate-200 transition hover:bg-cyan-400 ${
                  isDraggingDivider ? "bg-cyan-400" : ""
                }`}
                onPointerDown={() => setIsDraggingDivider(true)}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize task table and Gantt chart"
              />

              <div className="min-w-0 flex-1 shrink-0 h-full overflow-hidden bg-white">
                <GanttChart
                  plan={plan}
                  tasks={visibleTasks}
                  viewMode={viewMode}
                  rowHeights={rowHeights}
                  highlightedTaskIds={highlightedTaskIds}
                  scrollContainerRef={(element) => {
                    ganttPaneRef.current = element;
                  }}
                  onScroll={handleGanttScroll}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
