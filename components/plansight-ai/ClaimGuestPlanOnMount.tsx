"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { track } from "@/lib/analytics/gtag";

/**
 * Drop-in client component that completes the anonymous→signed-up claim
 * flow on the page where signups land (/products/plansight-ai/my-plans).
 *
 * Flow:
 * 1. Anonymous visitor uploads, sees the workspace banner.
 * 2. Clicks "Save my plan — sign up free". The banner's click handler
 *    writes `plansight:claim-share-id` to localStorage and routes them
 *    through signup/signin.
 * 3. On return — signed in, landed here — we read the marker, POST it to
 *    /api/plansight/claim, and refresh so the now-owned plan appears in
 *    the list.
 *
 * Marker is cleared before the fetch so transient failures don't loop.
 * Renders nothing.
 */
const CLAIM_SHARE_ID_KEY = "plansight:claim-share-id";

export function ClaimGuestPlanOnMount() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const claimId = window.localStorage.getItem(CLAIM_SHARE_ID_KEY);
    if (!claimId) return;
    window.localStorage.removeItem(CLAIM_SHARE_ID_KEY);

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/plansight/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shareId: claimId })
        });
        if (cancelled) return;
        if (response.ok) {
          track("plan_claimed", { source: "my_plans_landing" });
          // Re-render the server component so listPlansForUser picks up
          // the newly-claimed row.
          router.refresh();
        }
        // On 4xx/5xx, silently stay — localStorage already cleared.
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[plansight] claim-on-my-plans failed", error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
