import { createSupabaseServiceClient } from "@/lib/plansight-ai/supabase";

const MAX_USER_AGENT_CHARS = 500;

export type ShareViewEvent = {
  /** share_id of the plan being viewed. Required. */
  shareId: string;
  /** Supabase auth UUID of the viewer, or null for unauthenticated stakeholders. */
  viewerUserId: string | null;
  /** True when the viewer is the owner of this plan. Lets the dashboard
   * exclude the PM's own self-views from stakeholder-engagement metrics. */
  isOwnerView: boolean;
  /** Raw User-Agent header. Trimmed to MAX_USER_AGENT_CHARS at insert time. */
  userAgent: string | null;
};

/**
 * Insert one row into share_views. Best-effort — never throws and never
 * blocks the caller. Designed to be invoked as `void recordShareView(event)`
 * after the GET response has been returned. A Supabase outage should
 * never break a stakeholder's ability to view a shared plan.
 */
export async function recordShareView(event: ShareViewEvent): Promise<void> {
  try {
    if (!event.shareId) {
      console.warn("[share-views] skipping event with no shareId");
      return;
    }

    const client = createSupabaseServiceClient();
    if (!client) {
      // Supabase service-role not configured in this environment.
      return;
    }

    const { error } = await client.from("share_views").insert({
      share_id: event.shareId,
      viewer_user_id: event.viewerUserId ?? null,
      is_owner_view: event.isOwnerView,
      user_agent: event.userAgent
        ? event.userAgent.slice(0, MAX_USER_AGENT_CHARS)
        : null
    });

    if (error) {
      console.error("[share-views] insert failed:", error.message);
    }
  } catch (err) {
    console.error("[share-views] insert threw:", err);
  }
}
