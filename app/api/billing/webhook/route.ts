import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getStripeClient,
  getUserIdForCustomer,
  isProStatus,
  setProductTierForUser,
  upsertBillingFromSubscription
} from "@/lib/billing/stripe";

export const runtime = "nodejs";
// Stripe signature verification needs the exact raw bytes of the request.
// Forcing dynamic prevents any framework caching of POSTs to this route.
export const dynamic = "force-dynamic";

const PLANSIGHT_SLUG = "plansight-ai";

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not set. Get it from the Stripe Dashboard webhook config (test + live secrets are different)."
    );
  }
  return secret;
}

function periodEndIso(sub: Stripe.Subscription): string | null {
  const seconds = (sub as unknown as { current_period_end?: number }).current_period_end;
  if (!seconds || typeof seconds !== "number") {
    return null;
  }
  return new Date(seconds * 1000).toISOString();
}

async function syncSubscriptionToTier(sub: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  await upsertBillingFromSubscription(customerId, {
    subscriptionId: sub.id,
    status: sub.status,
    currentPeriodEnd: periodEndIso(sub),
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false
  });

  const userId = await getUserIdForCustomer(customerId);
  if (!userId) {
    return;
  }

  const tier: "free" | "pro" = isProStatus(sub.status) ? "pro" : "free";
  await setProductTierForUser(userId, PLANSIGHT_SLUG, tier);
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 }
    );
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, getWebhookSecret());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid Stripe signature.";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) {
          break;
        }
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscriptionToTier(sub);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscriptionToTier(sub);
        break;
      }
      default:
        // No-op ack so Stripe stops retrying.
        break;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook handler error.";
    // Log and return 500 so Stripe retries with backoff.
    console.error("[stripe webhook]", event.type, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
