-- UPESphere Onboarding Migration
-- Adds first-time workspace setup: profile fields, curriculum drafts,
-- timetable slots, and resume storage.
--
-- Run this in your Supabase SQL editor AFTER schema.sql. Safe to re-run
-- (every statement is guarded with IF NOT EXISTS / OR REPLACE).

-- ===== PROFILES: onboarding fields =====
alter table public.profiles
  add column if not exists university text,
  add column if not exists course text,
  add column if not exists graduation_year int,
  add column if not exists workspace_completion int not null default 0
    check (workspace_completion >= 0 and workspace_completion <= 100),
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists resume_file_url text;

-- ONE-TIME BACKFILL — run this once, right after the ALTER above.
-- New signups correctly default to onboarding_completed = false (they should
-- go through the new setup flow). Without this backfill, every EXISTING
-- account would also default to false and get redirected to /workspace/setup
-- on their next dashboard visit — spare pre-existing users from a flow that
-- didn't exist when they signed up. Skip this statement only if you *want*
-- existing accounts to go through onboarding too.
update public.profiles set onboarding_completed = true where onboarding_completed = false;


-- ===== CURRICULUM SUBJECTS (draft, no grade yet) =====
-- Populated by the onboarding "Curriculum" step (parsed from an uploaded
-- syllabus PDF). Ungraded — the GPA Calculator reads these to pre-fill a new
-- semester's subject list, rather than living in `subjects` (which requires
-- a grade) or `gpa_records` (which requires an SGPA).
create table if not exists public.curriculum_subjects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  credits int not null check (credits > 0),
  created_at timestamptz default now()
);

alter table public.curriculum_subjects enable row level security;

drop policy if exists "Users can manage own curriculum subjects" on public.curriculum_subjects;
create policy "Users can manage own curriculum subjects"
  on public.curriculum_subjects for all
  using (auth.uid() = user_id);

create index if not exists curriculum_subjects_user_id_idx on public.curriculum_subjects(user_id);


-- ===== TIMETABLE SLOTS =====
-- Populated by the onboarding "Timetable" step (parsed from an uploaded
-- weekly scheduler PDF).
create table if not exists public.timetable_slots (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  day_of_week text not null check (day_of_week in
    ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time text not null, -- 'HH:MM'
  end_time text not null,   -- 'HH:MM'
  subject text not null,
  room text,
  created_at timestamptz default now()
);

alter table public.timetable_slots enable row level security;

drop policy if exists "Users can manage own timetable slots" on public.timetable_slots;
create policy "Users can manage own timetable slots"
  on public.timetable_slots for all
  using (auth.uid() = user_id);

create index if not exists timetable_slots_user_id_idx on public.timetable_slots(user_id);


-- ===== RESUME STORAGE BUCKET =====
-- Private bucket; each user's resume lives at "<user_id>/<filename>". The
-- bucket itself can also be created via the Supabase dashboard UI (Storage →
-- New bucket → name "resumes", uncheck "Public") — this statement is here so
-- the whole setup can be applied from one script.
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload own resume" on storage.objects;
create policy "Users can upload own resume"
  on storage.objects for insert
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can view own resume" on storage.objects;
create policy "Users can view own resume"
  on storage.objects for select
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update own resume" on storage.objects;
create policy "Users can update own resume"
  on storage.objects for update
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own resume" on storage.objects;
create policy "Users can delete own resume"
  on storage.objects for delete
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
