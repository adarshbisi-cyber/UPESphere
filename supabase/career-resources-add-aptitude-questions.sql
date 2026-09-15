-- UPESphere Career Resources — add "Aptitude Questions & Answers"
-- Run after career-resources-migration.sql. A plain data insert, not a
-- schema change — no frontend code needs to change for this to appear on
-- /career/resources.
--
-- resource_type: 'website' — already in the type enum, and its Globe icon
-- and "Visit Resource" default are defined in
-- lib/careerResources/constants.ts. The action_label below overrides that
-- default with the wording the spec asked for.
--
-- category: 'Placement Preparation' is new, and needs no migration —
-- category is free text and the filter chips are derived from whatever is
-- actually published (see deriveCategories in lib/careerResources/filter.ts).
--
-- Safe to re-run: guarded by title the same way the other seed rows are,
-- since career_resources has no unique constraint on title.

insert into public.career_resources (title, description, category, resource_type, external_url, action_label, tags, is_published, sort_order)
select
  'Aptitude Questions & Answers',
  'A collection of aptitude questions and answers covering key quantitative and logical reasoning topics to help students practise for aptitude tests and placement assessments.',
  'Placement Preparation',
  'website',
  'https://www.geeksforgeeks.org/aptitude/aptitude-questions-and-answers/',
  'Practice Aptitude',
  array[
    'Aptitude', 'Aptitude Questions', 'Quantitative Aptitude', 'Logical Reasoning',
    'Placement Preparation', 'Practice', 'Assessment', 'Interview Preparation'
  ],
  true,
  7
where not exists (
  select 1 from public.career_resources where title = 'Aptitude Questions & Answers'
);
