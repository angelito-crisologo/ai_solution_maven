import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getAppUrl,
  getOrCreateStripeCustomer,
  getStripeClient,
  getStripePriceId
} from "@/lib/billing/stripe";

export const runtime = "nodejs";

/**
 * Starts a Stripe Checkout session for PlanSight Pro and returns its URL.
 * The /upgrade page submits a form here, then we 303 the browser to the
 * Stripe-hosted page. On completion Stripe redirects back to
 * /my-plans?checkout=success and fires checkout.session.completed to the
 * webhook, which is what flips product_activations.tier to 'pro'.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to start checkout." },
      { status: 401 }
    );
  }

  try {
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);
    const stripe = getStripeClient();
    const appUrl = getAppUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: getStripePriceId(), quantity: 1 }],
      success_url: `${appUrl}/products/plansight-ai/my-plans?checkout=success`,
      cancel_url: `${appUrl}/upgrade?checkout=cancelled`,
      allow_promotion_codes: true,
      client_reference_id: user.id,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          product_slug: "plansight-ai"
        }
      },
      metadata: {
        supabase_user_id: user.id,
        product_slug: "plansight-ai"
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
