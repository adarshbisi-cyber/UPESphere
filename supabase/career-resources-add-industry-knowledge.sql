-- UPESphere Career Resources — add "Industry Knowledge"
-- Run after career-resources-migration.sql and
-- career-resources-add-case-books.sql (which introduced the 'folder'
-- resource_type this row uses). A plain data insert — no frontend code
-- needs to change for this to appear on /career/resources.
--
-- Safe to re-run: guarded by title the same way the other seed rows are,
-- since career_resources has no unique constraint on title.

insert into public.career_resources (title, description, category, resource_type, external_url, action_label, tags, is_published, sort_order)
select
  'Industry Knowledge',
  'A curated collection of industry knowledge and research resources to help students build a stronger understanding of different industries, business sectors, market trends, and industry-specific concepts.',
  'Consulting',
  'folder',
  'https://drive.google.com/drive/folders/1fcQG9Th60AWK9oFO4MKZH-Z78tzGIrXT?usp=sharing',
  'Explore Industry Knowledge',
  array['Industry Knowledge', 'Industries', 'Industry Research', 'Market Research', 'Business', 'Consulting', 'Market Trends', 'Sector Knowledge'],
  true,
  5
where not exists (
  select 1 from public.career_resources where title = 'Industry Knowledge'
);
