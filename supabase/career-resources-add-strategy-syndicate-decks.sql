-- UPESphere Career Resources — add "The Strategy Syndicate – Session Decks"
-- Run after career-resources-migration.sql and
-- career-resources-add-case-books.sql (which introduced the 'folder'
-- resource_type this row uses). A plain data insert — no frontend code
-- needs to change for this to appear on /career/resources.
--
-- resource_type: 'folder' — same as Case Books, Guesstimates and Industry
-- Knowledge, so it renders the Folder icon and "Collection" badge and reads
-- as a set of documents rather than a single file.
--
-- Only the folder URL is stored, never the decks themselves. The folder is
-- expected to gain new session material over time, and pointing at it means
-- those appear without any change here — which would not be true if the
-- files had been copied into Storage.
--
-- The description frames this as cohort material: it is curated learning
-- content from The Strategy Syndicate sessions, not an official publication
-- of any university, consulting firm or other institution.
--
-- Safe to re-run: guarded by title the same way the other seed rows are,
-- since career_resources has no unique constraint on title.

insert into public.career_resources (title, description, category, resource_type, external_url, action_label, tags, is_published, sort_order)
select
  'The Strategy Syndicate – Session Decks',
  'A collection of presentation decks and learning materials from the sessions conducted as part of The Strategy Syndicate cohort. Use these resources to revisit session concepts, frameworks, examples, and preparation material covered during the cohort.',
  'Consulting',
  'folder',
  'https://drive.google.com/drive/folders/1zAbcIr4BEABFMcUp_0C4QCmAz5K5-qCE?usp=sharing',
  'Explore Session Decks',
  array[
    'The Strategy Syndicate', 'Strategy Syndicate', 'Consulting', 'Session Decks',
    'Consulting Preparation', 'Case Preparation', 'Career', 'Learning Resources'
  ],
  true,
  10
where not exists (
  select 1 from public.career_resources where title = 'The Strategy Syndicate – Session Decks'
);
