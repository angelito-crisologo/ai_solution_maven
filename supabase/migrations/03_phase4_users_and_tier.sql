-- Phase 4: signed-in users and tier model.
--
-- Adds a public.users table that mirrors auth.users with a tier column. The
-- tier value drives entitlement checks for the free single-plan slot vs the
-- Pro multi-plan dashboard. A trigger auto-creates the public.users row on
-- first sign-in so the rest of the app can assume every authenticated user
-- has a row.
--
-- Run this in the Supabase SQL editor after 02_phase3_ai_cache.sql.
-- Idempotent.

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is
  'Application-side mirror of auth.users with tier. Rows are auto-created by trigger on auth.users insert.';
comment on column public.users.tier is
  'Entitlement tier. free = single-plan slot (one plan retained, replaced on import). pro = unlimited multi-plan dashboard.';

create index if not exists users_tier_idx on public.users (tier);

alter table public.users enable row level security;

-- Self-read only. The service-role key bypasses RLS for server writes (tier
-- updates ship in Phase 5 via Stripe webhook; for now they are manual SQL).
drop policy if exists "Users can read their own row" on public.users;
create policy "Users can read their own row"
on public.users
for select
using (auth.uid() = id);

-- Auto-create a public.users row whenever a new auth.users row appears. This
-- runs as security definer so it can write into public.users regardless of
-- the calling session's permissions.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

-- Backfill: ensure every existing auth.users row has a public.users row.
insert into public.users (id, email)
select u.id, u.email
from auth.users u
on conflict (id) do nothing;

-- Phase 4: link plans to their owner so /my-plans and the single-plan slot
-- can scope queries to the signed-in user. owner_user_id was added in
-- Phase 1 as a forward-compat column; this migration adds the FK needed
-- to start using it. Wrapped in a DO block so the migration stays
-- idempotent — Postgres has no ADD CONSTRAINT IF NOT EXISTS.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'plans_owner_user_id_fkey'
      and conrelid = 'public.plans'::regclass
  ) then
    alter table public.plans
      add constraint plans_owner_user_id_fkey
      foreign key (owner_user_id) references auth.users (id) on delete cascade;
  end if;
end $$;

comment on column public.plans.owner_user_id is
  'Auth user that owns this plan. NULL means anonymous/guest upload (ephemeral, not visible in /my-plans).';
