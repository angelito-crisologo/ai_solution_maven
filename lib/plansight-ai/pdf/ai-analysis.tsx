import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { AiAnalysis } from "../ai";
import type { Plan } from "../types";
import { brand, formatPdfDate, pdfStyles } from "./styles";

type Props = {
  plan: Plan;
  analysis: AiAnalysis;
};

export function AiAnalysisPdf({ plan, analysis }: Props) {
  return (
    <Document
      title={`${plan.title} — AI analysis`}
      author="PlanSight AI"
      creator="PlanSight AI"
    >
      <Page size="A4" style={pdfStyles.page} wrap>
        <View style={pdfStyles.header}>
          <View>
            <Text style={pdfStyles.brandWord}>
              Plan<Text style={pdfStyles.brandWordAccent}>Sight</Text> AI
            </Text>
            <Text style={pdfStyles.brandTagline}>AI Analysis</Text>
          </View>
          <View style={pdfStyles.metaRight}>
            <Text style={pdfStyles.metaLabel}>Generated</Text>
            <Text style={pdfStyles.metaValue}>
              {formatPdfDate(analysis.generatedAt)}
            </Text>
          </View>
        </View>

        <Text style={pdfStyles.h1}>{plan.title}</Text>
        <Text style={pdfStyles.caption}>
          {formatPdfDate(plan.startDate)} → {formatPdfDate(plan.finishDate)}
        </Text>

        <Text style={pdfStyles.h2}>Summary</Text>
        <Text style={pdfStyles.body}>{analysis.summary}</Text>

        {analysis.risks.length > 0 ? (
          <>
            <Text style={pdfStyles.h2}>Risks</Text>
            {analysis.risks.map((risk, index) => (
              <View key={`risk-${index}`} style={{ marginBottom: 8 }} wrap={false}>
                <Text
                  style={{
                    fontFamily: "Helvetica-Bold",
                    fontSize: 11,
                    color: brand.ink
                  }}
                >
                  {risk.title}
                </Text>
                <Text style={pdfStyles.body}>{risk.explanation}</Text>
                {risk.taskIds.length > 0 ? (
                  <Text style={[pdfStyles.caption, pdfStyles.mono, { marginTop: 2 }]}>
                    Task IDs: {risk.taskIds.join(", ")}
                  </Text>
                ) : null}
              </View>
            ))}
          </>
        ) : null}

        {analysis.recommendations.length > 0 ? (
          <>
            <Text style={pdfStyles.h2}>Recommendations</Text>
            {analysis.recommendations.map((rec, index) => (
              <View key={`rec-${index}`} style={pdfStyles.bullet} wrap={false}>
                <Text style={pdfStyles.bulletGlyph}>•</Text>
                <View style={pdfStyles.bulletBody}>
                  <Text style={{ fontFamily: "Helvetica-Bold", color: brand.ink }}>
                    {rec.action}
                  </Text>
                  <Text style={{ color: brand.slate700 }}>{rec.rationale}</Text>
                </View>
              </View>
            ))}
          </>
        ) : null}

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
