-- UPESphere Career Resources — add "Guesstimates"
-- Run after career-resources-migration.sql and
-- career-resources-add-case-books.sql (which introduced the 'folder'
-- resource_type this row uses). A plain data insert — no frontend code
-- needs to change for this to appear on /career/resources.
--
-- Safe to re-run: guarded by title the same way the other seed rows are,
-- since career_resources has no unique constraint on title.

insert into public.career_resources (title, description, category, resource_type, external_url, action_label, tags, is_published, sort_order)
select
  'Guesstimates',
  'A curated collection of guesstimate and estimation resources to help students practise structured problem-solving, develop quantitative reasoning, and improve their ability to approach estimation-based questions.',
  'Consulting',
  'folder',
  'https://drive.google.com/drive/folders/1HPh2yZ_J1e2Ty3dYuC6Q2ZjN1layBkUy?usp=sharing',
  'Explore Guesstimates',
  array['Guesstimates', 'Estimation', 'Consulting', 'Problem Solving', 'Quantitative Reasoning', 'Case Preparation', 'Interview Preparation'],
  true,
  4
where not exists (
  select 1 from public.career_resources where title = 'Guesstimates'
);
