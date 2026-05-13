import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getCurrentUser } from "@/lib/auth/session";
import {
  findActivePromotionCode,
  getAppUrl,
  getOrCreateStripeCustomer,
  getStripeClient,
  getStripePriceId,
  isBillingInterval,
  type BillingInterval,
  type ResolvedPromotion
} from "@/lib/billing/stripe";

export const runtime = "nodejs";

/**
 * Starts a Stripe Checkout session for PlanSight Pro and returns its URL.
 * The /upgrade page submits a form here with `interval=month|year` and
 * optionally `promo=<customer-facing code>`, then we 303 the browser to
 * the Stripe-hosted page. On completion Stripe redirects back to
 * /my-plans?checkout=success and fires checkout.session.completed to the
 * webhook, which is what flips product_activations.tier to 'pro'.
 *
 * Promo handling: if a promo code is supplied, we look it up server-side
 * (defence in depth — the upgrade page already validated it, but it may
 * have expired in between). On invalid/expired, redirect back to the
 * upgrade page with ?promo_error so the user can decide whether to
 * proceed at full price.
 *
 * Stripe rejects `discounts` and `allow_promotion_codes` set together,
 * so we toggle: pre-applied discount means no manual entry field on
 * Checkout; no discount means the manual field stays on.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to start checkout." },
      { status: 401 }
    );
  }

  const form = await request.formData().catch(() => null);
  const rawInterval = form?.get("interval");
  const interval: BillingInterval = isBillingInterval(rawInterval) ? rawInterval : "month";
  const promoRaw = form?.get("promo");
  const promoCode = typeof promoRaw === "string" ? promoRaw.trim() : "";

  let appliedPromotion: ResolvedPromotion | null = null;
  if (promoCode) {
    appliedPromotion = await findActivePromotionCode(promoCode);
    if (!appliedPromotion) {
      const appUrl = getAppUrl();
      const params = new URLSearchParams({
        promo: promoCode,
        promo_error: "invalid"
      });
      return NextResponse.redirect(
        `${appUrl}/products/plansight-ai/upgrade?${params.toString()}`,
        { status: 303 }
      );
    }
  }

  try {
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);
    const stripe = getStripeClient();
    const appUrl = getAppUrl();

    const discountParams: Pick<
      Stripe.Checkout.SessionCreateParams,
      "discounts" | "allow_promotion_codes"
    > = appliedPromotion
      ? { discounts: [{ promotion_code: appliedPromotion.promotionCode.id }] }
      : { allow_promotion_codes: true };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: getStripePriceId(interval), quantity: 1 }],
      success_url: `${appUrl}/products/plansight-ai/my-plans?checkout=success`,
      cancel_url: `${appUrl}/products/plansight-ai/upgrade?checkout=cancelled`,
      client_reference_id: user.id,
      ...discountParams,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          product_slug: "plansight-ai",
          billing_interval: interval,
          ...(appliedPromotion
          ? { promotion_code: appliedPromotion.promotionCode.code }
          : {})
        }
      },
      metadata: {
        supabase_user_id: user.id,
        product_slug: "plansight-ai",
        billing_interval: interval,
        ...(appliedPromotion
          ? { promotion_code: appliedPromotion.promotionCode.code }
          : {})
      }
    });

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL.");
    }

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start checkout.";
    return NextResponse.json(
      { error: `Failed to start checkout: ${message}` },
      { status: 500 }
    );
  }
}
