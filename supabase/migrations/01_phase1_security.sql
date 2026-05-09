-- Phase 1: Security hardening
--
-- This migration:
--   1. Truncates existing plans and plan_tasks (existing data is throwaway pre-PMF).
--   2. Drops the public INSERT/UPDATE/DELETE RLS policies that allowed anyone with
--      the anon key to write/overwrite/delete any plan.
--   3. Keeps the public SELECT policies so stakeholders can still load a plan when
--      they have the share_id (the URL is the credential).
--   4. Adds owner_user_id (nullable uuid) on plans for forward-compat with Phase 4
--      (Supabase Auth + "My Plans" dashboard). Phase 1 does not populate it.
--   5. Adds an index on owner_user_id for the future dashboard query.
--
-- Writes will be performed by the Next.js server using the service-role key,
-- which bypasses RLS. The anon key in the browser is now read-only.
--
-- Run this in the Supabase SQL editor. Idempotent.

-- 1. Truncate existing data (cascades to plan_tasks via FK).
truncate table public.plans cascade;

-- 2. Drop write policies on plans.
drop policy if exists "Public insert plans" on public.plans;
drop policy if exists "Public update plans" on public.plans;
drop policy if exists "Public delete expired plans" on public.plans;

-- 3. Drop write policies on plan_tasks.
drop policy if exists "Public insert plan tasks" on public.plan_tasks;
drop policy if exists "Public update plan tasks" on public.plan_tasks;
drop policy if exists "Public delete expired plan tasks" on public.plan_tasks;

-- 4. Confirm read policies remain (recreate idempotently).
drop policy if exists "Public read plans" on public.plans;
create policy "Public read plans"
on public.plans
for select
using (true);

drop policy if exists "Public read plan tasks" on public.plan_tasks;
create policy "Public read plan tasks"
on public.plan_tasks
for select
using (true);

-- 5. Add forward-compat columns for Phase 4 auth.
alter table public.plans
  add column if not exists owner_user_id uuid null;

create index if not exists plans_owner_user_id_idx
  on public.plans (owner_user_id)
  where owner_user_id is not null;

-- 6. Sanity check: document expected RLS posture.
comment on table public.plans is
  'Plans table. RLS posture: anon has SELECT only. Writes (INSERT/UPDATE/DELETE) require service-role key (server-side only). owner_user_id is reserved for Phase 4 auth.';
comment on table public.plan_tasks is
  'Plan tasks table. RLS posture: anon has SELECT only. Writes require service-role key (server-side only).';
