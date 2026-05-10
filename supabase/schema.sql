create table if not exists public.plans (
  share_id text primary key,
  title text not null,
  source_format text not null,
  imported_at timestamptz not null,
  start_date date null,
  finish_date date null,
  owner_type text not null default 'guest',
  guest_id text null,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plans
drop column if exists plan_json;

alter table public.plans
add column if not exists owner_type text not null default 'guest';

alter table public.plans
add column if not exists guest_id text null;

alter table public.plans
add column if not exists expires_at timestamptz null;

create index if not exists plans_expires_at_idx
  on public.plans (expires_at)
  where owner_type = 'guest' and expires_at is not null;

-- Phase 1: forward-compat column for Phase 4 auth.
alter table public.plans
add column if not exists owner_user_id uuid null;

create index if not exists plans_owner_user_id_idx
  on public.plans (owner_user_id)
  where owner_user_id is not null;

-- Phase 3: cached Claude AI analysis output.
alter table public.plans
add column if not exists ai_analysis jsonb null;

alter table public.plans
add column if not exists ai_analysis_content_hash text null;

alter table public.plans
add column if not exists ai_analysis_generated_at timestamptz null;

alter table if exists public.shared_plan_tasks rename to plan_tasks;

create table if not exists public.plan_tasks (
  share_id text not null references public.plans (share_id) on delete cascade,
  task_id integer not null,
  task_order integer not null default 0,
  unique_id integer null,
  parent_id integer null,
  task_name text not null,
  outline_level integer not null,
  outline_number text null,
  wbs text null,
  start_date date null,
  finish_date date null,
  duration text null,
  percent_complete integer null,
  summary boolean not null default false,
  milestone boolean not null default false,
  predecessors jsonb not null default '[]'::jsonb,
  resource_names text[] not null default '{}'::text[],
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (share_id, task_id)
);

alter table public.plan_tasks
add column if not exists notes text null;

alter table public.plans enable row level security;
alter table public.plan_tasks enable row level security;

-- RLS posture (Phase 1): anon role has SELECT only.
-- All writes (INSERT/UPDATE/DELETE) must use the service-role key from the server.
-- Drop any legacy public write policies so a fresh install matches the locked posture.

drop policy if exists "Public read plans" on public.plans;
create policy "Public read plans"
on public.plans
for select
using (true);

drop policy if exists "Public insert plans" on public.plans;
drop policy if exists "Public update plans" on public.plans;
drop policy if exists "Public delete expired plans" on public.plans;

drop policy if exists "Public read plan tasks" on public.plan_tasks;
create policy "Public read plan tasks"
on public.plan_tasks
for select
using (true);

drop policy if exists "Public insert plan tasks" on public.plan_tasks;
drop policy if exists "Public update plan tasks" on public.plan_tasks;
drop policy if exists "Public delete expired plan tasks" on public.plan_tasks;

comment on table public.plans is
  'RLS posture: anon SELECT only. Writes via service-role key (server-side). owner_user_id reserved for Phase 4 auth.';
comment on table public.plan_tasks is
  'RLS posture: anon SELECT only. Writes via service-role key (server-side).';

-- Phase 4: signed-in users.
-- Phase 4b: tier moved to product_activations (per-product); users.tier dropped.
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users drop column if exists tier;
drop index if exists users_tier_idx;

alter table public.users enable row level security;

drop policy if exists "Users can read their own row" on public.users;
create policy "Users can read their own row"
on public.users
for select
using (auth.uid() = id);

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

-- Phase 4b: per-product activation. Presence of a row signals opt-in.
-- tier is per-product so PlanSight Pro is independent of any future product.
create table if not exists public.product_activations (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_slug text not null,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  activated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_slug)
);

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

-- Phase 5: Stripe billing. Maps a Supabase user to their Stripe customer
-- and active subscription. Written by the Stripe webhook only; gating
-- continues to read product_activations.tier.
create table if not exists public.user_billing (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  subscription_status text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists user_billing_customer_idx
  on public.user_billing (stripe_customer_id);

create index if not exists user_billing_subscription_idx
  on public.user_billing (stripe_subscription_id);

alter table public.user_billing enable row level security;

drop policy if exists "Users can read their own billing" on public.user_billing;
create policy "Users can read their own billing"
on public.user_billing
for select
using (auth.uid() = user_id);

create table if not exists public.feedback_submissions (
  id bigint generated by default as identity primary key,
  feedback_type text not null check (feedback_type in ('general_feedback', 'feature_request', 'bug_report')),
  subject text not null,
  message text not null,
  name text null,
  email text null,
  product text not null default 'AI Solution Maven',
  page_path text null,
  page_url text null,
  source_context text null,
  share_id text null,
  plan_title text null,
  severity text null check (severity in ('low', 'medium', 'high', 'critical')),
  steps_to_reproduce text null,
  desired_outcome text null,
  browser text null,
  user_agent text null,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feedback_submissions_created_at_idx
  on public.feedback_submissions (created_at desc);

create index if not exists feedback_submissions_type_idx
  on public.feedback_submissions (feedback_type, created_at desc);

alter table public.feedback_submissions enable row level security;

drop policy if exists "Public insert feedback submissions" on public.feedback_submissions;
create policy "Public insert feedback submissions"
on public.feedback_submissions
for insert
with check (true);
