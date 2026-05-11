import { Document, Page, Text, View } from "@react-pdf/renderer";
import { buildInsightsReport, summarizePlan } from "../analysis";
import type { Plan } from "../types";
import { brand, formatPdfDate, pdfStyles, ragStyleFor } from "./styles";

type Props = {
  plan: Plan;
  /** AI-generated narrative paragraph (1–3 sentences) commenting on the
   * week's slips and upcoming milestones. Optional — the rest of the
   * report renders even when narration fails. */
  narrative?: string | null;
  /** ISO date used as "today" so the report is reproducible. Defaults to
   * the moment of generation. */
  asOf?: string;
};

type MilestoneLite = {
  id: number;
  name: string;
  finish: string | null;
};

function startOfWeek(date: Date): Date {
  // Monday-anchored week.
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const start = new Date(date);
  start.setDate(date.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function isWithin(dateStr: string | null, from: Date, to: Date): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d >= from && d < to;
}

function pickMilestonesInRange(plan: Plan, from: Date, to: Date): MilestoneLite[] {
  return plan.tasks
    .filter((task) => task.milestone && isWithin(task.finish, from, to))
    .map((task) => ({ id: task.id, name: task.name, finish: task.finish }))
    .sort((a, b) => {
      const dateA = a.finish ? Date.parse(a.finish) : Infinity;
      const dateB = b.finish ? Date.parse(b.finish) : Infinity;
      return dateA - dateB;
    });
}

export function WeeklySnapshotPdf({ plan, narrative, asOf }: Props) {
  const metrics = summarizePlan(plan);
  const report = buildInsightsReport(plan);
  const rag = ragStyleFor(report.summary.healthStatus);

  const today = asOf ? new Date(asOf) : new Date();
  const thisWeekStart = startOfWeek(today);
  const nextWeekStart = addDays(thisWeekStart, 7);
  const nextWeekEnd = addDays(thisWeekStart, 14);

  const milestonesThisWeek = pickMilestonesInRange(plan, thisWeekStart, nextWeekStart);
  const milestonesNextWeek = pickMilestonesInRange(plan, nextWeekStart, nextWeekEnd);

  const lateTasks = report.insights.lateTasks.slice(0, 6);
  const atRiskTasks = report.insights.atRiskTasks.slice(0, 6);

  const weekLabel = `Week of ${formatPdfDate(thisWeekStart.toISOString())}`;

  return (
    <Document
      title={`${plan.title} — Weekly snapshot`}
      author="PlanSight AI"
      creator="PlanSight AI"
    >
      <Page size="A4" style={pdfStyles.page} wrap>
        <View style={pdfStyles.header}>
          <View>
            <Text style={pdfStyles.brandWord}>
              Plan<Text style={pdfStyles.brandWordAccent}>Sight</Text> AI
            </Text>
            <Text style={pdfStyles.brandTagline}>Weekly status snapshot</Text>
          </View>
          <View style={pdfStyles.metaRight}>
            <Text style={pdfStyles.metaLabel}>Generated</Text>
            <Text style={pdfStyles.metaValue}>{formatPdfDate(today.toISOString())}</Text>
          </View>
        </View>

        <Text style={pdfStyles.h1}>{plan.title}</Text>
        <Text style={pdfStyles.caption}>{weekLabel}</Text>

        <View style={[pdfStyles.ragRow, rag.row]}>
          <View style={[pdfStyles.ragDot, { backgroundColor: rag.dot }]} />
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: 12,
              color: rag.dot
            }}
          >
            Project health: {rag.label}
          </Text>
          <Text style={{ marginLeft: 10, fontSize: 9, color: brand.slate700 }}>
            {report.summary.lateTasks} late · {report.summary.atRiskTasks} at risk ·{" "}
            {report.summary.criticalTasks} on critical path
          </Text>
        </View>

        {narrative ? (
          <>
            <Text style={pdfStyles.h2}>What this means</Text>
            <Text style={pdfStyles.body}>{narrative}</Text>
          </>
        ) : null}

        <Text style={pdfStyles.h2}>Late tasks</Text>
        {lateTasks.length === 0 ? (
          <Text style={pdfStyles.body}>No late tasks. Plan is on schedule.</Text>
        ) : (
          lateTasks.map((task) => (
            <View key={task.id} style={pdfStyles.bullet} wrap={false}>
              <Text style={pdfStyles.bulletGlyph}>•</Text>
              <View style={pdfStyles.bulletBody}>
                <Text style={{ color: brand.ink }}>
                  <Text style={[pdfStyles.mono, { color: brand.slate500 }]}>
                    {task.id}
                  </Text>{" "}
                  · {task.name}
                </Text>
                <Text style={pdfStyles.caption}>
                  Finish was {formatPdfDate(task.finish)}
                  {typeof task.daysLate === "number"
                    ? ` · ${task.daysLate} day${task.daysLate === 1 ? "" : "s"} late`
                    : ""}
                </Text>
              </View>
            </View>
          ))
        )}

        <Text style={pdfStyles.h2}>At risk</Text>
        {atRiskTasks.length === 0 ? (
          <Text style={pdfStyles.body}>No at-risk tasks flagged.</Text>
        ) : (
          atRiskTasks.map((task) => (
            <View key={task.id} style={pdfStyles.bullet} wrap={false}>
              <Text style={pdfStyles.bulletGlyph}>•</Text>
              <View style={pdfStyles.bulletBody}>
                <Text style={{ color: brand.ink }}>
                  <Text style={[pdfStyles.mono, { color: brand.slate500 }]}>
                    {task.id}
                  </Text>{" "}
                  · {task.name}
                </Text>
                <Text style={pdfStyles.caption}>
                  Finish {formatPdfDate(task.finish)}
                </Text>
              </View>
            </View>
          ))
        )}

        <Text style={pdfStyles.h2}>Milestones this week</Text>
        {milestonesThisWeek.length === 0 ? (
          <Text style={pdfStyles.body}>No milestones land this week.</Text>
        ) : (
          milestonesThisWeek.map((milestone) => (
            <View key={milestone.id} style={pdfStyles.bullet} wrap={false}>
              <Text style={pdfStyles.bulletGlyph}>•</Text>
              <View style={pdfStyles.bulletBody}>
                <Text style={{ color: brand.ink }}>
                  <Text style={[pdfStyles.mono, { color: brand.slate500 }]}>
                    {milestone.id}
                  </Text>{" "}
                  · {milestone.name}
                </Text>
                <Text style={pdfStyles.caption}>{formatPdfDate(milestone.finish)}</Text>
              </View>
            </View>
          ))
        )}

        <Text style={pdfStyles.h2}>Milestones next week</Text>
        {milestonesNextWeek.length === 0 ? (
          <Text style={pdfStyles.body}>No milestones scheduled for next week.</Text>
        ) : (
          milestonesNextWeek.map((milestone) => (
            <View key={milestone.id} style={pdfStyles.bullet} wrap={false}>
              <Text style={pdfStyles.bulletGlyph}>•</Text>
              <View style={pdfStyles.bulletBody}>
                <Text style={{ color: brand.ink }}>
                  <Text style={[pdfStyles.mono, { color: brand.slate500 }]}>
                    {milestone.id}
                  </Text>{" "}
                  · {milestone.name}
                </Text>
                <Text style={pdfStyles.caption}>{formatPdfDate(milestone.finish)}</Text>
              </View>
            </View>
          ))
        )}

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
        </View>

        <View style={pdfStyles.footer} fixed>
          <Text>Built on PlanSight AI</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
