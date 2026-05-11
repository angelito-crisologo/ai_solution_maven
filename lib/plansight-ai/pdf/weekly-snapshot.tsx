import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatPeriodLabel } from "../reporting-period";
import { formatPdfDate, reportPalette } from "./styles";
import type {
  AtRiskRow,
  ReportMilestone,
  ReportTask,
  SlippedTask,
  WeeklyReportData
} from "../weekly-report-data";

type Props = {
  data: WeeklyReportData;
  /** Optional 2-3 sentence Status Summary paragraph from Claude. */
  narrative?: string | null;
  /** ISO timestamp of when the PDF was generated (footer + provenance). */
  generatedAt: string;
};

/**
 * Stakeholder-facing Weekly Status Report. Layout mirrors
 * /branding/plansight-ai/plansight_weekly_snapshot_pdf_mockup.html with
 * the spec's renames applied: header eyebrow "WEEKLY STATUS REPORT",
 * AI section labeled "Status Summary," and the milestone columns
 * labeled "Milestones in the reporting period" / "Milestones coming up."
 */
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    color: reportPalette.pageInk,
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 44
  },
  // --- Header ------------------------------------------------------------
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 0.5,
    borderBottomColor: reportPalette.hairline,
    paddingBottom: 14
  },
  eyebrow: {
    fontSize: 9,
    color: reportPalette.mutedInk,
    letterSpacing: 0.6,
    marginBottom: 4
  },
  planTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    color: reportPalette.pageInk
  },
  subtitle: {
    fontSize: 10,
    color: reportPalette.mutedInk,
    marginTop: 4
  },
  ragWrap: {
    alignItems: "flex-end"
  },
  ragPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4
  },
  ragDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5
  },
  ragText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase"
  },
  ragCaption: {
    fontSize: 9,
    color: reportPalette.mutedInk,
    marginTop: 6,
    maxWidth: 180,
    textAlign: "right"
  },
  // --- Stat cards --------------------------------------------------------
  statRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 16
  },
  statCard: {
    flex: 1,
    backgroundColor: reportPalette.cardBg,
    borderRadius: 4,
    padding: 10
  },
  statLabel: {
    fontSize: 9,
    color: reportPalette.mutedInk,
    marginBottom: 2
  },
  statValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 15,
    color: reportPalette.pageInk
  },
  statHint: {
    fontSize: 9,
    color: reportPalette.faintInk,
    marginTop: 2
  },
  // --- Section heading ---------------------------------------------------
  sectionHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: reportPalette.pageInk,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 4
  },
  sectionWrap: {
    marginBottom: 16
  },
  // --- Status Summary block ---------------------------------------------
  statusSummary: {
    backgroundColor: reportPalette.cardBg,
    borderLeftWidth: 3,
    borderLeftColor: reportPalette.faintInk,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 4,
    marginBottom: 18
  },
  statusSummaryEyebrow: {
    fontSize: 9,
    color: reportPalette.mutedInk,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 6
  },
  statusSummaryBody: {
    fontSize: 11,
    lineHeight: 1.55,
    color: reportPalette.bodyInk
  },
  // --- Slipped / At-risk rows -------------------------------------------
  rowList: {
    flexDirection: "column",
    gap: 6
  },
  slipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: reportPalette.redPillBg,
    borderRadius: 4
  },
  slipBody: {
    flex: 1,
    minWidth: 0
  },
  slipTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: reportPalette.redPillText
  },
  slipCaption: {
    fontSize: 10,
    color: reportPalette.redPillSubtext,
    marginTop: 2
  },
  slipBadge: {
    marginLeft: 12,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: reportPalette.redPillText
  },
  riskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: reportPalette.amberPillBg,
    borderRadius: 4
  },
  riskTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: reportPalette.amberPillText
  },
  riskCaption: {
    fontSize: 10,
    color: reportPalette.amberPillText,
    marginTop: 2,
    opacity: 0.9
  },
  riskBadge: {
    marginLeft: 12,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: reportPalette.amberPillText
  },
  // --- Milestones grid --------------------------------------------------
  milestonesGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18
  },
  milestoneColumn: {
    flex: 1
  },
  milestoneRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 3
  },
  milestoneGlyph: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10
  },
  milestoneText: {
    flex: 1,
    fontSize: 10,
    color: reportPalette.bodyInk
  },
  milestoneTextMuted: {
    color: reportPalette.faintInk
  },
  emptyRow: {
    fontSize: 10,
    color: reportPalette.faintInk,
    fontStyle: "italic"
  },
  // --- Staleness banner -------------------------------------------------
  stalenessBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: reportPalette.amberPillBg,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginTop: 12
  },
  stalenessDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: reportPalette.amberPillDot
  },
  stalenessText: {
    flex: 1,
    fontSize: 10,
    color: reportPalette.amberPillText
  },
  // --- Footer ----------------------------------------------------------
  footer: {
    position: "absolute",
    bottom: 28,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: reportPalette.hairline
  },
  footerLeft: {
    fontSize: 9,
    color: reportPalette.faintInk
  },
  footerRight: {
    fontSize: 9,
    color: reportPalette.linkBlue
  }
});

function ragStyle(health: "green" | "amber" | "red") {
  if (health === "red") {
    return {
      pill: { backgroundColor: reportPalette.redPillBg },
      dot: { backgroundColor: reportPalette.redPillDot },
      text: { color: reportPalette.redPillText },
      label: "RED"
    };
  }
  if (health === "green") {
    return {
      pill: { backgroundColor: "#E5F1E5" },
      dot: { backgroundColor: reportPalette.greenAccent },
      text: { color: "#0B4E3D" },
      label: "GREEN"
    };
  }
  return {
    pill: { backgroundColor: reportPalette.amberPillBg },
    dot: { backgroundColor: reportPalette.amberPillDot },
    text: { color: reportPalette.amberPillText },
    label: "AMBER"
  };
}

function SlippedRow({ task }: { task: SlippedTask }) {
  return (
    <View style={styles.slipRow} wrap={false}>
      <View style={styles.slipBody}>
        <Text style={styles.slipTitle}>{task.name}</Text>
        {task.caption ? <Text style={styles.slipCaption}>{task.caption}</Text> : null}
      </View>
      <Text style={styles.slipBadge}>+{task.daysLate} day{task.daysLate === 1 ? "" : "s"}</Text>
    </View>
  );
}

function RiskRow({ task }: { task: AtRiskRow }) {
  return (
    <View style={styles.riskRow} wrap={false}>
      <View style={styles.slipBody}>
        <Text style={styles.riskTitle}>{task.name}</Text>
        {task.caption ? <Text style={styles.riskCaption}>{task.caption}</Text> : null}
      </View>
      {task.badge ? <Text style={styles.riskBadge}>{task.badge}</Text> : null}
    </View>
  );
}

function MilestoneCompletedRow({ milestone }: { milestone: ReportMilestone }) {
  const glyph = milestone.hit ? "✓" : "✗";
  const color = milestone.hit ? reportPalette.greenAccent : reportPalette.redAccent;
  return (
    <View style={styles.milestoneRow} wrap={false}>
      <Text style={[styles.milestoneGlyph, { color }]}>{glyph}</Text>
      <Text style={styles.milestoneText}>
        {milestone.name}
        {!milestone.hit ? (
          <Text style={styles.milestoneTextMuted}> (missed)</Text>
        ) : null}
      </Text>
    </View>
  );
}

function MilestoneUpcomingRow({ task }: { task: ReportTask }) {
  const day = task.finish
    ? new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(task.finish))
    : null;
  return (
    <View style={styles.milestoneRow} wrap={false}>
      <Text style={[styles.milestoneGlyph, { color: reportPalette.faintInk }]}>○</Text>
      <Text style={styles.milestoneText}>
        {task.name}
        {day ? <Text style={styles.milestoneTextMuted}> ({day})</Text> : null}
      </Text>
    </View>
  );
}

export function WeeklyReportPdf({ data, narrative, generatedAt }: Props) {
  const rag = ragStyle(data.health);
  const periodLabel = formatPeriodLabel(data.reportingPeriod);

  return (
    <Document
      title={`${data.plan.title} — Weekly Status Report`}
      author="PlanSight AI"
      creator="PlanSight AI"
    >
      <Page size="A4" style={styles.page} wrap>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>WEEKLY STATUS REPORT</Text>
            <Text style={styles.planTitle}>{data.plan.title}</Text>
            <Text style={styles.subtitle}>Week of {periodLabel}</Text>
          </View>
          <View style={styles.ragWrap}>
            <View style={[styles.ragPill, rag.pill]}>
              <View style={[styles.ragDot, rag.dot]} />
              <Text style={[styles.ragText, rag.text]}>{rag.label}</Text>
            </View>
            <Text style={styles.ragCaption}>{data.healthCaption}</Text>
          </View>
        </View>

        {/* Stat cards */}
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Complete</Text>
            <Text style={styles.statValue}>{data.counts.completePct}%</Text>
            <Text style={styles.statHint}>
              {data.counts.completed} of {data.counts.total}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>In progress</Text>
            <Text style={styles.statValue}>{data.counts.inProgress}</Text>
            <Text style={styles.statHint}>tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>At risk</Text>
            <Text style={[styles.statValue, { color: reportPalette.amberAccent }]}>
              {data.counts.atRisk}
            </Text>
            <Text style={styles.statHint}>tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Late</Text>
            <Text style={[styles.statValue, { color: reportPalette.redAccent }]}>
              {data.counts.late}
            </Text>
            <Text style={styles.statHint}>tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Next milestone</Text>
            <Text style={styles.statValue}>
              {data.nextMilestone ? `${data.nextMilestone.daysUntil}d` : "—"}
            </Text>
            <Text style={styles.statHint}>
              {data.nextMilestone ? data.nextMilestone.name : "None upcoming"}
            </Text>
          </View>
        </View>

        {/* Staleness banner */}
        {data.staleness.isStale ? (
          <View style={styles.stalenessBanner} wrap={false}>
            <View style={styles.stalenessDot} />
            <Text style={styles.stalenessText}>
              Plan last updated {data.staleness.daysOld} days ago. This report
              reflects plan state as of that date.
            </Text>
          </View>
        ) : null}

        {/* Status Summary */}
        {narrative ? (
          <View style={styles.statusSummary} wrap={false}>
            <Text style={styles.statusSummaryEyebrow}>Status Summary</Text>
            <Text style={styles.statusSummaryBody}>{narrative}</Text>
          </View>
        ) : null}

        {/* What slipped this week */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>What slipped this week</Text>
          {data.slippedTasks.length === 0 ? (
            <Text style={styles.emptyRow}>
              No tasks slipped during {periodLabel}.
            </Text>
          ) : (
            <View style={styles.rowList}>
              {data.slippedTasks.map((task) => (
                <SlippedRow key={task.id} task={task} />
              ))}
            </View>
          )}
        </View>

        {/* What's at risk */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>What&apos;s at risk</Text>
          {data.atRiskTasks.length === 0 ? (
            <Text style={styles.emptyRow}>No at-risk tasks flagged.</Text>
          ) : (
            <View style={styles.rowList}>
              {data.atRiskTasks.map((task) => (
                <RiskRow key={task.id} task={task} />
              ))}
            </View>
          )}
        </View>

        {/* Milestones grid */}
        <View style={styles.milestonesGrid}>
          <View style={styles.milestoneColumn}>
            <Text style={styles.sectionHeading}>
              Milestones in the reporting period
            </Text>
            {data.milestonesInPeriod.length === 0 ? (
              <Text style={styles.emptyRow}>
                No milestones scheduled within {periodLabel}.
              </Text>
            ) : (
              data.milestonesInPeriod.map((milestone) => (
                <MilestoneCompletedRow key={milestone.id} milestone={milestone} />
              ))
            )}
          </View>
          <View style={styles.milestoneColumn}>
            <Text style={styles.sectionHeading}>Milestones coming up</Text>
            {data.milestonesUpcoming.length === 0 ? (
              <Text style={styles.emptyRow}>
                No milestones scheduled for the current week.
              </Text>
            ) : (
              data.milestonesUpcoming.map((task) => (
                <MilestoneUpcomingRow key={task.id} task={task} />
              ))
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerLeft}>
            Generated by PlanSight AI · {formatPdfDate(generatedAt)}
          </Text>
          <Text style={styles.footerRight}>View full plan →</Text>
        </View>
      </Page>
    </Document>
  );
}
