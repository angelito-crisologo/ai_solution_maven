// Minimal Google Analytics 4 client helper. The measurement ID lives in the
// public env var NEXT_PUBLIC_GA4_MEASUREMENT_ID — when it's unset (local dev,
// preview deploys you'd rather not pollute) every helper here no-ops, so the
// rest of the codebase can call `track()` unconditionally.

export const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? "";

export function isGa4Enabled(): boolean {
  return GA4_MEASUREMENT_ID.length > 0;
}

type GtagCommand =
  | ["js", Date]
  | ["config", string, Record<string, unknown>?]
  | ["event", string, Record<string, unknown>?]
  | ["set", Record<string, unknown>]
  | ["consent", "default" | "update", Record<string, "granted" | "denied">];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagCommand) => void;
  }
}

/**
 * Fire a GA4 event. Safe to call from any component without checking the env
 * — no-ops when GA4 isn't configured or when running on the server.
 *
 * Use snake_case event names (the GA4 convention). Recommended:
 *   - sign_up                  (built-in GA4 event)
 *   - login                    (built-in)
 *   - purchase                 (built-in — for Pro subscriptions, fired on the
 *                               post-checkout landing)
 *   - plan_uploaded            (custom — .mpp import succeeded)
 *   - share_link_copied        (custom)
 *   - upgrade_clicked          (custom — pricing CTAs / workspace banner)
 *   - plan_claimed             (custom — anonymous→Free claim succeeded)
 */
export function track(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!isGa4Enabled()) return;
  if (!window.gtag) return;
  window.gtag("event", event, params);
}

/**
 * Fire a page_view event. Called by GA4Pageviews on route transitions.
 * The initial pageview is sent automatically by gtag.js when the script
 * boots, so this is for subsequent client-side navigations only.
 */
export function trackPageview(path: string): void {
  if (typeof window === "undefined") return;
  if (!isGa4Enabled()) return;
  if (!window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title
  });
}
