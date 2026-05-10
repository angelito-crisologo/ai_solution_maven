import { NextResponse, type NextRequest } from "next/server";
import { activateProduct, PRODUCTS, type ProductSlug } from "@/lib/auth/activations";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";

export const runtime = "nodejs";

const KNOWN_PRODUCTS: ProductSlug[] = [PRODUCTS.PLANSIGHT];

function asProductSlug(raw: string | null): ProductSlug | null {
  if (!raw) return null;
  return KNOWN_PRODUCTS.find((slug) => slug === raw) ?? null;
}

/**
 * Magic-link callback. Supabase redirects here with ?code=... after the user
 * clicks the email link. We exchange the code for a session (sets the auth
 * cookies) then, if ?product=<slug> was present on the original /signin URL,
 * record a per-product activation row before redirecting.
 *
 * Activation failure is non-fatal: the user lands on the product page,
 * where the activation banner will be shown and they can retry with the
 * one-click button.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectTo = url.searchParams.get("redirectTo") || "/my-plans";
  const productSlug = asProductSlug(url.searchParams.get("product"));

  if (!code) {
    return NextResponse.redirect(new URL("/signin?error=missing_code", url.origin));
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(error.message)}`, url.origin)
    );
  }

  if (productSlug && data.session?.user.id) {
    try {
      await activateProduct(data.session.user.id, productSlug);
    } catch (activationError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[auth/callback] activation failed", activationError);
      }
      // Fall through — user is signed in; activation banner can recover.
    }
  }

  return NextResponse.redirect(new URL(redirectTo, url.origin));
}
