-- UPESphere Placement Tracker Migration
-- A strictly personal placement-intelligence tracker: every application and
-- recruitment round belongs to exactly one student, and no other student can
-- ever see it (unlike TeamUp, nothing here is cross-user, so there's no
-- SECURITY DEFINER view pattern needed — plain per-row RLS is sufficient).
--
-- Run this in your Supabase SQL editor AFTER schema.sql. Safe to re-run
-- (every statement is guarded with IF NOT EXISTS / OR REPLACE / DROP POLICY
-- IF EXISTS, matching this project's existing migration style).

-- ============================================================
-- PLACEMENT_APPLICATIONS — one row per company/opportunity a student tracks.
-- `status` is derived from the recruitment journey (see
-- lib/placementTracker/status.ts) rather than hand-maintained, except for
-- the one state a rounds-derivation can't represent: an explicit withdrawal.
-- ============================================================

create table if not exists public.placement_applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  company_name text not null,
  role text not null,
  opportunity_type text check (opportunity_type in ('placement', 'internship', 'ppo', 'other')) not null,
  industry text,
  location text,
  package text, -- free text: CTC format/currency varies too much to constrain
  stipend text,
  application_date date not null,
  status text check (status in ('active', 'offer', 'rejected', 'withdrawn', 'closed')) default 'active' not null,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists placement_applications_user_id_idx on public.placement_applications(user_id);

-- ============================================================
-- PLACEMENT_ROUNDS — a student's recruitment journey for one application.
-- Every round carries BOTH a free-text `display_name` (what the student
-- actually sees, e.g. "Aptitude Test") and a constrained
-- `analytics_category` (what insights group-by, e.g. "assessment") — this is
-- the standardisation mechanism that lets "Aptitude Test" and "Online
-- Assessment" both roll into the same analytics bucket while each
-- application's timeline still shows its own real round names.
-- ============================================================

create table if not exists public.placement_rounds (
  id uuid default gen_random_uuid() primary key,
  application_id uuid references public.placement_applications(id) on delete cascade not null,
  round_order int not null,
  display_name text not null,
  -- No 'application' category — applying isn't an evaluation stage, so a
  -- recruitment round can never legitimately be categorised as one; see
  -- lib/placementTracker/types.ts's AnalyticsCategory for the reasoning.
  analytics_category text check (analytics_category in (
    'resume_screening', 'assessment', 'group_exercise', 'interview', 'final_outcome', 'other'
  )) not null,
  outcome text check (outcome in ('cleared', 'eliminated', 'pending', 'upcoming', 'withdrawn')) default 'upcoming' not null,
  scheduled_date timestamptz, -- has a time component (an interview slot, not just a day)
  completed_date date,
  outcome_notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (application_id, round_order)
);

create index if not exists placement_rounds_application_id_idx on public.placement_rounds(application_id);
create index if not exists placement_rounds_analytics_category_idx on public.placement_rounds(analytics_category);

-- ============================================================
-- PLACEMENT_ROUND_REFLECTIONS — optional, student's own subjective take on
-- why an elimination happened. Deliberately separate from `placement_rounds`
-- itself: the Insights engine's *observed* patterns (elimination rates etc.)
-- must never be blended with a student's *subjective* self-assessment — the
-- UI keeps "Observed Pattern" and "Personal Reflection" visually distinct,
-- and this table's existence (not a column on placement_rounds) makes that
-- separation structural, not just a UI convention.
-- ============================================================

create table if not exists public.placement_round_reflections (
  id uuid default gen_random_uuid() primary key,
  round_id uuid references public.placement_rounds(id) on delete cascade not null unique,
  reflection_type text check (reflection_type in (
    'resume_quality', 'lack_of_preparation', 'aptitude_technical', 'communication',
    'time_management', 'interview_performance', 'case_performance', 'unknown', 'other'
  )) not null,
  notes text,
  created_at timestamptz default now() not null
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.placement_applications enable row level security;
alter table public.placement_rounds enable row level security;
alter table public.placement_round_reflections enable row level security;

drop policy if exists "Users manage own placement applications" on public.placement_applications;
create policy "Users manage own placement applications" on public.placement_applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Rounds/reflections have no user_id column of their own — ownership is
-- checked by joining back to the parent application (standard nested-
-- ownership RLS idiom for a child table).
drop policy if exists "Users manage own placement rounds" on public.placement_rounds;
create policy "Users manage own placement rounds" on public.placement_rounds
  for all using (
    exists (
      select 1 from public.placement_applications a
      where a.id = placement_rounds.application_id and a.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.placement_applications a
      where a.id = placement_rounds.application_id and a.user_id = auth.uid()
    )
  );

drop policy if exists "Users manage own round reflections" on public.placement_round_reflections;
create policy "Users manage own round reflections" on public.placement_round_reflections
  for all using (
    exists (
      select 1 from public.placement_rounds r
      join public.placement_applications a on a.id = r.application_id
      where r.id = placement_round_reflections.round_id and a.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.placement_rounds r
      join public.placement_applications a on a.id = r.application_id
      where r.id = placement_round_reflections.round_id and a.user_id = auth.uid()
    )
  );

-- ============================================================
-- updated_at TRIGGERS — reuses the shared handle_updated_at() from schema.sql.
-- ============================================================

drop trigger if exists placement_applications_updated_at on public.placement_applications;
create trigger placement_applications_updated_at before update on public.placement_applications
  for each row execute procedure public.handle_updated_at();

drop trigger if exists placement_rounds_updated_at on public.placement_rounds;
create trigger placement_rounds_updated_at before update on public.placement_rounds
  for each row execute procedure public.handle_updated_at();
