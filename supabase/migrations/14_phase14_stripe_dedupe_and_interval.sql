-- Phase 14: Stripe webhook idempotency + monthly/annual interval column.
--
-- Two changes bundled because both are billing-webhook concerns and ship
-- in the same effort:
--
-- 1. public.stripe_events — dedupe table for webhook deliveries. Required
--    before adding non-idempotent handlers (refunds, disputes). The
--    webhook attempts to insert the event id first; on unique-violation
--    it returns 200 immediately and skips the handler. Stripe retries on
--    non-2xx and very occasionally re-delivers a 2xx event, so dedupe by
--    event id is the only safe answer.
--
--    Retention: not pruned. At PlanSight's current volume this grows by
--    a handful of rows per Pro user per month. Revisit when row count
--    exceeds ~100k.
--
-- 2. public.user_billing.billing_interval — surface monthly vs annual on
--    /my-plans (and future admin views). Populated by the webhook from
--    the subscription's first item price.recurring.interval. Existing
--    rows stay null until their next subscription event fires; display
--    code handles null gracefully.
--
-- Run after 13_backfill_guest_ttl_24h.sql. Idempotent.

create table if not exists public.stripe_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now()
);

comment on table public.stripe_events is
  'Webhook delivery dedupe. The Stripe webhook inserts (event_id, event_type) before processing; a unique-violation indicates a retry and the handler short-circuits with 200.';

alter table public.stripe_events enable row level security;
-- No policies. Service-role bypass only.

alter table public.user_billing
  add column if not exists billing_interval text;

comment on column public.user_billing.billing_interval is
  'Subscription billing interval mirrored from Stripe: month or year. Populated by the webhook on subscription.created/updated. null for older rows until their next webhook fires.';
