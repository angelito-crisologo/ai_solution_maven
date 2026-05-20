import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { activateProduct, PRODUCTS } from "@/lib/auth/activations";

export const runtime = "nodejs";

/**
 * Token-hash email confirmation. Handles both signup confirmation and
 * password-reset links when the Supabase email templates use:
 *
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
 *
 * Unlike the PKCE /auth/callback route, this does not require the code
 * verifier to be present in the browser that opens the link — so it works
 * correctly when the user signs up in one browser and opens the confirmation
 * email in another (e.g. incognito → normal Chrome).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") ?? "/products/plansight-ai/my-plans";

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL("/signin?error=missing_code", url.origin));
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error) {
    const lower = error.message.toLowerCase();
    const isExpired = lower.includes("expired") || lower.includes("invalid") || lower.includes("otp");
    const errorCode = isExpired ? "expired_link" : encodeURIComponent(error.message);
    return NextResponse.redirect(new URL(`/signin?error=${errorCode}`, url.origin));
  }

  // Auto-activate PlanSight on email confirmation (idempotent — safe to call
  // even if already activated, e.g. when the user clicks the link twice).
  if (type === "signup" && data.session?.user.id) {
    try {
      await activateProduct(data.session.user.id, PRODUCTS.PLANSIGHT);
    } catch {
      // Non-fatal — user is signed in; the product page activation banner can recover.
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
