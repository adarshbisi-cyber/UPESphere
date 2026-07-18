-- Timetable versioning migration
-- Run this in the Supabase SQL editor AFTER supabase/onboarding-migration.sql
-- has already been applied.
--
-- Why: uploading a new timetable used to overwrite the old one outright.
-- Instead, every upload becomes a new *version* tagged with when it takes
-- effect, so switching to a new semester's schedule doesn't destroy last
-- semester's history, and a schedule change can be scheduled ("starts next
-- Monday") instead of always applying immediately.

create table if not exists public.timetable_versions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  version int not null,
  effective_from date not null default current_date,
  created_at timestamptz default now()
);

alter table public.timetable_versions enable row level security;

drop policy if exists "Users can manage own timetable versions" on public.timetable_versions;
create policy "Users can manage own timetable versions"
  on public.timetable_versions for all
  using (auth.uid() = user_id);

create index if not exists timetable_versions_user_id_idx on public.timetable_versions(user_id);

-- Link slots to the version they belong to. Existing slots (from before this
-- migration) get backfilled into a single "version 1, effective from today"
-- version per user so nothing already uploaded disappears.
alter table public.timetable_slots add column if not exists version_id uuid references public.timetable_versions(id) on delete cascade;

insert into public.timetable_versions (user_id, version, effective_from)
select distinct user_id, 1, current_date
from public.timetable_slots
where version_id is null;

update public.timetable_slots ts
set version_id = tv.id
from public.timetable_versions tv
where ts.version_id is null
  and tv.user_id = ts.user_id
  and tv.version = 1;

alter table public.timetable_slots alter column version_id set not null;

create index if not exists timetable_slots_version_id_idx on public.timetable_slots(version_id);
