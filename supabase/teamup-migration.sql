-- UPESphere TeamUp Migration
-- Adds the competition team-formation marketplace: a two-sided system where
-- students post teams needing members ("Flow A") and other students discover
-- and request to join them ("Flow B"), plus the reverse (creators inviting
-- students who've marked themselves "Looking for Team").
--
-- Run this in your Supabase SQL editor AFTER schema.sql. Safe to re-run
-- (every statement is guarded with IF NOT EXISTS / OR REPLACE / DROP POLICY
-- IF EXISTS, matching this project's existing migration style).

-- ============================================================
-- LOOKUP TABLES (extensible without a migration — per the brief's explicit
-- "don't hardcode skills/interests in a way that makes adding more difficult")
-- ============================================================

create table if not exists public.competition_types (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  slug text not null unique
);

alter table public.competition_types enable row level security;
drop policy if exists "Anyone can view competition types" on public.competition_types;
create policy "Anyone can view competition types"
  on public.competition_types for select
  using (true);

-- is_custom/created_by/created_at let students add a skill the predefined
-- list is missing (the "+ Other" flow in SkillPicker) without a separate
-- table: a custom skill is just a normal row future users can select too
-- (satisfies "future users should discover these"), and an admin can later
-- "promote" one into the official list with `update skills set is_custom =
-- false where id = ...` — no data migration, since it was always a first-class
-- row in this same table.
create table if not exists public.skills (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  category text not null check (category in ('business', 'technology', 'analytics', 'product_design', 'communication')),
  is_custom boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.skills add column if not exists is_custom boolean not null default false;
alter table public.skills add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.skills add column if not exists created_at timestamptz not null default now();

alter table public.skills enable row level security;
drop policy if exists "Anyone can view skills" on public.skills;
create policy "Anyone can view skills"
  on public.skills for select
  using (true);

-- Any signed-in student can add a custom skill, but only attributed to
-- themselves and only flagged as custom — they can't insert a row posing as
-- an official predefined skill (is_custom = false).
drop policy if exists "Users can add custom skills" on public.skills;
create policy "Users can add custom skills"
  on public.skills for insert
  to authenticated
  with check (is_custom = true and created_by = auth.uid());

insert into public.competition_types (name, slug) values
  ('Case Competition', 'case-competition'),
  ('Hackathon', 'hackathon'),
  ('Ideathon', 'ideathon'),
  ('Business Challenge', 'business-challenge'),
  ('Coding Competition', 'coding-competition'),
  ('Data / Analytics', 'data-analytics'),
  ('Design Competition', 'design-competition'),
  ('Entrepreneurship', 'entrepreneurship'),
  ('Quiz', 'quiz'),
  ('Research', 'research'),
  ('Other', 'other')
on conflict (slug) do nothing;

insert into public.skills (name, category) values
  ('Strategy', 'business'), ('Marketing', 'business'), ('Finance', 'business'),
  ('Operations', 'business'), ('Supply Chain', 'business'), ('Market Research', 'business'),
  ('Market Sizing', 'business'), ('Business Analysis', 'business'), ('Consulting', 'business'),
  ('Python', 'technology'), ('Java', 'technology'), ('JavaScript', 'technology'),
  ('TypeScript', 'technology'), ('React', 'technology'), ('Next.js', 'technology'),
  ('Web Development', 'technology'), ('App Development', 'technology'), ('AI/ML', 'technology'),
  ('Data Science', 'technology'), ('Cloud', 'technology'), ('Backend Development', 'technology'),
  ('Excel', 'analytics'), ('SQL', 'analytics'), ('Power BI', 'analytics'),
  ('Tableau', 'analytics'), ('Python Analytics', 'analytics'), ('Data Analytics', 'analytics'),
  ('Financial Modelling', 'analytics'),
  ('Product Management', 'product_design'), ('UI/UX', 'product_design'), ('Figma', 'product_design'),
  ('Canva', 'product_design'), ('Graphic Design', 'product_design'), ('Prototyping', 'product_design'),
  ('PowerPoint', 'communication'), ('Presentation', 'communication'), ('Pitching', 'communication'),
  ('Storytelling', 'communication'), ('Public Speaking', 'communication'), ('Content Writing', 'communication')
on conflict (name) do nothing;

-- ============================================================
-- PUBLIC-SAFE PROFILE VIEW
-- ============================================================
-- profiles' own RLS restricts SELECT to `auth.uid() = id` (a user can only
-- read their own row) — correct for the rest of the app, but TeamUp is the
-- first feature that needs to show OTHER users' names/avatars (team
-- creators, members, applicants). Rather than weaken profiles' existing
-- policy, this view exposes only the safe public subset (never email) and
-- is grantable independently. Standard Postgres/Supabase pattern: a plain
-- view (no security_invoker) runs as the view owner for table access, so it
-- can expose a safe slice of an otherwise-locked-down table.
--
-- Supabase's linter flags this as a "Security Definer View" (critical) —
-- that's expected and correct for what this view does, DO NOT "fix" it by
-- adding `with (security_invoker = on)`. Invoker mode would re-apply
-- profiles' own `auth.uid() = id` policy through the view, so every caller
-- would only ever see their own row and TeamUp's cross-user name/avatar
-- lookups would silently return nothing. Dismiss the linter finding instead.
--
-- ALLOWED COLUMNS (safe to select — no PII, no private links):
--   id, full_name, avatar_url, university_id
-- NEVER ADD (would leak through this view to every authenticated/anon user):
--   email, resume_file_url, or any other column added to profiles later
--   that isn't already public-safe. See test/supabase/teamup-views-security.test.ts,
--   which fails the build if either forbidden column shows up in this select list.
create or replace view public.public_profiles as
select id, full_name, avatar_url, university_id
from public.profiles;

grant select on public.public_profiles to authenticated, anon;

-- ============================================================
-- COMPETITION PROFILE (1:1 extension of profiles, not new columns on it)
-- ============================================================

create table if not exists public.competition_profiles (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  looking_for_team boolean not null default false,
  availability text,
  experience_level text check (experience_level in ('Beginner', 'Some Experience', 'Experienced')),
  competitions_completed int not null default 0 check (competitions_completed >= 0),
  bio text,
  -- Contact reveal is opt-in and scoped to accepted teammates only (see
  -- get_team_contacts below) — never selectable through the public view.
  share_whatsapp_with_teammates boolean not null default false,
  whatsapp_number text,
  share_email_with_teammates boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.competition_profiles enable row level security;

drop policy if exists "Users can view own competition profile" on public.competition_profiles;
create policy "Users can view own competition profile"
  on public.competition_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own competition profile" on public.competition_profiles;
create policy "Users can insert own competition profile"
  on public.competition_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own competition profile" on public.competition_profiles;
create policy "Users can update own competition profile"
  on public.competition_profiles for update
  using (auth.uid() = user_id);

drop trigger if exists competition_profiles_updated_at on public.competition_profiles;
create trigger competition_profiles_updated_at before update on public.competition_profiles
  for each row execute procedure public.handle_updated_at();

-- Public-safe subset for "Looking for Team" discovery — excludes the raw
-- whatsapp_number (and the table itself isn't publicly selectable), so a
-- discovery browse can never leak contact details, consented or not.
--
-- Same linter note as public_profiles above: this also trips the "Security
-- Definer View" (critical) finding, and for the same reason it must NOT be
-- "fixed" with `security_invoker = on` — competition_profiles' own RLS is
-- `auth.uid() = user_id` (own row only), and lib/teamup/api.ts's
-- getStudentsLookingForTeam() (backs /teamup/students) depends on this view
-- showing OTHER users' rows. Invoker mode would make discovery show nothing.
-- Dismiss the linter finding instead.
--
-- ALLOWED COLUMNS: user_id, looking_for_team, availability, experience_level,
--   competitions_completed, bio, share_whatsapp_with_teammates, share_email_with_teammates
--   (the share_* columns are just consent booleans, not the contact info itself)
-- NEVER ADD: whatsapp_number, or any other raw contact field added later.
--   See test/supabase/teamup-views-security.test.ts.
create or replace view public.public_competition_profiles as
select user_id, looking_for_team, availability, experience_level,
       competitions_completed, bio, share_whatsapp_with_teammates, share_email_with_teammates
from public.competition_profiles
where looking_for_team = true;

grant select on public.public_competition_profiles to authenticated, anon;

create table if not exists public.user_competition_interests (
  user_id uuid references public.profiles(id) on delete cascade not null,
  competition_type_id uuid references public.competition_types(id) on delete cascade not null,
  primary key (user_id, competition_type_id)
);

alter table public.user_competition_interests enable row level security;
drop policy if exists "Anyone can view competition interests" on public.user_competition_interests;
create policy "Anyone can view competition interests"
  on public.user_competition_interests for select
  using (true);
drop policy if exists "Users manage own competition interests" on public.user_competition_interests;
create policy "Users manage own competition interests"
  on public.user_competition_interests for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.user_skills (
  user_id uuid references public.profiles(id) on delete cascade not null,
  skill_id uuid references public.skills(id) on delete cascade not null,
  primary key (user_id, skill_id)
);

alter table public.user_skills enable row level security;
drop policy if exists "Anyone can view user skills" on public.user_skills;
create policy "Anyone can view user skills"
  on public.user_skills for select
  using (true);
drop policy if exists "Users manage own skills" on public.user_skills;
create policy "Users manage own skills"
  on public.user_skills for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- TEAMS
-- ============================================================
-- Competition fields (name/type/platform/url/deadline) are flattened onto
-- teams rather than a separate `competitions` table — the brief's own
-- Create Team form enters them inline with no "search existing competition"
-- step, and the MVP never needs to dedup/browse competitions independent of
-- the teams recruiting for them.

create table if not exists public.teams (
  id uuid default gen_random_uuid() primary key,
  created_by uuid references public.profiles(id) on delete cascade not null,
  competition_name text not null,
  competition_type_id uuid references public.competition_types(id) not null,
  competition_platform text,
  competition_url text,
  registration_deadline date not null,
  max_members int not null check (max_members > 0),
  -- Set directly from the creator's "Current Team Size" form field (which
  -- already includes the creator, and may include teammates who aren't
  -- UPESphere users) — NOT derived by counting team_members rows, since
  -- team_members only tracks members who joined *through* TeamUp.
  current_members int not null default 1 check (current_members >= 0),
  experience_preference text check (experience_preference in
    ('Beginner Friendly', 'Some Experience Preferred', 'Experienced Participants Preferred')),
  description text not null,
  additional_requirements text,
  -- open: accepting applications. full: hit max_members. closed: creator
  -- paused recruitment (reopenable). cancelled: creator called it off (terminal).
  status text not null default 'open' check (status in ('open', 'full', 'closed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (current_members <= max_members)
);

alter table public.teams enable row level security;

drop policy if exists "Anyone can view teams" on public.teams;
create policy "Anyone can view teams"
  on public.teams for select
  using (true);

drop policy if exists "Users can create own teams" on public.teams;
create policy "Users can create own teams"
  on public.teams for insert
  with check (auth.uid() = created_by);

drop policy if exists "Creators can update own teams" on public.teams;
create policy "Creators can update own teams"
  on public.teams for update
  using (auth.uid() = created_by);

drop trigger if exists teams_updated_at on public.teams;
create trigger teams_updated_at before update on public.teams
  for each row execute procedure public.handle_updated_at();

create index if not exists teams_status_deadline_idx on public.teams(status, registration_deadline);
create index if not exists teams_created_by_idx on public.teams(created_by);

create table if not exists public.team_skill_requirements (
  team_id uuid references public.teams(id) on delete cascade not null,
  skill_id uuid references public.skills(id) on delete cascade not null,
  primary key (team_id, skill_id)
);

alter table public.team_skill_requirements enable row level security;
drop policy if exists "Anyone can view team skill requirements" on public.team_skill_requirements;
create policy "Anyone can view team skill requirements"
  on public.team_skill_requirements for select
  using (true);
drop policy if exists "Creators manage own team skill requirements" on public.team_skill_requirements;
create policy "Creators manage own team skill requirements"
  on public.team_skill_requirements for all
  using (exists (select 1 from public.teams t where t.id = team_id and t.created_by = auth.uid()))
  with check (exists (select 1 from public.teams t where t.id = team_id and t.created_by = auth.uid()));

-- ============================================================
-- TEAM MEMBERS
-- ============================================================
-- The only INSERT path from the client is the creator adding themselves at
-- team-creation time. Every other member add goes through accept_join_request
-- / accept_team_invitation below (security definer, bypasses this RLS by
-- design — that's what makes the capacity check atomic and un-bypassable).

create table if not exists public.team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('creator', 'member')),
  joined_at timestamptz default now(),
  unique (team_id, user_id)
);

alter table public.team_members enable row level security;

drop policy if exists "Anyone can view team members" on public.team_members;
create policy "Anyone can view team members"
  on public.team_members for select
  using (true);

drop policy if exists "Creators can add themselves as creator" on public.team_members;
create policy "Creators can add themselves as creator"
  on public.team_members for insert
  with check (
    auth.uid() = user_id
    and role = 'creator'
    and exists (select 1 from public.teams t where t.id = team_id and t.created_by = auth.uid())
  );

create index if not exists team_members_user_id_idx on public.team_members(user_id);
create index if not exists team_members_team_id_idx on public.team_members(team_id);

-- ============================================================
-- JOIN REQUESTS
-- ============================================================

create table if not exists public.team_join_requests (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  applicant_id uuid references public.profiles(id) on delete cascade not null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Partial unique index (not a table-level unique constraint): blocks a
-- second *pending* application to the same team, while still allowing a
-- re-application after a prior one was rejected or cancelled.
create unique index if not exists team_join_requests_one_pending_per_user
  on public.team_join_requests (team_id, applicant_id)
  where status = 'pending';

alter table public.team_join_requests enable row level security;

drop policy if exists "Applicants and creators can view requests" on public.team_join_requests;
create policy "Applicants and creators can view requests"
  on public.team_join_requests for select
  using (
    auth.uid() = applicant_id
    or exists (select 1 from public.teams t where t.id = team_id and t.created_by = auth.uid())
  );

drop policy if exists "Users can apply as themselves" on public.team_join_requests;
create policy "Users can apply as themselves"
  on public.team_join_requests for insert
  with check (
    auth.uid() = applicant_id
    and not exists (select 1 from public.teams t where t.id = team_id and t.created_by = auth.uid())
  );

-- Applicants may only cancel their own pending request directly — accept/
-- reject are handled exclusively by the RPCs below, so a creator can never
-- accept a request via a raw UPDATE that skips the capacity check.
drop policy if exists "Applicants can cancel own pending request" on public.team_join_requests;
create policy "Applicants can cancel own pending request"
  on public.team_join_requests for update
  using (auth.uid() = applicant_id)
  with check (auth.uid() = applicant_id and status = 'cancelled');

drop trigger if exists team_join_requests_updated_at on public.team_join_requests;
create trigger team_join_requests_updated_at before update on public.team_join_requests
  for each row execute procedure public.handle_updated_at();

create index if not exists team_join_requests_team_id_idx on public.team_join_requests(team_id);
create index if not exists team_join_requests_applicant_id_idx on public.team_join_requests(applicant_id);

-- ============================================================
-- INVITATIONS
-- ============================================================

create table if not exists public.team_invitations (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  invited_user_id uuid references public.profiles(id) on delete cascade not null,
  invited_by uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists team_invitations_one_pending_per_user
  on public.team_invitations (team_id, invited_user_id)
  where status = 'pending';

alter table public.team_invitations enable row level security;

drop policy if exists "Invitees and inviters can view invitations" on public.team_invitations;
create policy "Invitees and inviters can view invitations"
  on public.team_invitations for select
  using (auth.uid() = invited_user_id or auth.uid() = invited_by);

drop policy if exists "Creators can invite to own teams" on public.team_invitations;
create policy "Creators can invite to own teams"
  on public.team_invitations for insert
  with check (
    auth.uid() = invited_by
    and exists (select 1 from public.teams t where t.id = team_id and t.created_by = auth.uid())
  );

-- Invitee can decline directly; creator can cancel their own pending
-- invite directly. Accept goes through accept_team_invitation (capacity check).
drop policy if exists "Invitee declines or inviter cancels" on public.team_invitations;
create policy "Invitee declines or inviter cancels"
  on public.team_invitations for update
  using (auth.uid() = invited_user_id or auth.uid() = invited_by)
  with check (
    (auth.uid() = invited_user_id and status = 'declined')
    or (auth.uid() = invited_by and status = 'cancelled')
  );

drop trigger if exists team_invitations_updated_at on public.team_invitations;
create trigger team_invitations_updated_at before update on public.team_invitations
  for each row execute procedure public.handle_updated_at();

create index if not exists team_invitations_invited_user_id_idx on public.team_invitations(invited_user_id);
create index if not exists team_invitations_team_id_idx on public.team_invitations(team_id);

-- ============================================================
-- CONCURRENCY-SAFE RPCS
-- ============================================================
-- The single guarded UPDATE in each of these (`... where current_members <
-- max_members`) is what actually prevents overfilling a team under
-- concurrent accepts — Postgres takes a row lock for the UPDATE, so two
-- simultaneous calls for the same team serialize: the first commits and
-- increments the count, the second's WHERE clause then matches zero rows
-- and `if not found` raises a clean "team is full" error. This is enforced
-- in the database, not just in the application.

create or replace function public.accept_join_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_applicant_id uuid;
begin
  select tjr.team_id, tjr.applicant_id into v_team_id, v_applicant_id
  from public.team_join_requests tjr
  where tjr.id = p_request_id and tjr.status = 'pending';

  if v_team_id is null then
    raise exception 'Request not found or already handled';
  end if;

  if not exists (select 1 from public.teams where id = v_team_id and created_by = auth.uid()) then
    raise exception 'Only the team creator can accept requests';
  end if;

  update public.teams
  set current_members = current_members + 1,
      status = case when current_members + 1 >= max_members then 'full' else status end
  where id = v_team_id and current_members < max_members and status in ('open');

  if not found then
    raise exception 'Team is already full';
  end if;

  update public.team_join_requests set status = 'accepted' where id = p_request_id;

  insert into public.team_members (team_id, user_id, role)
  values (v_team_id, v_applicant_id, 'member')
  on conflict (team_id, user_id) do nothing;
end;
$$;

create or replace function public.reject_join_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator_id uuid;
begin
  select t.created_by into v_creator_id
  from public.team_join_requests tjr
  join public.teams t on t.id = tjr.team_id
  where tjr.id = p_request_id and tjr.status = 'pending';

  if v_creator_id is null then
    raise exception 'Request not found or already handled';
  end if;
  if auth.uid() <> v_creator_id then
    raise exception 'Only the team creator can reject requests';
  end if;

  update public.team_join_requests set status = 'rejected' where id = p_request_id;
end;
$$;

create or replace function public.accept_team_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_invited_user_id uuid;
begin
  select ti.team_id, ti.invited_user_id into v_team_id, v_invited_user_id
  from public.team_invitations ti
  where ti.id = p_invitation_id and ti.status = 'pending';

  if v_team_id is null then
    raise exception 'Invitation not found or already handled';
  end if;

  if auth.uid() <> v_invited_user_id then
    raise exception 'Only the invited user can accept this invitation';
  end if;

  update public.teams
  set current_members = current_members + 1,
      status = case when current_members + 1 >= max_members then 'full' else status end
  where id = v_team_id and current_members < max_members and status in ('open');

  if not found then
    raise exception 'Team is already full';
  end if;

  update public.team_invitations set status = 'accepted' where id = p_invitation_id;

  insert into public.team_members (team_id, user_id, role)
  values (v_team_id, v_invited_user_id, 'member')
  on conflict (team_id, user_id) do nothing;
end;
$$;

-- Reveals a teammate's opted-in contact details, but only to a caller who is
-- themselves an accepted member (or creator) of the SAME team — "reveal only
-- after membership is accepted", enforced server-side, not by hiding a button.
create or replace function public.get_team_contacts(p_team_id uuid)
returns table (user_id uuid, full_name text, whatsapp_number text, email text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.team_members where team_id = p_team_id and user_id = auth.uid()
  ) then
    raise exception 'Only team members can view teammate contact info';
  end if;

  return query
  select
    p.id,
    p.full_name,
    case when cp.share_whatsapp_with_teammates then cp.whatsapp_number else null end,
    case when cp.share_email_with_teammates then p.email else null end
  from public.team_members tm
  join public.profiles p on p.id = tm.user_id
  left join public.competition_profiles cp on cp.user_id = tm.user_id
  where tm.team_id = p_team_id;
end;
$$;

grant execute on function public.accept_join_request(uuid) to authenticated;
grant execute on function public.reject_join_request(uuid) to authenticated;
grant execute on function public.accept_team_invitation(uuid) to authenticated;
grant execute on function public.get_team_contacts(uuid) to authenticated;
