import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getAppUrl,
  getStripeClient,
  getUserBilling
} from "@/lib/billing/stripe";

export const runtime = "nodejs";

/**
 * Creates a Stripe Customer Portal session for the current user and 303s
 * to it. Pro users hit this from the "Manage billing" button on /my-plans
 * and the same button on /upgrade once they're already subscribed.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to manage billing." },
      { status: 401 }
    );
  }

  try {
    const billing = await getUserBilling(user.id);
    if (!billing?.stripeCustomerId) {
      return NextResponse.json(
        {
          error:
            "No Stripe customer on file. Subscribe first from the upgrade page."
        },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripeCustomerId,
      return_url: `${getAppUrl()}/my-plans`
    });

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to open portal.";
    return NextResponse.json(
      { error: `Failed to open billing portal: ${message}` },
      { status: 500 }
    );
  }
}
