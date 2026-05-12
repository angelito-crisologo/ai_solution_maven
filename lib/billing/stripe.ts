import Stripe from "stripe";
import {
  createSupabaseServiceClient,
  isSupabaseServiceConfigured
} from "@/lib/supabase/service";

let cachedClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (cachedClient) {
    return cachedClient;
  }
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env.local for development and to Vercel for Preview/Production."
    );
  }
  cachedClient = new Stripe(secret);
  return cachedClient;
}

export function getStripePriceId(): string {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    throw new Error(
      "STRIPE_PRICE_ID is not set. Create a recurring Price in the Stripe Dashboard and set its id (price_...) as STRIPE_PRICE_ID."
    );
  }
  return priceId;
}

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is not set. Set it to the deployed origin (e.g. https://aisolutionmaven.com) and to http://localhost:3000 for local dev."
    );
  }
  return url.replace(/\/$/, "");
}

export type UserBilling = {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

type UserBillingRow = {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};

const BILLING_SELECT =
  "user_id, stripe_customer_id, stripe_subscription_id, subscription_status, current_period_end, cancel_at_period_end";

function rowToBilling(row: UserBillingRow): UserBilling {
  return {
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    subscriptionStatus: row.subscription_status,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end ?? false
  };
}

function requireServiceClient() {
  if (!isSupabaseServiceConfigured()) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY for billing writes."
    );
  }
  const client = createSupabaseServiceClient();
  if (!client) {
    throw new Error("Failed to create Supabase service client.");
  }
  return client;
}

export async function getUserBilling(userId: string): Promise<UserBilling | null> {
  const client = requireServiceClient();
  const { data, error } = await client
    .from("user_billing")
    .select(BILLING_SELECT)
    .eq("user_id", userId)
    .maybeSingle<UserBillingRow>();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  return rowToBilling(data);
}

export async function getUserBillingByCustomerId(
  customerId: string
): Promise<UserBilling | null> {
  const client = requireServiceClient();
  const { data, error } = await client
    .from("user_billing")
    .select(BILLING_SELECT)
    .eq("stripe_customer_id", customerId)
    .maybeSingle<UserBillingRow>();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  return rowToBilling(data);
}

/**
 * Returns the user's existing Stripe customer or creates one. Persists the
 * customer id in user_billing so the next call short-circuits.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  const existing = await getUserBilling(userId);
  if (existing?.stripeCustomerId) {
    return existing.stripeCustomerId;
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId }
  });

  const client = requireServiceClient();
  const { error } = await client.from("user_billing").upsert(
    {
      user_id: userId,
      stripe_customer_id: customer.id,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw error;
  }

  return customer.id;
}

type SubscriptionState = {
  subscriptionId: string | null;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

/**
 * Upserts the billing row for a customer based on the subscription's latest
 * state from Stripe. Used by the webhook on subscription.created/updated/
 * deleted events.
 */
export async function upsertBillingFromSubscription(
  customerId: string,
  state: SubscriptionState
): Promise<void> {
  const client = requireServiceClient();

  const { data: existing, error: lookupError } = await client
    .from("user_billing")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle<{ user_id: string }>();

  if (lookupError) {
    throw lookupError;
  }
  if (!existing) {
    // No matching user — Stripe customer was created outside our flow, or
    // the row was deleted. Webhook ack with a no-op rather than 500ing.
    return;
  }

  const { error } = await client
    .from("user_billing")
    .update({
      stripe_subscription_id: state.subscriptionId,
      subscription_status: state.status,
      current_period_end: state.currentPeriodEnd,
      cancel_at_period_end: state.cancelAtPeriodEnd,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", existing.user_id);

  if (error) {
    throw error;
  }
}

export async function getUserIdForCustomer(customerId: string): Promise<string | null> {
  const billing = await getUserBillingByCustomerId(customerId);
  return billing?.userId ?? null;
}

/**
 * Active or trialing subscription = Pro. Everything else (past_due,
 * canceled, unpaid, incomplete, incomplete_expired, paused, null) = Free.
 */
export function isProStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

export async function setProductTierForUser(
  userId: string,
  productSlug: string,
  tier: "free" | "pro"
): Promise<void> {
  const client = requireServiceClient();
  const now = new Date().toISOString();

  const { error } = await client
    .from("product_activations")
    .upsert(
      {
        user_id: userId,
        product_slug: productSlug,
        tier,
        updated_at: now
      },
      { onConflict: "user_id,product_slug" }
    );

  if (error) {
    throw error;
  }
}
