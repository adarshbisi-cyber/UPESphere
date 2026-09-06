-- UPESphere Career Resources — add "IIM Resume Template"
-- Run after career-resources-migration.sql. A plain data insert, not a
-- schema change — no frontend code needs to change for this to appear on
-- /career/resources, which is the entire point of that table's design.
--
-- Safe to re-run: guarded by title the same way the first seed row is,
-- since career_resources has no unique constraint on title.

insert into public.career_resources (title, description, category, resource_type, external_url, action_label, tags, is_published, sort_order)
select
  'IIM Resume Template',
  'A professional resume template designed to help students structure and present their academic achievements, professional experiences, leadership positions, and extracurricular accomplishments effectively.',
  'Resume & Applications',
  'google_doc',
  'https://docs.google.com/document/d/1TXeNRIOAcILxbF5FTdW_WgE6QzHAQppEUD-cTfZgcNo/edit?usp=sharing',
  'Open Template',
  array['Resume', 'CV', 'Resume Template', 'IIM', 'Applications', 'Career'],
  true,
  1
where not exists (
  select 1 from public.career_resources where title = 'IIM Resume Template'
);
