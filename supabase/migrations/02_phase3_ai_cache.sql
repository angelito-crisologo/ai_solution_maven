-- Phase 3: AI analysis cache columns on plans.
--
-- Stores the most recent Claude AI analysis output for a plan so repeat views
-- don't re-burn API tokens. Cache is keyed by content hash so any change to
-- the underlying task list invalidates the cached analysis automatically.
--
-- ai_analysis              jsonb structured output { summary, risks[], recommendations[], generatedAt }
-- ai_analysis_content_hash sha-256 of the canonical task list at generation time
-- ai_analysis_generated_at timestamp of the Claude call that produced this analysis
--
-- Run this in the Supabase SQL editor. Idempotent.

alter table public.plans
  add column if not exists ai_analysis jsonb null;

alter table public.plans
  add column if not exists ai_analysis_content_hash text null;

alter table public.plans
  add column if not exists ai_analysis_generated_at timestamptz null;

comment on column public.plans.ai_analysis is
  'Cached Claude AI analysis output. Schema: { summary, risks[], recommendations[], generatedAt }.';
comment on column public.plans.ai_analysis_content_hash is
  'sha-256 over canonical task list. If hash matches the current plan content, cached ai_analysis is reused.';
