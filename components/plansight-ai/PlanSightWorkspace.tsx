"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Plan, PlanMetrics } from "@/lib/plansight-ai/types";
import type { PlanInsight } from "@/lib/plansight-ai/analysis";
import type { SharePayload } from "@/lib/plansight-ai/share";
import { GanttChart } from "./GanttChart";
import { TaskTable } from "./TaskTable";
import { buildTaskTree, collectNodeIdsWithChildren, filterTaskTree, formatLongDate, ViewMode } from "./plansight-utils";

type Props = {
  plan: Plan;
  metrics: PlanMetrics;
  insights: PlanInsight[];
  share: SharePayload;
  highlightedTaskIds?: Set<number>;
  stakeholderName?: string;
  onStakeholderNameChange?: (value: string) => void;
  containerMaxWidthClassName?: string;
  outerSectionClassName?: string;
};

type TaskFilter = "all" | "my-tasks" | "milestones";
type TaskTreeNode = ReturnType<typeof buildTaskTree>[number];

const MY_TASK_OWNER = "Angelito Crisologo";

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function matchesOwner(taskOwnerNames: string[], stakeholderName?: string) {
  const normalizedStakeholderName = normalizeName(stakeholderName ?? MY_TASK_OWNER);
  if (!normalizedStakeholderName) return false;

  return taskOwnerNames.some((name) => {
    const normalizedName = normalizeName(name);
    return (
      normalizedName === normalizedStakeholderName ||
      normalizedName.includes(normalizedStakeholderName) ||
      normalizedStakeholderName.includes(normalizedName)
    );
  });
}

function matchesFilter(
  taskFilter: TaskFilter,
  taskOwnerNames: string[],
  milestone: boolean,
  stakeholderName?: string
) {
  if (taskFilter === "milestones") {
    return milestone;
  }

  if (taskFilter === "my-tasks") {
    return matchesOwner(taskOwnerNames, stakeholderName);
  }

  return true;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-dark">{value}</p>
    </div>
  );
}

function renderFilterLabel(filter: TaskFilter) {
  if (filter === "all") return "All Tasks";
  if (filter === "milestones") return "Milestones";
  return "My Tasks";
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

export function PlanSightWorkspace({
  plan,
  metrics,
  insights,
  share,
  highlightedTaskIds,
  stakeholderName,
  onStakeholderNameChange,
  containerMaxWidthClassName = "max-w-[1200px]",
  outerSectionClassName = "px-6 py-10"
}: Props) {
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<number>>(new Set());
  const [leftPaneWidth, setLeftPaneWidth] = useState(520);
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);
  const [rowHeights, setRowHeights] = useState<number[]>([]);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const taskPaneRef = useRef<HTMLDivElement | null>(null);
  const ganttPaneRef = useRef<HTMLDivElement | null>(null);
  const syncingScrollRef = useRef<"task" | "gantt" | null>(null);
  const [splitWidth, setSplitWidth] = useState(0);

  const taskTree = useMemo(() => buildTaskTree(plan.tasks), [plan.tasks]);
  const hasChildrenTaskIds = useMemo(() => collectNodeIdsWithChildren(taskTree), [taskTree]);

  useEffect(() => {
    setExpandedTaskIds(new Set(Array.from(hasChildrenTaskIds)));
  }, [hasChildrenTaskIds, plan.id]);

  const filteredTree = useMemo(() => {
    const predicate = (task: (typeof taskTree)[number]) =>
      matchesFilter(taskFilter, task.resourceNames, task.milestone, stakeholderName);

    return filterTaskTree(taskTree, predicate);
  }, [stakeholderName, taskFilter, taskTree]);

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
  const totalLeafTaskCount = useMemo(() => countLeafTasks(taskTree), [taskTree]);
  const displayedTotalTaskCount =
    taskFilter === "all" ? totalLeafTaskCount : filteredLeafTaskCount;

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

  return (
    <section className={outerSectionClassName}>
      <div className={`mx-auto w-full ${containerMaxWidthClassName}`}>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Imported plan
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-dark">{plan.title}</h2>
              <p className="mt-2 text-sm text-slate-500">
                {plan.sourceFormat.toUpperCase()} uploaded {formatLongDate(plan.importedAt)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {plan.startDate ? formatLongDate(plan.startDate) : "No start date"} to{" "}
                {plan.finishDate ? formatLongDate(plan.finishDate) : "No finish date"}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:ml-auto">
              <StatCard label="Total tasks" value={displayedTotalTaskCount} />
              <StatCard label="Completed" value={metrics.completedTasks} />
            </div>
          </div>

        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(
              onStakeholderNameChange
                ? (["all", "milestones", "my-tasks"] as TaskFilter[])
                : (["all", "milestones"] as TaskFilter[])
            ).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setTaskFilter(filter)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  taskFilter === filter
                    ? "bg-dark text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {renderFilterLabel(filter)}
              </button>
            ))}

            {onStakeholderNameChange ? (
              <>
                <input
                  type="text"
                  value={stakeholderName ?? ""}
                  onChange={(event) => onStakeholderNameChange(event.target.value)}
                  placeholder="Enter resource name"
                  className="min-w-[240px] rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-dark outline-none transition placeholder:text-slate-400 focus:border-primary"
                />
                <span className="max-w-[320px] text-xs leading-5 text-slate-500">
                  My Tasks filters to this name when selected in the plan view.
                </span>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {(["day", "week", "month"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  viewMode === mode
                    ? "bg-secondary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {renderViewLabel(mode)}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={splitRef}
          className="mt-6 flex h-[72vh] min-h-[640px] gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft"
        >
          <div className="min-w-0 shrink-0 h-full overflow-hidden bg-white" style={{ width: leftPaneWidth }}>
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
            />
          </div>

          <div
            className={`group relative z-10 w-3 cursor-col-resize border-x border-slate-200 bg-slate-100 transition hover:bg-primary/10 ${
              isDraggingDivider ? "bg-primary/15" : ""
            }`}
            onPointerDown={() => setIsDraggingDivider(true)}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize task table and Gantt chart"
          >
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-300 group-hover:bg-primary" />
          </div>

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
        </div>
      </div>
    </section>
  );
}
