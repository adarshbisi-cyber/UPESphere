-- UPESphere Career Resources — add "McKinsey Winning Applications Guide"
-- Run after career-resources-migration.sql. A plain data insert, not a
-- schema change — no frontend code needs to change for this to appear on
-- /career/resources.
--
-- resource_type: 'pdf' — a Drive-hosted document is the same "external PDF/
-- document" shape the existing pdf type already covers; no new enum value
-- needed.
--
-- Safe to re-run: guarded by title the same way the other seed rows are,
-- since career_resources has no unique constraint on title.

insert into public.career_resources (title, description, category, resource_type, external_url, action_label, tags, is_published, sort_order)
select
  'McKinsey Winning Applications Guide',
  'A guide designed to help students understand and improve their approach to building strong applications.',
  'Resume & Applications',
  'pdf',
  'https://drive.google.com/file/d/1z5ex4VelxpzObXlkrcSRNlz1V0lV2aHC/view?usp=sharing',
  'View Guide',
  array['McKinsey', 'Applications', 'Resume', 'Career', 'Consulting', 'Application Guide'],
  true,
  2
where not exists (
  select 1 from public.career_resources where title = 'McKinsey Winning Applications Guide'
);
