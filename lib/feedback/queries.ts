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

// Newest-first window read for the admin feedback surfaces. Caps the row
// count to bound page weight; if the operator ever needs older rows,
// they belong in a paginated view, not the admin one-pager.
export async function listFeedbackForProduct(
  product: string,
  limit = 100
): Promise<FeedbackRow[]> {
  const client = createSupabaseServiceClient();
  if (!client) return [];

  const { data, error } = await client
    .from("feedback_submissions")
    .select(
      "id, feedback_type, subject, message, name, email, product, page_path, page_url, source_context, share_id, plan_title, severity, steps_to_reproduce, desired_outcome, browser, status, created_at"
    )
    .eq("product", product)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[feedback-queries] read failed:", error.message);
    return [];
  }
  return (data ?? []) as FeedbackRow[];
}
