-- Phase 11: share-link view telemetry.
--
-- One row per successful load of a /share/<id> via the GET handler at
-- /api/plansight/share. Used by /admin to answer the core value-prop
-- question: "are stakeholders actually opening the share links the PM
-- sends them?"
--
-- Writes are fire-and-forget from the GET handler; failures are logged
-- and never block the user response. RLS denies all client-key access;
-- service-role bypasses RLS as expected.
--
-- is_owner_view distinguishes the PM viewing their own share (don't
-- count these toward stakeholder-engagement metrics) from genuine
-- external views. We record both, with a flag; the dashboard filters
-- to is_owner_view = false when computing share-view rate.
--
-- Run after migration 10. Idempotent.

create table if not exists public.share_views (
  id uuid primary key default gen_random_uuid(),
  viewed_at timestamptz not null default now(),
  share_id text not null references public.plans(share_id) on delete cascade,
  viewer_user_id uuid null references auth.users(id) on delete set null,
  is_owner_view boolean not null default false,
  user_agent text null
);

-- "Views over time" line chart and other date-range queries.
create index if not exists share_views_viewed_at_idx
  on public.share_views (viewed_at desc);

-- "Top viewed shares" and per-share view-history queries.
create index if not exists share_views_share_viewed_idx
  on public.share_views (share_id, viewed_at desc);

-- The headline "share-view rate" metric only counts non-owner views;
-- partial index keeps that query fast as the table grows.
create index if not exists share_views_non_owner_viewed_idx
  on public.share_views (viewed_at desc)
  where is_owner_view = false;

alter table public.share_views enable row level security;

-- No policies on purpose. Service-role bypasses RLS for the route's
-- inserts; anon and authenticated keys get nothing. Same lockdown
-- posture as upload_events / ai_usage_log / explain_task_cache.
drop policy if exists "no client access" on public.share_views;
create policy "no client access"
  on public.share_views for all
  using (false)
  with check (false);

comment on table public.share_views is
  'One row per successful GET on /api/plansight/share. Stakeholder-engagement signal — see docs/plansight-ai/specs/telemetry.md.';
comment on column public.share_views.is_owner_view is
  'true when the PM owner of this plan is the one viewing. Dashboard filters to false when computing share-view rate.';
comment on column public.share_views.viewer_user_id is
  'Supabase auth UUID of the viewer, or null for unauthenticated stakeholders (the typical case).';
