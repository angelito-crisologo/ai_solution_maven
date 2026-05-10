-- Phase 5b: track "cancellation pending" state on user_billing.
--
-- Stripe's Customer Portal default cancel button schedules cancellation
-- at the end of the paid period (cancel_at_period_end = true) rather than
-- canceling immediately. Without storing this flag we can't tell the
-- difference between "active subscription" and "active subscription that
-- will lapse on <date>", so /my-plans can't show the right banner.
--
-- Run after 05_phase5_stripe_billing.sql. Idempotent.

alter table public.user_billing
  add column if not exists cancel_at_period_end boolean not null default false;

comment on column public.user_billing.cancel_at_period_end is
  'True when the user has scheduled cancellation via Stripe Customer Portal. Subscription remains active (and tier=pro) until current_period_end, at which point Stripe fires customer.subscription.deleted and tier flips to free.';
