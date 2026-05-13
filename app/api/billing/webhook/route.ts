import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getStripeClient,
  getUserBillingByCustomerId,
  getUserIdForCustomer,
  isBillingInterval,
  isProStatus,
  recordStripeEvent,
  setProductTierForUser,
  upsertBillingFromSubscription,
  type BillingInterval
} from "@/lib/billing/stripe";
import { sendOperatorAlert } from "@/lib/billing/operator-alert";

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

function subscriptionInterval(sub: Stripe.Subscription): BillingInterval | null {
  const item = sub.items?.data?.[0];
  const interval = item?.price?.recurring?.interval;
  return isBillingInterval(interval) ? interval : null;
}

async function syncSubscriptionToTier(sub: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  await upsertBillingFromSubscription(customerId, {
    subscriptionId: sub.id,
    status: sub.status,
    currentPeriodEnd: periodEndIso(sub),
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    billingInterval: subscriptionInterval(sub)
  });

  const userId = await getUserIdForCustomer(customerId);
  if (!userId) {
    return;
  }

  const tier: "free" | "pro" = isProStatus(sub.status) ? "pro" : "free";
  await setProductTierForUser(userId, PLANSIGHT_SLUG, tier);
}

/**
 * Dispute opened by the customer. Per policy (services.md), access is
 * revoked immediately: continuing to serve Pro features to a disputing
 * customer worsens the chargeback signal to Stripe's fraud model.
 *
 * Steps: flip tier to free, cancel the subscription (which fires
 * customer.subscription.deleted and persists the canceled status), email
 * the operator. Cancellation is best-effort — if it fails (e.g. already
 * canceled), the tier flip still stands.
 */
async function handleDisputeCreated(
  stripe: Stripe,
  dispute: Stripe.Dispute
): Promise<void> {
  const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
  if (!chargeId) return;

  const charge = await stripe.charges.retrieve(chargeId);
  const customerId =
    typeof charge.customer === "string" ? charge.customer : charge.customer?.id ?? null;
  if (!customerId) return;

  const userId = await getUserIdForCustomer(customerId);
  const billing = await getUserBillingByCustomerId(customerId);

  if (userId) {
    await setProductTierForUser(userId, PLANSIGHT_SLUG, "free");
  }

  if (billing?.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(billing.stripeSubscriptionId);
    } catch (err) {
      console.error("[stripe webhook] cancel-on-dispute failed:", err);
    }
  }

  const amountUsd = (dispute.amount / 100).toFixed(2);
  await sendOperatorAlert(
    `[PlanSight] Dispute opened — $${amountUsd}`,
    `A Stripe dispute was opened against a PlanSight Pro charge. Pro access has been revoked and the subscription has been cancelled.

Dispute ID: ${dispute.id}
Charge ID: ${chargeId}
Customer ID: ${customerId}
User ID: ${userId ?? "(no matching PlanSight user)"}
Amount: $${amountUsd} ${dispute.currency.toUpperCase()}
Reason: ${dispute.reason}
Status: ${dispute.status}

Review in Stripe: https://dashboard.stripe.com/disputes/${dispute.id}
`
  );
}

/**
 * Dispute resolved. Won → log + email (no auto-restore — operator should
 * manually re-enable Pro if it was a customer error). Lost → log + email;
 * access stayed revoked from handleDisputeCreated. Other statuses fall
 * through.
 */
async function handleDisputeClosed(
  stripe: Stripe,
  dispute: Stripe.Dispute
): Promise<void> {
  if (dispute.status !== "won" && dispute.status !== "lost") return;

  const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
  const customerId = chargeId
    ? await (async () => {
        const charge = await stripe.charges.retrieve(chargeId);
        return typeof charge.customer === "string"
          ? charge.customer
          : charge.customer?.id ?? null;
      })()
    : null;
  const userId = customerId ? await getUserIdForCustomer(customerId) : null;
  const amountUsd = (dispute.amount / 100).toFixed(2);

  const verdict =
    dispute.status === "won"
      ? "Dispute won — funds released. Pro was revoked at dispute creation; re-enable manually if appropriate."
      : "Dispute lost — chargeback finalised. A Stripe dispute fee likely applies.";

  await sendOperatorAlert(
    `[PlanSight] Dispute ${dispute.status} — $${amountUsd}`,
    `${verdict}

Dispute ID: ${dispute.id}
Charge ID: ${chargeId ?? "(unknown)"}
Customer ID: ${customerId ?? "(unknown)"}
User ID: ${userId ?? "(no matching PlanSight user)"}
Amount: $${amountUsd} ${dispute.currency.toUpperCase()}

Review in Stripe: https://dashboard.stripe.com/disputes/${dispute.id}
`
  );
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

  // Idempotency: short-circuit on duplicate delivery. Must come after
  // signature verification (an unverified event id cannot be trusted).
  const fresh = await recordStripeEvent(event.id, event.type);
  if (!fresh) {
    return NextResponse.json({ received: true, deduped: true });
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
      case "charge.dispute.created": {
        await handleDisputeCreated(stripe, event.data.object as Stripe.Dispute);
        break;
      }
      case "charge.dispute.closed": {
        await handleDisputeClosed(stripe, event.data.object as Stripe.Dispute);
        break;
      }
      default:
        // Unhandled events ack 200 so Stripe stops retrying. Log so we
        // can see what's firing that we don't handle.
        console.log("[stripe webhook] unhandled event:", event.type);
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
