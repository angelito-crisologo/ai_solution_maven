-- Phase 10: upload telemetry.
--
-- Backs the brief at
-- docs/plansight-ai/archive/UPLOAD_TELEMETRY_IMPLEMENTATION_BRIEF.md and the
-- spec at docs/plansight-ai/specs/telemetry.md.
--
-- One row per .mpp upload attempt, success or failure. Used to answer:
--   * What's the median parse time? At what file size does it spike?
--   * Is the Render parser cold-starting despite the keep-warm ping?
--   * What % of uploads fail, at which pipeline stage?
--   * When do we need to upgrade from Render Free to Railway Hobby?
--
-- Writes are fire-and-forget from the server route; failures are logged
-- to stderr and never block the user response. RLS denies all client-key
-- access; service-role bypasses RLS as expected.
--
-- v1 instruments only /api/plansight/import-mpp. db_write_duration_ms
-- and share_id stay null until we extend instrumentation to /share
-- (separate follow-up).
--
-- Run after migration 09. Idempotent.

create table if not exists public.upload_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Who
  user_id uuid null references auth.users(id) on delete set null,
  user_tier text not null check (user_tier in ('anon', 'free', 'pro')),
  user_agent text null,

  -- What
  file_size_bytes integer not null,
  file_name_hash text null,             -- SHA-256 of original filename; never the filename itself
  mpp_version text null,                -- v1: always null; parser doesn't surface it yet
  has_resources boolean null,           -- v1: always null
  has_baselines boolean null,           -- v1: always null
  task_count integer null,              -- null on failure before parse completes

  -- Pipeline timing (all in milliseconds)
  upload_duration_ms integer null,      -- time to receive the file at the Next.js route
  parser_queue_ms integer null,         -- v1: always null; parser doesn't expose X-Parser-Queue-Ms yet
  parser_duration_ms integer null,      -- parser fetch elapsed
  db_write_duration_ms integer null,    -- v1: null (instrumentation deferred to /share follow-up)
  total_duration_ms integer not null,   -- end-to-end at the route

  -- Outcome
  success boolean not null,
  failure_stage text null check (
    failure_stage is null
    or failure_stage in (
      'upload',
      'validation',
      'parser_timeout',
      'parser_error',
      'db_write',
      'unknown'
    )
  ),
  failure_message text null,            -- sanitized; ≤300 chars, no paths/stacks/headers/secrets

  -- Reference (set later if/when /share writes succeed; null in v1)
  share_id text null references public.plans(share_id) on delete set null
);

create index if not exists upload_events_created_at_idx
  on public.upload_events (created_at desc);

create index if not exists upload_events_success_created_idx
  on public.upload_events (success, created_at desc);

create index if not exists upload_events_failure_stage_idx
  on public.upload_events (failure_stage)
  where success = false;

alter table public.upload_events enable row level security;

-- No policies on purpose. Service-role bypasses RLS for the route's
-- inserts; anon and authenticated keys get nothing. Lock down explicitly
-- so a future "let's expose upload counts" mistake has to be deliberate.
drop policy if exists "no client access" on public.upload_events;
create policy "no client access"
  on public.upload_events for all
  using (false)
  with check (false);

comment on table public.upload_events is
  'One row per .mpp upload attempt at /api/plansight/import-mpp. Used for parser-pipeline observability: parse latency distribution, cold-start detection, failure-stage rates, file-size scaling. See docs/plansight-ai/specs/telemetry.md.';
comment on column public.upload_events.user_tier is
  '"anon" when no Supabase session was present; "free"/"pro" reflects product_activations.tier at upload time.';
comment on column public.upload_events.failure_stage is
  'Categorical pipeline stage: upload (request body) | validation (size/mime/magic-bytes) | parser_timeout (25s) | parser_error (4xx/5xx/bad shape) | db_write (deferred to /share) | unknown.';
comment on column public.upload_events.parser_queue_ms is
  'Time the parser spent queueing / cold-starting before producing first byte. Null until the parser exposes X-Parser-Queue-Ms; cold-starts can be inferred from parser_duration_ms > 8000 in low-traffic periods.';
