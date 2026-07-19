-- UPESphere Curriculum Semester Scoping Migration
-- Adds a semester dimension to curriculum_subjects so the Dashboard's
-- "My Courses" widget can show just the current semester's courses instead
-- of one flat, unscoped list.
--
-- Run this in your Supabase SQL editor. Safe to re-run.

alter table public.curriculum_subjects
  add column if not exists semester_number int;

-- ONE-TIME BACKFILL — existing rows predate semester tagging. Best guess:
-- tag them with each user's current semester at the time of migration (the
-- only signal available for a row that was never semester-scoped). Users can
-- correct this later by re-uploading via Academic Workspace → Curriculum,
-- which now asks which semester the upload is for.
update public.curriculum_subjects cs
set semester_number = p.current_semester
from public.profiles p
where cs.user_id = p.id and cs.semester_number is null;

create index if not exists curriculum_subjects_user_semester_idx
  on public.curriculum_subjects(user_id, semester_number);
