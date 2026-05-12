-- Phase 12: tag telemetry rows with the product they belong to.
--
-- All three telemetry tables (upload_events, ai_usage_log, share_views)
-- were written when PlanSight was the only product. As we prepare to
-- add a second product (see "Product #2 prep" context), each
-- telemetry row needs to identify which product produced it so the
-- admin dashboard can slice by product, and so a second product can
-- write its own telemetry into the same tables without confusion.
--
-- Strategy:
--   1. Add `product_slug text not null default 'plansight-ai'` to each
--      table. The default backfills existing rows transparently.
--   2. Index `(product_slug, created_at desc)` on each table so the
--      admin dashboard can window queries by product cheaply.
--
-- The default keeps existing telemetry-writing code working with no
-- changes — every row continues to be tagged 'plansight-ai' until the
-- callsites are updated to pass the slug explicitly. Once those are
-- updated (separate, mechanical follow-up), drop the default.
--
-- Run after migration 11. Idempotent.

-- ---------------------------------------------------------------------------
-- upload_events
-- ---------------------------------------------------------------------------

alter table public.upload_events
  add column if not exists product_slug text not null default 'plansight-ai';

create index if not exists upload_events_product_slug_created_idx
  on public.upload_events (product_slug, created_at desc);

comment on column public.upload_events.product_slug is
  'Which product wrote this row. Today always plansight-ai; the default keeps the column NOT NULL without requiring every callsite to set it. Drop the default once all writes pass the slug explicitly.';

-- ---------------------------------------------------------------------------
-- ai_usage_log
-- ---------------------------------------------------------------------------

alter table public.ai_usage_log
  add column if not exists product_slug text not null default 'plansight-ai';

create index if not exists ai_usage_log_product_slug_created_idx
  on public.ai_usage_log (product_slug, created_at desc);

comment on column public.ai_usage_log.product_slug is
  'Which product wrote this row. Today always plansight-ai. The cost-per-feature and top-spender queries should filter on this once we have a second product.';

-- ---------------------------------------------------------------------------
-- share_views
-- ---------------------------------------------------------------------------

alter table public.share_views
  add column if not exists product_slug text not null default 'plansight-ai';

create index if not exists share_views_product_slug_created_idx
  on public.share_views (product_slug, created_at desc);

comment on column public.share_views.product_slug is
  'Which product the viewed plan belongs to. Today always plansight-ai.';
