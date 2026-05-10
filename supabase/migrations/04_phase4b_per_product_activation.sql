-- Phase 4b: per-product activation and tier.
--
-- Each product (PlanSight today, ProductX/Y tomorrow) gets its own opt-in
-- record so signed-up-vs-only-curious analytics works per product. tier
-- moves off public.users onto the activation row so a user can be Pro on
-- one product and Free on another.
--
-- Auth credentials stay shared. A user signs in once and clicks an
-- "Activate ProductX" button on each new product page; activation is a
-- one-click record, not a second password.
--
-- Run in the Supabase SQL editor after 03_phase4_users_and_tier.sql.
-- Idempotent.

create table if not exists public.product_activations (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_slug text not null,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  activated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_slug)
);

comment on table public.product_activations is
  'Per-product opt-in. A row exists once a user has explicitly activated a product. tier is per-product so pricing and gating can diverge across products.';

create index if not exists product_activations_product_idx
  on public.product_activations (product_slug);

create index if not exists product_activations_tier_idx
  on public.product_activations (product_slug, tier);

alter table public.product_activations enable row level security;

drop policy if exists "Users can read their own activations" on public.product_activations;
create policy "Users can read their own activations"
on public.product_activations
for select
using (auth.uid() = user_id);

-- Backfill from the (about-to-drop) users.tier column. Any user currently
-- marked Pro becomes a Pro activation for plansight-ai. Free users get no
-- row — they activate explicitly via /api/plansight/activate. This matches
-- the new model: presence-of-row signals opt-in.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'tier'
  ) then
    insert into public.product_activations (user_id, product_slug, tier, activated_at)
    select id, 'plansight-ai', tier, now()
    from public.users
    where tier = 'pro'
    on conflict (user_id, product_slug) do update set tier = excluded.tier;
  end if;
end $$;

-- Phase 4 (just shipped) created users.tier. We now drop it because tier
-- is per-product. Wrapped in a check so re-running this migration after
-- the column is gone doesn't fail.
alter table public.users drop column if exists tier;

drop index if exists users_tier_idx;
