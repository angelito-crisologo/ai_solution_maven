import { redirect } from "next/navigation";

/**
 * Legacy /upgrade redirect.
 *
 * The page itself lives at /products/plansight-ai/upgrade now (per-product
 * nesting, same pattern as /admin and /my-plans). Stripe checkout sessions
 * already in flight have the old cancel_url embedded, and any external
 * bookmarks predate the move, so we forward both rather than 404.
 *
 * Forwards `?checkout=cancelled` and any other query params verbatim so the
 * Stripe cancel flow still surfaces the "cancelled" banner on the product
 * upgrade page.
 */
export default function LegacyUpgradeRedirect({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (typeof value === "string") params.set(key, value);
  }
  const qs = params.toString();
  redirect(`/products/plansight-ai/upgrade${qs ? `?${qs}` : ""}`);
}
