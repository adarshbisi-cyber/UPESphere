-- UPESphere Career Resources — add "Business Guide"
-- Run after career-resources-migration.sql. A plain data insert, not a
-- schema change — no frontend code needs to change for this to appear on
-- /career/resources.
--
-- resource_type: 'pdf' — a Drive-hosted document, same shape as the
-- existing McKinsey Winning Applications Guide row.
--
-- Safe to re-run: guarded by title the same way the other seed rows are,
-- since career_resources has no unique constraint on title.

insert into public.career_resources (title, description, category, resource_type, external_url, action_label, tags, is_published, sort_order)
select
  'Business Guide',
  'A guide designed to help students strengthen their understanding of fundamental business concepts, business thinking, and practical business knowledge.',
  'Consulting',
  'pdf',
  'https://drive.google.com/file/d/1xpcoHXNU9-PH0DQsGA7j-uiaUQFf0vQH/view?usp=sharing',
  'View Guide',
  array['Business', 'Business Knowledge', 'Business Concepts', 'Consulting', 'Business Strategy', 'Business Fundamentals', 'Career Preparation'],
  true,
  6
where not exists (
  select 1 from public.career_resources where title = 'Business Guide'
);
