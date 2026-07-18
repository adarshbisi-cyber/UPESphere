-- Program length migration
-- Run this in the Supabase SQL editor.
--
-- Why: a program's total number of semesters varies by degree (a 4-semester
-- MBA vs an 8-semester B.Tech), so "Degree Progress" can't hardcode /8. We
-- ask for it during onboarding and store it here. Nullable — existing
-- accounts (onboarded before this column existed) fall back to a default in
-- the UI and can set it from the Degree Progress card.

alter table public.profiles add column if not exists total_semesters int;
