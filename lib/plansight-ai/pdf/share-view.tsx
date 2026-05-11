import { Document, Page, Text, View } from "@react-pdf/renderer";
import { buildInsightsReport, summarizePlan } from "../analysis";
import type { Plan } from "../types";
import { brand, formatPdfDate, pdfStyles, ragStyleFor } from "./styles";

type Props = {
  plan: Plan;
};

const COLUMN_WIDTHS = {
  id: 36,
  name: "60%",
  start: 60,
  finish: 60,
  percent: 36
} as const;

const TASKS_PER_PAGE = 28;

function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export function ShareViewPdf({ plan }: Props) {
  const metrics = summarizePlan(plan);
  const report = buildInsightsReport(plan);
  const rag = ragStyleFor(report.summary.healthStatus);
  const generatedAt = new Date();

  // Skip the implicit project root and any zero-task synthetic rows; render
  // every real task so stakeholders see the same content as the share page.
  const visibleTasks = plan.tasks;
  const pages = chunk(visibleTasks, TASKS_PER_PAGE);
  const totalPages = Math.max(1, pages.length);

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
        <Page key={pageIndex} size="A4" style={pdfStyles.page} wrap={false}>
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
                    paddingHorizontal: 6,
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
                  {task.percentComplete == null ? "—" : `${Math.round(task.percentComplete)}%`}
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
