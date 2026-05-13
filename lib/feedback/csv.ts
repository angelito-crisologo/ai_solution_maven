import type { FeedbackRow } from "./queries";

// Columns chosen so the CSV is useful for triage in a spreadsheet
// without the message text dominating column width. Order roughly
// matches the visual card layout.
const COLUMNS: Array<keyof FeedbackRow> = [
  "id",
  "created_at",
  "feedback_type",
  "severity",
  "status",
  "subject",
  "message",
  "name",
  "email",
  "product",
  "page_path",
  "page_url",
  "source_context",
  "share_id",
  "plan_title",
  "steps_to_reproduce",
  "desired_outcome",
  "browser"
];

// RFC-4180-ish escaping: wrap in double quotes when the value contains a
// delimiter, a quote, or a line break; double up internal quotes. Excel
// and Google Sheets both parse this correctly.
function escapeField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "string" ? value : String(value);
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function feedbackRowsToCsv(rows: FeedbackRow[]): string {
  const lines = [COLUMNS.join(",")];
  for (const row of rows) {
    lines.push(COLUMNS.map((c) => escapeField(row[c])).join(","));
  }
  // CRLF line terminator — Excel on Windows is happier with it and every
  // other consumer accepts it.
  return lines.join("\r\n");
}

export function csvFilenameForProduct(product: string): string {
  const slug = product
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `feedback-${slug}-${date}.csv`;
}
