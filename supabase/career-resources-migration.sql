-- UPESphere Career Resources Migration
-- A scalable, admin-managed catalogue of career resources (spreadsheets,
-- docs, PDFs, guides, videos, ...) linked by external URL rather than
-- stored in Supabase Storage — most of these already live somewhere
-- (Google Drive, a public PDF host, a website) and there's no need to
-- duplicate them. There is no admin portal yet, so rows are managed
-- directly in the Supabase dashboard; the table is designed so an admin
-- portal can be layered on top later without a schema change (see the RLS
-- note below).
--
-- Run this in your Supabase SQL editor AFTER schema.sql. Safe to re-run
-- (every statement is guarded with IF NOT EXISTS / OR REPLACE / DROP POLICY
-- IF EXISTS / a WHERE NOT EXISTS seed guard, matching this project's
-- existing migration style).

create table if not exists public.career_resources (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category text not null, -- free text, not an enum — see categoryInference-free filtering in the frontend; new categories need no migration
  resource_type text check (resource_type in (
    'google_sheet', 'google_doc', 'google_slides', 'pdf', 'xlsx', 'docx', 'pptx', 'website', 'video', 'other'
  )) not null,
  external_url text not null,
  action_label text, -- e.g. "Open Database" — frontend falls back to a sensible per-type default if left null
  thumbnail_url text,
  tags text[] not null default '{}',
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists career_resources_published_idx on public.career_resources(is_published);
create index if not exists career_resources_category_idx on public.career_resources(category);
create index if not exists career_resources_tags_idx on public.career_resources using gin(tags);

-- ============================================================
-- ROW LEVEL SECURITY
--
-- Read-only from the student frontend by design: the only policy is a
-- SELECT of published rows. There's deliberately no INSERT/UPDATE/DELETE
-- policy for `authenticated` — with RLS enabled, Postgres denies any
-- action with no matching policy, so this alone is what keeps students
-- from writing resource records, with no separate "read-only role" needed.
-- A future admin portal would authenticate as staff and use the Supabase
-- service role (which bypasses RLS) for writes, or gain its own explicit
-- policy scoped to an admin flag — either way, nothing here needs to change.
-- ============================================================

alter table public.career_resources enable row level security;

drop policy if exists "Authenticated users can view published resources" on public.career_resources;
create policy "Authenticated users can view published resources" on public.career_resources
  for select to authenticated
  using (is_published = true);

drop trigger if exists career_resources_updated_at on public.career_resources;
create trigger career_resources_updated_at before update on public.career_resources
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- SEED — the first resource. Guarded by title rather than a real unique
-- constraint (a resources table shouldn't force title uniqueness generally),
-- so this insert is safe to re-run without duplicating the row.
-- ============================================================

insert into public.career_resources (title, description, category, resource_type, external_url, action_label, tags, is_published, sort_order)
select
  'Consulting Companies Database',
  'A curated database of consulting companies that students can use for company research and exploration.',
  'Consulting',
  'google_sheet',
  'https://docs.google.com/spreadsheets/d/1YHnLOQPR4aA4sQeV_G9dzjtiO1GYZP3RTmaSV8Z0DW0/edit?usp=sharing',
  'Open Database',
  array['Consulting', 'Companies', 'Research', 'Career'],
  true,
  0
where not exists (
  select 1 from public.career_resources where title = 'Consulting Companies Database'
);
