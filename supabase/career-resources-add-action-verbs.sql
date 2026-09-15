-- UPESphere Career Resources — add "Action Verbs – CV 101 Edition"
-- Run after career-resources-migration.sql. A plain data insert, not a
-- schema change — no frontend code needs to change for this to appear on
-- /career/resources.
--
-- resource_type: 'website' as specified. Worth noting for whoever edits
-- this next: the two other Drive-hosted guides in this library (McKinsey
-- Winning Applications Guide, Business Guide) are typed 'pdf', so this row
-- will render a Globe icon and a "Website" badge where those show a
-- document icon. Change the value here if the document framing is wanted
-- instead — nothing else needs touching.
--
-- The description deliberately makes no claim about the source's origin:
-- it is an action-verb reference, not an official publication of any
-- university or firm.
--
-- Safe to re-run: guarded by title the same way the other seed rows are,
-- since career_resources has no unique constraint on title.

insert into public.career_resources (title, description, category, resource_type, external_url, action_label, tags, is_published, sort_order)
select
  'Action Verbs – CV 101 Edition',
  'A practical guide to using stronger, more specific action verbs in resumes. Helps students replace vague task statements with precise language that communicates ownership, contribution, improvement, and results while keeping the wording accurate and credible.',
  'Resume & Applications',
  'website',
  'https://drive.google.com/file/d/1bYO_Lg_kRlTgDzJy0gfJ2zCLB3TTEYL2/view?usp=sharing',
  'View Guide',
  array['Resume', 'CV', 'Action Verbs', 'Resume Writing', 'Applications', 'Career', 'Consulting', 'MBA'],
  true,
  8
where not exists (
  select 1 from public.career_resources where title = 'Action Verbs – CV 101 Edition'
);
