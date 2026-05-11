import { Document, Page, Text, View } from "@react-pdf/renderer";
import { buildInsightsReport, summarizePlan } from "../analysis";
import type { Plan, PlanTask } from "../types";
import { brand, formatPdfDate, pdfStyles, ragStyleFor } from "./styles";

type Props = {
  plan: Plan;
};

/**
 * Landscape A4. Columns mirror the on-screen task table layout the PM
 * already knows. Sized so the Task column gets the most room while the
 * date/percent columns stay compact and monospaced for visual alignment.
 */
const COLUMN_WIDTHS = {
  id: 32,
  name: 240,
  start: 64,
  finish: 64,
  percent: 52,
  resource: 130,
  notes: 180
} as const;

/** Landscape A4 leaves less vertical room than portrait; cap rows
 * conservatively so wrapped notes / resource lists never overflow. */
const TASKS_PER_PAGE = 18;

const LANDSCAPE_PAGE = {
  // Tighter vertical padding than the default portrait template (the
  // share-view PDF is the only landscape doc; everything else uses the
  // shared pdfStyles.page defaults).
  paddingTop: 28,
  paddingBottom: 40,
  paddingHorizontal: 36
};

function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

// Width (in PDF points) of one outline-level step. 8pt is roughly two
// character widths at 10pt Helvetica, which matches the spec's "indent
// each contained task by 2 character spaces from parent." We apply this
// as paddingLeft rather than literal whitespace in <Text> because
// React-PDF collapses leading spaces during text shaping.
const INDENT_STEP_PT = 8;

function indentPtForOutline(task: PlanTask, baseLevel: number): number {
  const depth = Math.max(0, task.outlineLevel - baseLevel);
  return depth * INDENT_STEP_PT;
}

function formatResource(task: PlanTask): string {
  if (!task.resourceNames || task.resourceNames.length === 0) return "—";
  return task.resourceNames.join(", ");
}

function formatNotes(task: PlanTask): string {
  if (!task.notes) return "";
  return task.notes;
}

function formatPercent(task: PlanTask): string {
  if (task.percentComplete == null) return "—";
  return `${Math.round(task.percentComplete)}%`;
}

export function ShareViewPdf({ plan }: Props) {
  const metrics = summarizePlan(plan);
  const report = buildInsightsReport(plan);
  const rag = ragStyleFor(report.summary.healthStatus);
  const generatedAt = new Date();

  const visibleTasks = plan.tasks;
  const pages = chunk(visibleTasks, TASKS_PER_PAGE);
  const totalPages = Math.max(1, pages.length);

  // MPXJ-parsed plans sometimes start at outlineLevel 0, sometimes at 1
  // (when a synthetic project root is included). Normalize against the
  // observed minimum so the shallowest task always renders flush-left.
  const baseLevel = visibleTasks.reduce(
    (min, task) => Math.min(min, task.outlineLevel ?? 0),
    Number.POSITIVE_INFINITY
  );
  const normalizedBaseLevel = Number.isFinite(baseLevel) ? baseLevel : 0;

  const renderHeader = () => (
    <View style={pdfStyles.header}>
      <View>
        <Text style={pdfStyles.brandWord}>
          Plan<Text style={pdfStyles.brandWordAccent}>Sight</Text> AI
        </Text>
        <Text style={pdfStyles.brandTagline}>
          Your project plan, finally legible.
        </Text>
      </View>
      <View style={pdfStyles.metaRight}>
        <Text style={pdfStyles.metaLabel}>Generated</Text>
        <Text style={pdfStyles.metaValue}>{formatPdfDate(generatedAt.toISOString())}</Text>
      </View>
    </View>
  );

  const renderFooter = (pageNumber: number) => (
    <View style={pdfStyles.footer} fixed>
      <Text>Built on PlanSight AI</Text>
      <Text>
        Page {pageNumber} of {totalPages}
      </Text>
    </View>
  );

  return (
    <Document
      title={plan.title}
      author="PlanSight AI"
      creator="PlanSight AI"
    >
      {pages.map((tasks, pageIndex) => (
        <Page
          key={pageIndex}
          size="A4"
          orientation="landscape"
          style={[pdfStyles.page, LANDSCAPE_PAGE]}
          wrap={false}
        >
          {renderHeader()}

          {pageIndex === 0 ? (
            <>
              <Text style={pdfStyles.h1}>{plan.title}</Text>
              <Text style={pdfStyles.caption}>
                {formatPdfDate(plan.startDate)} → {formatPdfDate(plan.finishDate)}
              </Text>

              <View style={[pdfStyles.ragRow, rag.row]}>
                <View style={[pdfStyles.ragDot, { backgroundColor: rag.dot }]} />
                <Text
                  style={{
                    fontFamily: "Helvetica-Bold",
                    fontSize: 11,
                    color: rag.dot
                  }}
                >
                  Health: {rag.label}
                </Text>
                <Text style={{ marginLeft: 8, fontSize: 9, color: brand.slate700 }}>
                  {report.summary.lateTasks} late · {report.summary.atRiskTasks} at risk ·{" "}
                  {report.summary.criticalTasks} critical
                </Text>
              </View>

              <Text style={pdfStyles.h2}>Plan totals</Text>
              <View style={pdfStyles.statRow}>
                <View style={pdfStyles.statCard}>
                  <Text style={pdfStyles.statLabel}>Total</Text>
                  <Text style={pdfStyles.statValue}>{metrics.totalTasks}</Text>
                </View>
                <View style={pdfStyles.statCard}>
                  <Text style={pdfStyles.statLabel}>Completed</Text>
                  <Text style={pdfStyles.statValue}>{metrics.completedTasks}</Text>
                </View>
                <View style={pdfStyles.statCard}>
                  <Text style={pdfStyles.statLabel}>In progress</Text>
                  <Text style={pdfStyles.statValue}>{metrics.inProgressTasks}</Text>
                </View>
                <View style={pdfStyles.statCard}>
                  <Text style={pdfStyles.statLabel}>Not started</Text>
                  <Text style={pdfStyles.statValue}>{metrics.notStartedTasks}</Text>
                </View>
                <View style={pdfStyles.statCard}>
                  <Text style={pdfStyles.statLabel}>Milestones</Text>
                  <Text style={pdfStyles.statValue}>{metrics.milestoneTasks}</Text>
                </View>
              </View>
            </>
          ) : null}

          <Text style={pdfStyles.h2}>
            Tasks {pageIndex === 0 ? "" : `(continued, page ${pageIndex + 1})`}
          </Text>

          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={{ width: COLUMN_WIDTHS.id }}>ID</Text>
              <Text style={{ width: COLUMN_WIDTHS.name, paddingHorizontal: 6 }}>Task</Text>
              <Text style={{ width: COLUMN_WIDTHS.start }}>Start</Text>
              <Text style={{ width: COLUMN_WIDTHS.finish }}>Finish</Text>
              <Text style={{ width: COLUMN_WIDTHS.percent, textAlign: "right" }}>%</Text>
              <Text style={{ width: COLUMN_WIDTHS.resource, paddingHorizontal: 6 }}>Resource</Text>
              <Text style={{ width: COLUMN_WIDTHS.notes, paddingHorizontal: 6 }}>Notes</Text>
            </View>
            {tasks.map((task) => (
              <View
                key={task.id}
                style={[pdfStyles.tableRow, task.summary ? pdfStyles.tableRowSummary : {}]}
              >
                <Text
                  style={[pdfStyles.mono, { width: COLUMN_WIDTHS.id, color: brand.slate500 }]}
                >
                  {task.id}
                </Text>
                <Text
                  style={{
                    width: COLUMN_WIDTHS.name,
                    paddingTop: 0,
                    paddingBottom: 0,
                    paddingRight: 6,
                    paddingLeft: 6 + indentPtForOutline(task, normalizedBaseLevel),
                    color: task.summary ? brand.ink : brand.slate700
                  }}
                >
                  {task.name}
                </Text>
                <Text style={[pdfStyles.mono, { width: COLUMN_WIDTHS.start }]}>
                  {formatPdfDate(task.start)}
                </Text>
                <Text style={[pdfStyles.mono, { width: COLUMN_WIDTHS.finish }]}>
                  {formatPdfDate(task.finish)}
                </Text>
                <Text
                  style={[
                    pdfStyles.mono,
                    { width: COLUMN_WIDTHS.percent, textAlign: "right" }
                  ]}
                >
                  {formatPercent(task)}
                </Text>
                <Text
                  style={{
                    width: COLUMN_WIDTHS.resource,
                    paddingHorizontal: 6,
                    color: brand.slate700
                  }}
                >
                  {formatResource(task)}
                </Text>
                <Text
                  style={{
                    width: COLUMN_WIDTHS.notes,
                    paddingHorizontal: 6,
                    color: brand.slate700
                  }}
                >
                  {formatNotes(task)}
                </Text>
              </View>
            ))}
          </View>

          {renderFooter(pageIndex + 1)}
        </Page>
      ))}
    </Document>
  );
}
