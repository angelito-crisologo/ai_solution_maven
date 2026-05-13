import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type FeedbackRow = {
  id: number;
  feedback_type: "general_feedback" | "feature_request" | "bug_report";
  subject: string;
  message: string;
  name: string | null;
  email: string | null;
  product: string;
  page_path: string | null;
  page_url: string | null;
  source_context: string | null;
  share_id: string | null;
  plan_title: string | null;
  severity: "low" | "medium" | "high" | "critical" | null;
  steps_to_reproduce: string | null;
  desired_outcome: string | null;
  browser: string | null;
  status: string;
  created_at: string;
};

export type FeedbackTypeFilter =
  | "general_feedback"
  | "feature_request"
  | "bug_report";

export type FeedbackSeverityFilter = "low" | "medium" | "high" | "critical";

export type FeedbackStatusFilter = string;

export type FeedbackFilter = {
  type?: FeedbackTypeFilter;
  severity?: FeedbackSeverityFilter;
  status?: FeedbackStatusFilter;
};

export const FEEDBACK_TYPES: FeedbackTypeFilter[] = [
  "general_feedback",
  "feature_request",
  "bug_report"
];

export const FEEDBACK_SEVERITIES: FeedbackSeverityFilter[] = [
  "low",
  "medium",
  "high",
  "critical"
];

// Newest-first window read for the admin feedback surfaces. Caps the row
// count to bound page weight; if the operator ever needs older rows,
// they belong in a paginated view, not the admin one-pager. The CSV
// export uses a higher cap on the same query.
export async function listFeedbackForProduct(
  product: string,
  filter: FeedbackFilter = {},
  limit = 100
): Promise<FeedbackRow[]> {
  const client = createSupabaseServiceClient();
  if (!client) return [];

  let query = client
    .from("feedback_submissions")
    .select(
      "id, feedback_type, subject, message, name, email, product, page_path, page_url, source_context, share_id, plan_title, severity, steps_to_reproduce, desired_outcome, browser, status, created_at"
    )
    .eq("product", product);

  if (filter.type) query = query.eq("feedback_type", filter.type);
  if (filter.severity) query = query.eq("severity", filter.severity);
  if (filter.status) query = query.eq("status", filter.status);

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[feedback-queries] read failed:", error.message);
    return [];
  }
  return (data ?? []) as FeedbackRow[];
}

export function isFeedbackType(value: unknown): value is FeedbackTypeFilter {
  return (
    value === "general_feedback" ||
    value === "feature_request" ||
    value === "bug_report"
  );
}

export function isFeedbackSeverity(
  value: unknown
): value is FeedbackSeverityFilter {
  return (
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "critical"
  );
}

export function parseFeedbackFilter(
  searchParams: Record<string, string | string[] | undefined>
): FeedbackFilter {
  const pick = (key: string) => {
    const v = searchParams[key];
    if (Array.isArray(v)) return v[0];
    return v;
  };
  const filter: FeedbackFilter = {};
  const t = pick("type");
  if (isFeedbackType(t)) filter.type = t;
  const s = pick("severity");
  if (isFeedbackSeverity(s)) filter.severity = s;
  const st = pick("status");
  if (st && typeof st === "string" && st.length > 0) filter.status = st;
  return filter;
}
