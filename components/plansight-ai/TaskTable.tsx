"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { TaskNode } from "./plansight-utils";
import { parsePlanDate, PLAN_TABLE_HEADER_HEIGHT, PLAN_TABLE_ROW_HEIGHT } from "./plansight-utils";
type Props = {
  tasks: TaskNode[];
  expandedTaskIds: Set<number>;
  onToggleTask: (taskId: number) => void;
  onToggleAll: () => void;
  hasChildrenTaskIds: Set<number>;
  highlightedTaskIds?: Set<number>;
  onRowHeightsChange?: (heights: number[]) => void;
  scrollContainerRef?: (element: HTMLDivElement | null) => void;
  onScroll?: (event: UIEvent<HTMLDivElement>) => void;
};

type ResizeState = {
  index: number;
  startX: number;
  startWidth: number;
} | null;

const DEFAULT_COLUMN_WIDTHS = [56, 290, 120, 120, 96, 96, 150, 170, 220];
const MIN_COLUMN_WIDTH = 48;

function formatPercent(value: number | null) {
  if (value == null) return "—";
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function formatDuration(value: string | null) {
  return value ?? "—";
}

function formatTaskDate(value: string | null) {
  const date = parsePlanDate(value);
  if (!date) return "Not set";

  const day = String(date.getDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat("en", { month: "short" }).format(date);
  const year = String(date.getFullYear()).slice(-2);
  return `${day} ${month} ${year}`;
}

function formatPredecessors(task: TaskNode) {
  if (!task.predecessors.length) return "—";

  function formatRelation(type: string | null) {
    const normalized = (type ?? "").trim().toUpperCase();

    if (normalized === "FS" || normalized === "FINISH_START") return "FS";
    if (normalized === "SS" || normalized === "START_START") return "SS";
    if (normalized === "FF" || normalized === "FINISH_FINISH") return "FF";
    if (normalized === "SF" || normalized === "START_FINISH") return "SF";
    return normalized || "FS";
  }

  function formatLag(lag: string | null) {
    if (!lag) return "";
    const normalized = lag.trim();
    const compact = normalized.replace(/^([+-])/, "");
    const numeric = Number.parseFloat(compact);

    if (!Number.isNaN(numeric) && numeric === 0) {
      return "";
    }

    return normalized.startsWith("-") || normalized.startsWith("+") ? normalized : `+${normalized}`;
  }

  return task.predecessors
    .map((dependency) => {
      const id = dependency.predecessorTaskId ?? "—";
      const type = formatRelation(dependency.type);
      const lag = formatLag(dependency.lag);
      return `${id}${type}${lag}`;
    })
    .join(", ");
}

export function TaskTable({
  tasks,
  expandedTaskIds,
  onToggleTask,
  onToggleAll,
  hasChildrenTaskIds,
  highlightedTaskIds,
  onRowHeightsChange,
  scrollContainerRef,
  onScroll
}: Props) {
  const [columnWidths, setColumnWidths] = useState<number[]>(DEFAULT_COLUMN_WIDTHS);
  const [resizeState, setResizeState] = useState<ResizeState>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastReportedHeights = useRef<number[]>([]);
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);
  const scrollLeftRef = useRef(0);

  const allExpanded = tasks.every((task) => !hasChildrenTaskIds.has(task.id) || expandedTaskIds.has(task.id));
  const gridTemplateColumns = useMemo(
    () => columnWidths.map((width) => `${width}px`).join(" "),
    [columnWidths]
  );
  const totalWidth = useMemo(
    () => columnWidths.reduce((sum, width) => sum + width, 0),
    [columnWidths]
  );

  useEffect(() => {
    if (!resizeState) return;

    const handlePointerMove = (event: PointerEvent) => {
      const delta = event.clientX - resizeState.startX;
      const nextWidth = Math.max(MIN_COLUMN_WIDTH, resizeState.startWidth + delta);

      setColumnWidths((current) =>
        current.map((width, index) => (index === resizeState.index ? nextWidth : width))
      );
    };

    const handlePointerUp = () => {
      setResizeState(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [resizeState]);

  useLayoutEffect(() => {
    const measureRows = () => {
      const nextHeights = tasks.map((_, index) => {
        const row = rowRefs.current[index];
        const measured = row?.getBoundingClientRect().height ?? PLAN_TABLE_ROW_HEIGHT;
        return Math.max(PLAN_TABLE_ROW_HEIGHT, Math.ceil(measured));
      });

      const previous = lastReportedHeights.current;
      const changed =
        nextHeights.length !== previous.length || nextHeights.some((height, index) => height !== previous[index]);

      if (changed) {
        lastReportedHeights.current = nextHeights;
        onRowHeightsChange?.(nextHeights);
      }
    };

    measureRows();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      measureRows();
    });

    rowRefs.current.forEach((row) => {
      if (row) observer.observe(row);
    });

    return () => observer.disconnect();
  }, [columnWidths, onRowHeightsChange, tasks]);

  useLayoutEffect(() => {
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

  function startResize(index: number, event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    setResizeState({
      index,
      startX: event.clientX,
      startWidth: columnWidths[index]
    });
  }

  return (
    <div className="flex h-full w-full max-w-full flex-col rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">Tasks</p>
          <p className="text-xs text-slate-500">Task ID, name, dates, duration, predecessors, resources, and notes</p>
        </div>
        <button
          type="button"
          onClick={onToggleAll}
          className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
        >
          {allExpanded ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div className="min-w-max border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-normal text-slate-500" style={{ width: totalWidth }}>
        <div
          className="grid h-full transition-transform"
          style={{ gridTemplateColumns, height: PLAN_TABLE_HEADER_HEIGHT, transform: `translateX(-${scrollLeft}px)` }}
        >
          {["ID", "Task", "Start", "Finish", "Duration", "% Complete", "Predecessors", "Resources", "Notes"].map((label, index) => {
            return (
              <div
                key={label}
                className="relative flex items-center overflow-hidden border-r border-slate-200 px-3 last:border-r-0"
              >
                <span className="truncate">{label}</span>
                {index < columnWidths.length - 1 ? (
                  <button
                    type="button"
                    aria-label={`Resize ${label} column`}
                    onPointerDown={(event) => startResize(index, event)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none"
                  >
                    <span className="absolute right-[3px] top-1/2 h-6 w-px -translate-y-1/2 bg-slate-300" />
                  </button>
                ) : null}
              </div>
            );
          })}
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
        <div className="min-w-max" style={{ width: totalWidth }}>
          {tasks.map((task, index) => {
          const hasChildren = hasChildrenTaskIds.has(task.id);
          const expanded = expandedTaskIds.has(task.id);
          const paddingLeft = 12 + task.depth * 20;
          const highlighted = highlightedTaskIds?.has(task.id) ?? false;

          return (
            <div
              key={task.id}
              ref={(element) => {
                rowRefs.current[index] = element;
              }}
              className={`grid border-b text-sm last:border-b-0 ${
                highlighted ? "border-secondary/30 bg-secondary/5" : "border-slate-100"
              }`}
              style={{ gridTemplateColumns, minHeight: PLAN_TABLE_ROW_HEIGHT }}
            >
              <div className="flex items-start overflow-hidden border-r border-slate-100 px-3 py-2 text-slate-500">
                <span className="whitespace-nowrap font-medium leading-5">{task.id}</span>
              </div>

              <div className="flex items-start overflow-hidden border-r border-slate-100 px-3 py-2">
                <div className="flex min-w-0 items-start gap-2" style={{ paddingLeft }}>
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => onToggleTask(task.id)}
                      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                      aria-label={expanded ? "Collapse task" : "Expand task"}
                    >
                      {expanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                  ) : (
                    <span className="inline-flex h-5 w-5 shrink-0" />
                  )}

                  <div className="min-w-0">
                    <div
                      className={`whitespace-normal break-words leading-5 font-medium ${
                        task.summary ? "text-dark" : "text-slate-700"
                      }`}
                    >
                      {task.name}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start overflow-hidden border-r border-slate-100 px-3 py-2 text-slate-600">
                <span className="whitespace-nowrap leading-5">{formatTaskDate(task.start)}</span>
              </div>
              <div className="flex items-start overflow-hidden border-r border-slate-100 px-3 py-2 text-slate-600">
                <span className="whitespace-nowrap leading-5">{formatTaskDate(task.finish)}</span>
              </div>
              <div className="flex items-start overflow-hidden border-r border-slate-100 px-3 py-2 text-slate-600">
                <span className="whitespace-nowrap leading-5">{formatDuration(task.duration)}</span>
              </div>
              <div className="flex items-start overflow-hidden border-r border-slate-100 px-3 py-2 text-slate-600">
                <span className="whitespace-nowrap leading-5">{formatPercent(task.percentComplete)}</span>
              </div>
              <div className="flex items-start overflow-hidden border-r border-slate-100 px-3 py-2 text-slate-600">
                <span className="whitespace-normal break-words leading-5">{formatPredecessors(task)}</span>
              </div>
              <div className="flex items-start overflow-hidden border-r border-slate-100 px-3 py-2 text-slate-600">
                <span className="whitespace-normal break-words leading-5">
                  {task.resourceNames.length > 0 ? task.resourceNames.join(", ") : ""}
                </span>
              </div>
              <div className="flex items-start overflow-hidden px-3 py-2 text-slate-600">
                <span className="whitespace-normal break-words leading-5">{task.notes ?? ""}</span>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
