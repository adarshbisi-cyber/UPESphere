-- UPESphere Career Resources — withdraw "Job Descriptions"
--
-- Run after career-resources-add-job-descriptions.sql. Safe to re-run.
--
-- Unpublished rather than deleted, for two reasons:
--
--  1. is_published is how this catalogue is managed. It gates the resource
--     at two levels — getPublishedResources filters on it, and the RLS
--     policy only permits selecting published rows — so an unpublished
--     resource isn't merely hidden by the UI, the database won't return it
--     to the client at all.
--
--  2. Deleting would not survive a re-run. The seed insert is guarded by
--     `where not exists (... title = 'Job Descriptions')`, so a deleted row
--     would simply be re-created, published, the next time migrations were
--     applied. Unpublishing is stable: the seed's guard still sees the row
--     and skips, and this statement then keeps it unpublished — so a fresh
--     database and an existing one converge on the same state.
--
-- Matched on title AND external_url so this can only ever affect the one
-- intended record, even if a similarly-titled resource is added later.
-- The Drive folder itself is untouched.

update public.career_resources
set is_published = false
where title = 'Job Descriptions'
  and external_url = 'https://drive.google.com/drive/folders/1hA_IT7TkWcXps32TMt1yXJS_CrrnVI1z?usp=sharing';
