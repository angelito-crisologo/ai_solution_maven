-- Phase 8: per-user week-start preference for the Weekly Status Report.
--
-- Some regions and industries operate on Sunday–Saturday weeks rather than
-- Monday–Sunday. Storing this preference on public.users lets the report
-- compute reporting-period boundaries consistently for that user across
-- sessions, devices, and team handoffs.
--
-- Default is 'monday' which matches the existing implicit behaviour and
-- ISO 8601 conventions.
--
-- Run after 07. Idempotent.

alter table public.users
  add column if not exists week_start_day text not null default 'monday';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_week_start_day_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_week_start_day_check
      check (week_start_day in ('monday', 'sunday'));
  end if;
end $$;

comment on column public.users.week_start_day is
  'Per-user week boundary preference. Drives the Weekly Status Report reporting-period math. Mon-Sun (default) or Sun-Sat.';
