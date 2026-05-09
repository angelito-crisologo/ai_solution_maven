import ExcelJS from "exceljs";
import type { Plan, PlanTask } from "./types";
import { summarizePlan } from "./analysis";
import type { PlanInsightsReport } from "./analysis";

type ExportTaskNode = PlanTask & {
  depth: number;
  children: ExportTaskNode[];
};

const COLOR_HEADER_FILL = "FF1F2937";
const COLOR_HEADER_TEXT = "FFFFFFFF";
const COLOR_SUMMARY_FILL = "FFF8FAFC";
const COLOR_TASK_FILL = "FFFFFFFF";
const COLOR_BORDER = "FFE2E8F0";
const COLOR_HEADER_BORDER = "FF334155";
const COLOR_TEXT_DARK = "FF0F172A";
const COLOR_TEXT_MUTED = "FF475569";
const COLOR_CARD_FILL = "FFF8FAFC";
const COLOR_CARD_BORDER = "FFD5DCE5";

function formatTaskDate(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  // Spec: dd mmm yy (e.g. "08 May 26").
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit"
  }).format(date);
}

function formatLongDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatPredecessor(task: PlanTask) {
  if (!task.predecessors.length) return "";

  const relationType = (type: string | null) => {
    const normalized = (type ?? "").trim().toUpperCase();
    if (normalized === "FS" || normalized === "FINISH_START") return "FS";
    if (normalized === "SS" || normalized === "START_START") return "SS";
    if (normalized === "FF" || normalized === "FINISH_FINISH") return "FF";
    if (normalized === "SF" || normalized === "START_FINISH") return "SF";
    return normalized || "FS";
  };

  const formatLag = (lag: string | null) => {
    if (!lag) return "";
    const normalized = lag.trim();
    const compact = normalized.replace(/^([+-])/, "");
    const numeric = Number.parseFloat(compact);

    if (!Number.isNaN(numeric) && numeric === 0) {
      return "";
    }

    return normalized.startsWith("-") || normalized.startsWith("+") ? normalized : `+${normalized}`;
  };

  return task.predecessors
    .map(
      (dependency) =>
        `${dependency.predecessorTaskId ?? ""}${relationType(dependency.type)}${formatLag(dependency.lag)}`
    )
    .filter(Boolean)
    .join(", ");
}

function sortTasks(tasks: PlanTask[]) {
  return [...tasks].sort((a, b) => {
    const outlineCompare = (a.outlineNumber ?? "").localeCompare(b.outlineNumber ?? "", undefined, {
      numeric: true
    });
    if (outlineCompare !== 0) return outlineCompare;
    return a.id - b.id;
  });
}

function buildTree(tasks: PlanTask[]) {
  const byParent = new Map<number | null, PlanTask[]>();

  for (const task of tasks) {
    const bucket = byParent.get(task.parentId) ?? [];
    bucket.push(task);
    byParent.set(task.parentId, bucket);
  }

  const visit = (parentId: number | null, depth: number): ExportTaskNode[] => {
    return sortTasks(byParent.get(parentId) ?? []).map((task) => ({
      ...task,
      depth,
      children: visit(task.id, depth + 1)
    }));
  };

  return visit(null, 0);
}

function flattenTree(nodes: ExportTaskNode[]) {
  const output: ExportTaskNode[] = [];

  const visit = (node: ExportTaskNode) => {
    output.push(node);
    node.children.forEach(visit);
  };

  nodes.forEach(visit);
  return output;
}

function sanitizeFileName(value: string) {
  return (
    value
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .replace(/\.+$/g, "")
      .slice(0, 120) || "plansight-plan"
  );
}

type SummaryCard = {
  label: string;
  value: string;
};

function buildSummaryCards(plan: Plan, analysis: PlanInsightsReport): SummaryCard[] {
  const metrics = summarizePlan(plan);
  const isApproximate = analysis.mode === "approximate";

  return [
    { label: "Plan", value: plan.title },
    { label: "Start", value: formatLongDate(plan.startDate) },
    { label: "Finish", value: formatLongDate(plan.finishDate) },
    { label: "Total tasks", value: String(metrics.totalTasks) },
    { label: "Not started", value: String(metrics.notStartedTasks) },
    { label: "In progress", value: String(metrics.inProgressTasks) },
    { label: "Completed", value: String(metrics.completedTasks) },
    { label: "Late", value: String(analysis.summary.lateTasks) },
    { label: "At risk", value: String(analysis.summary.atRiskTasks) },
    {
      label: isApproximate ? "Potential critical" : "Critical",
      value: String(analysis.summary.criticalTasks)
    }
  ];
}

function applyCardStyle(cell: ExcelJS.Cell, fill: string) {
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: fill }
  };
  cell.border = {
    top: { style: "thin", color: { argb: COLOR_CARD_BORDER } },
    left: { style: "thin", color: { argb: COLOR_CARD_BORDER } },
    bottom: { style: "thin", color: { argb: COLOR_CARD_BORDER } },
    right: { style: "thin", color: { argb: COLOR_CARD_BORDER } }
  };
  cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
}

/**
 * Render the summary block at the top of the sheet.
 *
 * Layout: 5 columns × 2 rows of cards, each card spanning ~2 cells wide,
 * with the label and value stacked. Uses rows 5–8 of the sheet.
 *
 * Returns the row index where the next content (header row) should start.
 */
function writeSummaryBlock(
  worksheet: ExcelJS.Worksheet,
  cards: SummaryCard[],
  startRow: number
) {
  const cardsPerRow = 5;
  const cardWidthInCols = 2; // each card spans 2 columns of the 9-col data table

  let row = startRow;
  for (let i = 0; i < cards.length; i += cardsPerRow) {
    const slice = cards.slice(i, i + cardsPerRow);

    slice.forEach((card, colIndex) => {
      const startCol = 1 + colIndex * cardWidthInCols;
      const endCol = startCol + cardWidthInCols - 1;
      const range = `${worksheet.getCell(row, startCol).address}:${worksheet.getCell(row, endCol).address}`;

      worksheet.mergeCells(range);
      const cell = worksheet.getCell(row, startCol);
      cell.value = `${card.label}\n${card.value}`;
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: COLOR_TEXT_DARK } };
      applyCardStyle(cell, COLOR_CARD_FILL);
    });

    worksheet.getRow(row).height = 36;
    row += 1;
  }

  return row;
}

export async function buildPlanWorkbook(plan: Plan, analysis: PlanInsightsReport) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AI Solution Maven";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.properties.date1904 = false;

  const worksheet = workbook.addWorksheet("PlanSight");

  worksheet.columns = [
    { width: 10 }, // Task ID
    { width: 36 }, // Task Name
    { width: 14 }, // Start
    { width: 14 }, // Finish
    { width: 12 }, // Duration
    { width: 12 }, // % Complete
    { width: 22 }, // Predecessors
    { width: 28 }, // Resources
    { width: 28 } // Notes
  ];

  // --- Title block ---
  worksheet.mergeCells("A1:I1");
  const headerCell = worksheet.getCell("A1");
  headerCell.value = "Exported from PlanSight AI powered by AI Solution Maven";
  headerCell.font = { name: "Calibri", size: 12, italic: true, color: { argb: COLOR_TEXT_MUTED } };
  headerCell.alignment = { vertical: "middle", horizontal: "left" };
  worksheet.getRow(1).height = 20;

  worksheet.mergeCells("A2:I2");
  const titleCell = worksheet.getCell("A2");
  titleCell.value = plan.title;
  titleCell.font = { name: "Calibri", size: 20, bold: true, color: { argb: COLOR_TEXT_DARK } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  worksheet.getRow(2).height = 28;

  worksheet.mergeCells("A3:I3");
  const dateRangeCell = worksheet.getCell("A3");
  dateRangeCell.value = `From ${formatLongDate(plan.startDate)} to ${formatLongDate(plan.finishDate)}`;
  dateRangeCell.font = { name: "Calibri", size: 12, color: { argb: COLOR_TEXT_MUTED } };
  dateRangeCell.alignment = { vertical: "middle", horizontal: "left" };

  worksheet.mergeCells("A4:I4");
  const noteCell = worksheet.getCell("A4");
  noteCell.value =
    analysis.mode === "approximate"
      ? "Limited analysis mode: task dependencies were not available, so impact analysis is approximate."
      : "Imported plan summary generated from the current PlanSight analysis.";
  noteCell.font = { name: "Calibri", size: 11, italic: true, color: { argb: COLOR_TEXT_MUTED } };
  noteCell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  worksheet.getRow(4).height = 20;

  // --- Summary block (cards at top) ---
  const summaryCards = buildSummaryCards(plan, analysis);
  const headerRowIndex = writeSummaryBlock(worksheet, summaryCards, 5);

  // Spacer row before the data table.
  worksheet.getRow(headerRowIndex).height = 8;
  const dataHeaderRow = headerRowIndex + 1;

  // --- Frozen header row + data table ---
  worksheet.views = [{ state: "frozen", ySplit: dataHeaderRow, activeCell: `A${dataHeaderRow + 1}` }];
  worksheet.properties.outlineLevelRow = 7;
  worksheet.properties.outlineProperties = { summaryBelow: false, summaryRight: false };

  const headerRow = worksheet.getRow(dataHeaderRow);
  headerRow.values = [
    "Task ID",
    "Task Name",
    "Start",
    "Finish",
    "Duration",
    "% Complete",
    "Predecessors",
    "Resources",
    "Notes"
  ];
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Calibri", size: 12, bold: true, color: { argb: COLOR_HEADER_TEXT } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLOR_HEADER_FILL }
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      top: { style: "thin", color: { argb: COLOR_HEADER_BORDER } },
      left: { style: "thin", color: { argb: COLOR_HEADER_BORDER } },
      bottom: { style: "thin", color: { argb: COLOR_HEADER_BORDER } },
      right: { style: "thin", color: { argb: COLOR_HEADER_BORDER } }
    };
  });

  // --- Task rows ---
  const rows = flattenTree(buildTree(plan.tasks));
  let rowIndex = dataHeaderRow + 1;

  for (const task of rows) {
    const row = worksheet.getRow(rowIndex);
    row.height = 20;

    row.values = [
      task.id,
      task.name,
      formatTaskDate(task.start),
      formatTaskDate(task.finish),
      task.duration ?? "",
      task.percentComplete == null
        ? ""
        : Math.max(0, Math.min(100, Math.round(task.percentComplete))),
      formatPredecessor(task),
      task.resourceNames.length > 0 ? task.resourceNames.join(", ") : "",
      task.notes ?? ""
    ];

    const isSummary = task.summary;
    const indent = Math.min(7, Math.max(0, task.depth));

    row.eachCell((cell, colNumber) => {
      const isNameColumn = colNumber === 2;
      const isPercentColumn = colNumber === 6;

      cell.font = {
        name: "Calibri",
        size: 11,
        bold: isSummary,
        color: { argb: COLOR_TEXT_DARK }
      };
      cell.alignment = {
        vertical: "top",
        horizontal: isNameColumn ? "left" : isPercentColumn ? "right" : "left",
        wrapText: true,
        indent: isNameColumn ? indent : 0
      };
      cell.border = {
        top: { style: "thin", color: { argb: COLOR_BORDER } },
        left: { style: "thin", color: { argb: COLOR_BORDER } },
        bottom: { style: "thin", color: { argb: COLOR_BORDER } },
        right: { style: "thin", color: { argb: COLOR_BORDER } }
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isSummary ? COLOR_SUMMARY_FILL : COLOR_TASK_FILL }
      };
    });

    row.outlineLevel = indent;
    rowIndex += 1;
  }

  return workbook;
}

export function getPlanWorkbookFileName(title: string) {
  return `${sanitizeFileName(title)}.xlsx`;
}
