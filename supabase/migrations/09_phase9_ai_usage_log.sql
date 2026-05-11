-- Phase 9: AI usage logging, explain-task caching, and spend-alert dedupe.
--
-- Backs the abuse-mitigation stack in
-- branding/plansight-ai/PLANSIGHT_EXPLAIN_TASK_ABUSE_MITIGATION.md:
--
-- 1. ai_usage_log — one row per AI call (cache hits and misses) for every
--    AI feature (explain_task, regenerate_analysis, weekly_snapshot).
--    Drives rate limiting (count last 1h / 1d for a user), cost tuning
--    (P50/P95 per user, cache hit rate per feature), and the spend alert.
--
-- 2. explain_task_cache — per-task explanation cache keyed by
--    (plan_content_hash, task_id). Generated once per plan content, served
--    free on every subsequent click. Cache invalidates naturally on plan
--    re-upload (new content hash = new cache scope).
--
-- 3. ai_spend_alerts — dedupe table so the operator doesn't get the same
--    "this user crossed $3" email multiple times in the same month.
--
-- All writes happen via service-role (server routes); RLS allows users to
-- read their own usage rows for future in-app surfacing if we want it.
--
-- Run after 08. Idempotent.

create table if not exists public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  share_id text null references public.plans(share_id) on delete set null,
  feature text not null,
  task_id text null,
  cache_hit boolean not null default false,
  model text null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cache_read_tokens int not null default 0,
  cache_write_tokens int not null default 0,
  cost_usd numeric(10, 6) not null default 0,
  latency_ms int null,
  rate_limited boolean not null default false,
  soft_cap_shown boolean not null default false,
  soft_cap_dismissed boolean not null default false,
  error text null,
  constraint ai_usage_log_feature_check
    check (feature in ('explain_task', 'regenerate_analysis', 'weekly_snapshot'))
);

-- Rate-limit queries scan (user_id, created_at). Cost queries scan
-- (user_id, created_at) too. One composite index covers both.
create index if not exists ai_usage_log_user_created_idx
  on public.ai_usage_log (user_id, created_at desc);

-- For "cost per feature" and "cache hit rate per feature" analytics queries.
create index if not exists ai_usage_log_feature_created_idx
  on public.ai_usage_log (feature, created_at desc);

alter table public.ai_usage_log enable row level security;

drop policy if exists "users read own ai usage" on public.ai_usage_log;
create policy "users read own ai usage"
  on public.ai_usage_log for select
  using (auth.uid() = user_id);

comment on table public.ai_usage_log is
  'One row per AI call across all features. Used for rate limits, cost monitoring, and the cache-hit-rate tuning loop.';
comment on column public.ai_usage_log.cache_hit is
  'true when served from cache (cost_usd should be 0). Important for cache-hit-rate metric.';
comment on column public.ai_usage_log.rate_limited is
  'true when this attempt was blocked by a hard rate limit (hourly or daily).';
comment on column public.ai_usage_log.soft_cap_shown is
  'true when the 100/day soft-cap nudge was surfaced to the user during this attempt.';


create table if not exists public.explain_task_cache (
  plan_content_hash text not null,
  task_id text not null,
  explanation text not null,
  generated_at timestamptz not null default now(),
  generated_by uuid null references auth.users(id) on delete set null,
  primary key (plan_content_hash, task_id)
);

create index if not exists explain_task_cache_generated_at_idx
  on public.explain_task_cache (generated_at desc);

alter table public.explain_task_cache enable row level security;

-- Cache is owned by the server; no client-side reads or writes. Service-role
-- bypasses RLS, so no policies needed for normal operation. Lock the table
-- down explicitly for clarity.
drop policy if exists "no client access" on public.explain_task_cache;
create policy "no client access"
  on public.explain_task_cache for all
  using (false)
  with check (false);

comment on table public.explain_task_cache is
  'Per-task Claude explanation cache. Key (plan_content_hash, task_id). Invalidates naturally when the plan content hash changes (re-upload or edit).';


create table if not exists public.ai_spend_alerts (
  user_id uuid not null references auth.users(id) on delete cascade,
  year_month text not null,
  alerted_at timestamptz not null default now(),
  cost_usd_at_alert numeric(10, 6) not null,
  primary key (user_id, year_month)
);

alter table public.ai_spend_alerts enable row level security;

drop policy if exists "no client access" on public.ai_spend_alerts;
create policy "no client access"
  on public.ai_spend_alerts for all
  using (false)
  with check (false);

comment on table public.ai_spend_alerts is
  'Dedupe table so the operator gets at most one $3-cumulative-spend email per user per month. Key (user_id, YYYY-MM).';
