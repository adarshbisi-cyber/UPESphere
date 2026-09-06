-- UPESphere Career Resources — add "Case Books"
-- Run after career-resources-migration.sql.
--
-- This resource is a Google Drive folder (a collection, not a single file),
-- so it needs a new resource_type value — 'folder' — that the frontend
-- renders with a folder icon and a "Collection" badge (see
-- lib/careerResources/constants.ts). Everything else is a plain data
-- insert; no other frontend change is needed for it to appear on
-- /career/resources.
--
-- Safe to re-run: the constraint widen is drop-then-add (idempotent), and
-- the insert is guarded by title the same way the other seed rows are,
-- since career_resources has no unique constraint on title.

alter table public.career_resources drop constraint if exists career_resources_resource_type_check;
alter table public.career_resources add constraint career_resources_resource_type_check check (resource_type in (
  'google_sheet', 'google_doc', 'google_slides', 'pdf', 'xlsx', 'docx', 'pptx', 'website', 'video', 'folder', 'other'
));

insert into public.career_resources (title, description, category, resource_type, external_url, action_label, tags, is_published, sort_order)
select
  'Case Books',
  'A curated collection of case books and case interview preparation resources to help students practise consulting cases, understand different case-solving approaches, and strengthen their case interview preparation.',
  'Consulting',
  'folder',
  'https://drive.google.com/drive/folders/16KQ3YoEEmg-BbuAlAEtoqarnIAEGXYPf?usp=sharing',
  'Explore Case Books',
  array['Consulting', 'Case Interview', 'Case Books', 'Case Preparation', 'Case Practice', 'Interview Preparation'],
  true,
  3
where not exists (
  select 1 from public.career_resources where title = 'Case Books'
);
