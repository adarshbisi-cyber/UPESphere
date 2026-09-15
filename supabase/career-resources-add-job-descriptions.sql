-- UPESphere Career Resources — add "Job Descriptions"
-- Run after career-resources-migration.sql and
-- career-resources-add-case-books.sql (which introduced the 'folder'
-- resource_type this row uses). A plain data insert — no frontend code
-- needs to change for this to appear on /career/resources.
--
-- resource_type: 'folder' — same as Case Books, Guesstimates and Industry
-- Knowledge, so it renders the Folder icon and the "Collection" badge and
-- reads as a set of documents rather than a single file.
--
-- The description deliberately makes no claim about where the descriptions
-- came from: it is a curated collection for research, not an official
-- publication of any university, company or recruiter.
--
-- Safe to re-run: guarded by title the same way the other seed rows are,
-- since career_resources has no unique constraint on title.

insert into public.career_resources (title, description, category, resource_type, external_url, action_label, tags, is_published, sort_order)
select
  'Job Descriptions',
  'A curated collection of job descriptions to help students understand role requirements, responsibilities, qualifications, skills, and expectations across different career opportunities. Use these descriptions to research target roles and align resumes and applications accordingly.',
  'Resume & Applications',
  'folder',
  'https://drive.google.com/drive/folders/1hA_IT7TkWcXps32TMt1yXJS_CrrnVI1z?usp=sharing',
  'Explore Job Descriptions',
  array['Job Descriptions', 'JD', 'Careers', 'Roles', 'Resume', 'Applications', 'Job Research', 'Career Preparation'],
  true,
  9
where not exists (
  select 1 from public.career_resources where title = 'Job Descriptions'
);
