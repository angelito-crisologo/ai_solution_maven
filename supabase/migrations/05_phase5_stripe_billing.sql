-- Phase 5: Stripe billing.
--
-- Adds public.user_billing to map a Supabase user to a Stripe customer +
-- subscription. The Stripe webhook (POST /api/billing/webhook) writes
-- here on checkout.session.completed and customer.subscription.* events.
-- Source of truth for *gating* stays product_activations.tier — this
-- table is the audit/portal-lookup record. The webhook keeps both in
-- sync for the plansight-ai slug.
--
-- Stripe customer ID is per-human, not per-product, so this lives in its
-- own table rather than on product_activations. A future ProductX would
-- read the same stripe_customer_id and add its own product_activations
-- row.
--
-- Run in the Supabase SQL editor after 04_phase4b_per_product_activation.sql.
-- Idempotent.

create table if not exists public.user_billing (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  subscription_status text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.user_billing is
  'Maps a Supabase user to their Stripe customer and active subscription. Written by the Stripe webhook only. Source of truth for tier gating is product_activations.tier; this table records the billing state behind that gate.';

comment on column public.user_billing.subscription_status is
  'Mirrors Stripe subscription status: active, trialing, past_due, canceled, incomplete, incomplete_expired, unpaid. Pro = active or trialing; everything else = free.';

create index if not exists user_billing_customer_idx
  on public.user_billing (stripe_customer_id);

create index if not exists user_billing_subscription_idx
  on public.user_billing (stripe_subscription_id);

alter table public.user_billing enable row level security;

drop policy if exists "Users can read their own billing" on public.user_billing;
create policy "Users can read their own billing"
on public.user_billing
for select
using (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies. All writes go through the service-
-- role key from the Stripe webhook handler.
