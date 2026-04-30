"use client";

import { useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import type { Plan } from "@/lib/plansight-ai/types";
import type { TaskNode, ViewMode } from "./plansight-utils";
import {
  bucketWidth,
  daysBetween,
  enumerateBuckets,
  formatShortDate,
  getPlanDateRange,
  parsePlanDate,
  PLAN_GANTT_HEADER_HEIGHT,
  PLAN_GANTT_ROW_HEIGHT
} from "./plansight-utils";

type Props = {
  plan: Plan;
  tasks: TaskNode[];
  viewMode: ViewMode;
  rowHeights: number[];
  highlightedTaskIds?: Set<number>;
  scrollContainerRef?: (element: HTMLDivElement | null) => void;
  onScroll?: (event: UIEvent<HTMLDivElement>) => void;
};

function monthsBetween(start: Date, end: Date) {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

export function GanttChart({
  plan,
  tasks,
  viewMode,
  rowHeights,
  highlightedTaskIds,
  scrollContainerRef,
  onScroll
}: Props) {
  const { start, end } = useMemo(() => getPlanDateRange(plan), [plan]);
  const width = bucketWidth(viewMode);
  const buckets = useMemo(() => enumerateBuckets(start, end, viewMode), [start, end, viewMode]);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);
  const scrollLeftRef = useRef(0);
  const resolvedRowHeights = useMemo(
    () =>
      tasks.map((_, index) => {
        const height = rowHeights[index] ?? PLAN_GANTT_ROW_HEIGHT;
        return Math.max(PLAN_GANTT_ROW_HEIGHT, Math.ceil(height));
      }),
    [rowHeights, tasks]
  );
  const rowOffsets = useMemo(() => {
    const offsets: number[] = [];
    let current = 0;

    for (const height of resolvedRowHeights) {
      offsets.push(current);
      current += height;
    }

    return offsets;
  }, [resolvedRowHeights]);

  const chartTasks = useMemo(
    () =>
      tasks.map((task) => {
        const resolveTaskRange = (node: TaskNode): { start: Date | null; finish: Date | null } => {
          const taskStart = parsePlanDate(node.start);
          const taskFinish = parsePlanDate(node.finish);

          if (taskStart && taskFinish) {
            return { start: taskStart, finish: taskFinish };
          }

          let resolvedStart = taskStart;
          let resolvedFinish = taskFinish;

          for (const child of node.children) {
            const childRange = resolveTaskRange(child);
            if (childRange.start && (!resolvedStart || childRange.start < resolvedStart)) {
              resolvedStart = childRange.start;
            }
            if (childRange.finish && (!resolvedFinish || childRange.finish > resolvedFinish)) {
              resolvedFinish = childRange.finish;
            }
          }

          return { start: resolvedStart, finish: resolvedFinish };
        };

        const { start: taskStart, finish: taskFinish } = resolveTaskRange(task);

        if (!taskStart || !taskFinish) {
          return { task, left: null, barWidth: null };
        }

        let left = 0;
        let barWidth = 1;

        if (viewMode === "day") {
          left = Math.max(0, daysBetween(start, taskStart));
          barWidth = Math.max(1, daysBetween(taskStart, taskFinish) + 1);
        } else if (viewMode === "week") {
          left = Math.max(0, Math.floor(daysBetween(start, taskStart) / 7));
          barWidth = Math.max(1, Math.floor(daysBetween(taskStart, taskFinish) / 7) + 1);
        } else {
          left = Math.max(0, monthsBetween(start, taskStart));
          barWidth = Math.max(1, monthsBetween(taskStart, taskFinish) + 1);
        }

        return {
          task,
          left: left * width,
          barWidth: barWidth * width
        };
      }),
    [tasks, start, viewMode, width]
  );
  const taskLookup = useMemo(() => {
    const lookup = new Map<number, (typeof chartTasks)[number]>();

    for (const entry of chartTasks) {
      lookup.set(entry.task.id, entry);
    }

    return lookup;
  }, [chartTasks]);

  const connectors = useMemo(() => {
    const output: Array<{
      key: string;
      d: string;
    }> = [];

    tasks.forEach((task, index) => {
      const targetBar = chartTasks[index];
      if (!targetBar || targetBar.left === null || targetBar.barWidth === null) {
        return;
      }

      const targetRowTop = rowOffsets[index] ?? 0;
      const targetRowHeight = resolvedRowHeights[index] ?? PLAN_GANTT_ROW_HEIGHT;
      const targetY = targetRowTop + targetRowHeight / 2;

      for (const dependency of task.predecessors) {
        if (dependency.predecessorTaskId == null) continue;

        const sourceBar = taskLookup.get(dependency.predecessorTaskId);
        if (!sourceBar || sourceBar.left === null || sourceBar.barWidth === null) continue;

        const sourceIndex = tasks.findIndex((candidate) => candidate.id === dependency.predecessorTaskId);
        if (sourceIndex < 0) continue;

        const sourceRowTop = rowOffsets[sourceIndex] ?? 0;
        const sourceRowHeight = resolvedRowHeights[sourceIndex] ?? PLAN_GANTT_ROW_HEIGHT;
        const sourceY = sourceRowTop + sourceRowHeight / 2;

        const relation = (dependency.type ?? "").trim().toUpperCase();
        const sourceLeft = sourceBar.left;
        const sourceRight = sourceBar.left + sourceBar.barWidth;
        const targetLeft = targetBar.left;
        const targetRight = targetBar.left + targetBar.barWidth;

        let startX = sourceRight;
        let endX = targetLeft;

        if (relation === "SS" || relation === "START_START") {
          startX = sourceLeft;
          endX = targetLeft;
        } else if (relation === "FF" || relation === "FINISH_FINISH") {
          startX = sourceRight;
          endX = targetRight;
        } else if (relation === "SF" || relation === "START_FINISH") {
          startX = sourceLeft;
          endX = targetRight;
        }

        const elbowX = startX + Math.sign(endX - startX || 1) * 12;
        const elbowY = targetY;

        output.push({
          key: `${task.id}-${dependency.predecessorTaskId}-${relation}-${dependency.lag ?? ""}`,
          d: `M ${startX} ${sourceY} H ${elbowX} V ${elbowY} H ${endX}`
        });
      }
    });

    return output;
  }, [chartTasks, resolvedRowHeights, rowOffsets, tasks, taskLookup]);

  const totalWidth = buckets.length * width;
  const chartHeight = resolvedRowHeights.reduce((sum, height) => sum + height, 0);

  useEffect(() => {
    const element = scrollBodyRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const restoreScrollLeft = () => {
      element.scrollLeft = scrollLeftRef.current;
    };

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(restoreScrollLeft);
    });

    observer.observe(element);
    requestAnimationFrame(restoreScrollLeft);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex h-full w-full max-w-full flex-col rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-secondary">Gantt</p>
          <p className="text-xs text-slate-500">
            {formatShortDate(start.toISOString())} - {formatShortDate(end.toISOString())}
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
          {viewMode === "day" ? "Daily view" : viewMode === "week" ? "Weekly view" : "Monthly view"}
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-50" style={{ height: PLAN_GANTT_HEADER_HEIGHT }}>
        <div className="overflow-x-auto">
          <div className="relative min-w-max" style={{ width: totalWidth, height: PLAN_GANTT_HEADER_HEIGHT }}>
            <div
              className="flex h-full transition-transform"
              style={{ transform: `translateX(-${scrollLeft}px)` }}
            >
              {buckets.map((bucket) => (
                <div
                  key={bucket.toISOString()}
                  className="flex h-full items-center justify-center border-r border-slate-200 px-1 text-center text-[11px] font-semibold uppercase tracking-normal text-slate-500"
                  style={{ width, height: PLAN_GANTT_HEADER_HEIGHT }}
                >
                  {viewMode === "day" ? (
                    <span className="flex flex-col items-center leading-4">
                      <span className="whitespace-nowrap">
                        {new Intl.DateTimeFormat("en", { weekday: "short" }).format(bucket)}
                      </span>
                      <span className="whitespace-nowrap">
                        {new Intl.DateTimeFormat("en", { month: "2-digit", day: "2-digit" }).format(bucket)}
                      </span>
                    </span>
                  ) : viewMode === "week" ? (
                    <span className="whitespace-nowrap">
                      {`WE ${new Intl.DateTimeFormat("en", { month: "2-digit", day: "2-digit" }).format(
                        new Date(bucket.getTime() + 6 * 24 * 60 * 60 * 1000)
                      )}`}
                    </span>
                  ) : (
                    <span className="whitespace-nowrap">
                      {new Intl.DateTimeFormat("en", { month: "short", year: "2-digit" }).format(bucket)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={(element) => {
          scrollBodyRef.current = element;
          scrollContainerRef?.(element);
        }}
        onScroll={(event) => {
          scrollLeftRef.current = event.currentTarget.scrollLeft;
          setScrollLeft(event.currentTarget.scrollLeft);
          onScroll?.(event);
        }}
        className="flex-1 min-h-0 overflow-auto bg-white"
        style={{ overflowAnchor: "none" }}
      >
        <div className="min-w-max">
          <div className="relative" style={{ width: totalWidth, height: chartHeight }}>
            <div className="absolute inset-0 bg-white">
              {buckets.map((bucket, index) => (
                <div
                  key={bucket.toISOString()}
                  className="absolute top-0 h-full border-r border-slate-100"
                  style={{ left: index * width, width }}
                />
              ))}
            </div>

            <svg
              className="pointer-events-none absolute inset-0"
              width={totalWidth}
              height={chartHeight}
              viewBox={`0 0 ${totalWidth} ${chartHeight}`}
              aria-hidden="true"
            >
              <defs>
                <marker
                  id="plan-dependency-arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M 0 0 L 8 4 L 0 8 z" fill="#94a3b8" />
                </marker>
              </defs>
              {connectors.map((connector) => (
                <path
                  key={connector.key}
                  d={connector.d}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  markerEnd="url(#plan-dependency-arrow)"
                />
              ))}
            </svg>

            <div className="absolute inset-x-0 top-0">
              {tasks.map((task, index) => {
                const bar = chartTasks[index];
                const rowTop = rowOffsets[index] ?? 0;
                const rowHeight = resolvedRowHeights[index] ?? PLAN_GANTT_ROW_HEIGHT;
                const rowCenter = rowHeight / 2;
                const highlighted = highlightedTaskIds?.has(task.id) ?? false;
                const barColor =
                  (task.percentComplete ?? 0) >= 100
                    ? "bg-emerald-500"
                    : task.summary
                      ? "bg-primary"
                      : "bg-secondary";

                return (
                  <div
                    key={task.id}
                    className={`absolute left-0 right-0 box-border border-b ${
                      highlighted ? "border-secondary/40 bg-secondary/5" : "border-slate-100"
                    }`}
                    style={{ top: rowTop, height: rowHeight }}
                  >
                    {bar.left !== null && bar.barWidth !== null ? (
                      task.milestone ? (
                        <div
                          className={`absolute h-3.5 w-3.5 rotate-45 rounded-[2px] ${
                            highlighted ? "ring-2 ring-secondary/40 ring-offset-1 ring-offset-transparent" : ""
                          } ${barColor}`}
                          style={{
                            left: bar.left + bar.barWidth / 2 - 7,
                            top: rowCenter,
                            transform: "translateY(-50%) rotate(45deg)"
                          }}
                          title={task.name}
                        />
                      ) : (
                        <div
                          className={`absolute rounded-md ${barColor} ${
                            highlighted ? "ring-2 ring-secondary/40 ring-offset-1 ring-offset-transparent" : ""
                          }`}
                          style={{
                            left: bar.left,
                            top: rowCenter,
                            width: bar.barWidth,
                            height: task.summary ? 18 : 12,
                            transform: "translateY(-50%)"
                          }}
                          title={task.name}
                        >
                          <div
                            className="h-full rounded-md bg-white/25"
                            style={{ width: `${Math.max(0, Math.min(100, task.percentComplete ?? 0))}%` }}
                          />
                        </div>
                      )
                    ) : (
                      <div className="absolute left-0 flex h-full items-center text-xs text-slate-400">
                        No schedule dates
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
