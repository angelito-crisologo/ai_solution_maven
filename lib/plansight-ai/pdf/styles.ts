import { StyleSheet } from "@react-pdf/renderer";

/**
 * Brand tokens distilled to PDF-safe CSS. PlanSight's web brand uses Inter,
 * but registering web fonts in @react-pdf/renderer requires shipping ttf
 * files; Helvetica is the built-in default and reads close enough.
 *
 * Color values mirror the Tailwind tokens used on the site:
 *   navy           = #0B1220   (PlanSight primary dark)
 *   ink            = #0F172A   (slate-900 — body text on light bg)
 *   slate-700      = #334155   (secondary body text)
 *   slate-500      = #64748B   (muted)
 *   slate-200      = #E2E8F0   (hairline borders)
 *   slate-50       = #F8FAFC   (cards on light bg)
 *   cyan-700       = #0E7490   (accent on light bg)
 *   cyan-50        = #ECFEFF   (cyan tint)
 *   emerald-600    = #059669   (RAG green)
 *   amber-600      = #D97706   (RAG amber)
 *   red-600        = #DC2626   (RAG red)
 */
export const brand = {
  navy: "#0B1220",
  ink: "#0F172A",
  slate900: "#0F172A",
  slate700: "#334155",
  slate500: "#64748B",
  slate200: "#E2E8F0",
  slate100: "#F1F5F9",
  slate50: "#F8FAFC",
  cyan700: "#0E7490",
  cyan400: "#22D3EE",
  cyan50: "#ECFEFF",
  emerald600: "#059669",
  emerald50: "#ECFDF5",
  amber600: "#D97706",
  amber50: "#FFFBEB",
  red600: "#DC2626",
  red50: "#FEF2F2"
};

export const pdfStyles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    color: brand.ink,
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 40
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: brand.slate200,
    paddingBottom: 12,
    marginBottom: 18
  },
  brandWord: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    color: brand.navy
  },
  brandWordAccent: {
    color: brand.cyan700
  },
  brandTagline: {
    fontSize: 9,
    color: brand.slate500,
    marginTop: 2
  },
  metaRight: {
    alignItems: "flex-end"
  },
  metaLabel: {
    fontSize: 8,
    color: brand.slate500,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  metaValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: brand.ink,
    marginTop: 2
  },
  h1: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    color: brand.ink,
    marginBottom: 4
  },
  h2: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: brand.ink,
    marginTop: 16,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  body: {
    fontSize: 10,
    color: brand.slate700,
    lineHeight: 1.45
  },
  mono: {
    fontFamily: "Courier"
  },
  caption: {
    fontSize: 9,
    color: brand.slate500
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: brand.slate500
  },
  // Stat card row used for plan totals.
  statRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 6
  },
  statCard: {
    flex: 1,
    backgroundColor: brand.slate50,
    borderRadius: 6,
    padding: 10
  },
  statLabel: {
    fontSize: 8,
    color: brand.slate500,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  statValue: {
    fontFamily: "Courier-Bold",
    fontSize: 16,
    color: brand.ink,
    marginTop: 2
  },
  ragRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 8,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1
  },
  ragGreen: { borderColor: brand.emerald600, backgroundColor: brand.emerald50 },
  ragAmber: { borderColor: brand.amber600, backgroundColor: brand.amber50 },
  ragRed: { borderColor: brand.red600, backgroundColor: brand.red50 },
  ragDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  // Generic table layout used by the share-view task list.
  table: {
    borderWidth: 1,
    borderColor: brand.slate200,
    borderRadius: 6,
    marginTop: 8
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: brand.slate100,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: brand.slate700,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: brand.slate200
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: brand.slate200
  },
  tableRowSummary: {
    backgroundColor: brand.slate50,
    fontFamily: "Helvetica-Bold"
  },
  bullet: {
    flexDirection: "row",
    marginVertical: 2
  },
  bulletGlyph: {
    width: 10,
    fontSize: 10,
    color: brand.cyan700
  },
  bulletBody: {
    flex: 1,
    fontSize: 10,
    color: brand.slate700,
    lineHeight: 1.45
  }
});

export function ragStyleFor(rag: "green" | "amber" | "red") {
  if (rag === "red") return { row: pdfStyles.ragRed, dot: brand.red600, label: "Red" };
  if (rag === "amber") return { row: pdfStyles.ragAmber, dot: brand.amber600, label: "Amber" };
  return { row: pdfStyles.ragGreen, dot: brand.emerald600, label: "Green" };
}

export function formatPdfDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en", { year: "numeric", month: "short", day: "2-digit" });
}
