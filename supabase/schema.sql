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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (share_id, task_id)
);

alter table public.plans enable row level security;
alter table public.plan_tasks enable row level security;

drop policy if exists "Public read plans" on public.plans;
create policy "Public read plans"
on public.plans
for select
using (true);

drop policy if exists "Public insert plans" on public.plans;
create policy "Public insert plans"
on public.plans
for insert
with check (true);

drop policy if exists "Public update plans" on public.plans;
create policy "Public update plans"
on public.plans
for update
using (true)
with check (true);

drop policy if exists "Public delete expired plans" on public.plans;
create policy "Public delete expired plans"
on public.plans
for delete
using (owner_type = 'guest' and expires_at is not null and expires_at < now());

drop policy if exists "Public read plan tasks" on public.plan_tasks;
create policy "Public read plan tasks"
on public.plan_tasks
for select
using (true);

drop policy if exists "Public insert plan tasks" on public.plan_tasks;
create policy "Public insert plan tasks"
on public.plan_tasks
for insert
with check (true);

drop policy if exists "Public update plan tasks" on public.plan_tasks;
create policy "Public update plan tasks"
on public.plan_tasks
for update
using (true)
with check (true);

drop policy if exists "Public delete expired plan tasks" on public.plan_tasks;
create policy "Public delete expired plan tasks"
on public.plan_tasks
for delete
using (
  exists (
    select 1
    from public.plans sp
    where sp.share_id = plan_tasks.share_id
      and sp.owner_type = 'guest'
      and sp.expires_at is not null
      and sp.expires_at < now()
  )
);
