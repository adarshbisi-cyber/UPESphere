-- UPESphere Notifications Migration
-- A UPESphere-wide notification system — NOT TeamUp-specific. Any feature can
-- create a notification for a user; this migration wires up the TeamUp and
-- grade-sheet events that exist today, but the table/RLS design doesn't know
-- about TeamUp at all.
--
-- Run this in your Supabase SQL editor AFTER schema.sql and
-- teamup-migration.sql (the TeamUp triggers below reference teams/
-- team_join_requests/team_invitations/team_members/team_skill_requirements).
-- Safe to re-run — every statement is guarded with IF NOT EXISTS / OR REPLACE
-- / DROP POLICY|TRIGGER IF EXISTS.

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
-- `type`/`category` are plain checked text, not lookup tables — unlike
-- skills/competition_types, every type requires its own bespoke title/message
-- generation logic elsewhere in this file, so there's no user-facing "add one
-- via a form" use case that would justify a table. Growing the enum later is
-- a one-line `alter table ... drop constraint ... add constraint ...`.
--
-- `dedupe_key` is the generic duplicate-prevention mechanism: any notification
-- that must fire at most once for a given (user, entity, reason) sets a
-- deterministic key (e.g. 'team_full:<team_id>:<user_id>') and every insert
-- path uses `on conflict (dedupe_key) do nothing`. Notifications that are
-- inherently one-shot from a real row event (a single join-request insert,
-- for instance) don't need one — the triggering event itself can't repeat.
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in (
    'team_join_request', 'team_join_accepted', 'team_join_rejected',
    'team_invitation', 'team_invitation_accepted', 'team_invitation_rejected',
    'team_full', 'team_match', 'competition_deadline',
    'gradesheet_processed', 'gradesheet_failed',
    'system_announcement'
  )),
  category text not null check (category in ('teamup', 'academic', 'system')),
  title text not null,
  message text not null,
  -- Internal route only (e.g. '/teamup/<id>') — never an arbitrary external
  -- URL, so there's no open-redirect/stored-link risk from notification data.
  action_url text,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  dedupe_key text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create unique index if not exists notifications_dedupe_key_key
  on public.notifications (dedupe_key) where dedupe_key is not null;
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id) where is_read = false;

alter table public.notifications enable row level security;

-- No INSERT policy for `authenticated` at all: every notification is created
-- either by a security-definer trigger (TeamUp events, below — these run as
-- the function owner and bypass RLS entirely) or a narrow security-definer
-- RPC that hardcodes its own title/message and only ever targets auth.uid()
-- (see notify_gradesheet_processed below). A client can never insert an
-- arbitrary notification for itself or anyone else.
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Realtime: lets an open session receive another user's action (e.g. Rahul
-- applying to Adarsh's team) without a refresh. RLS still applies to
-- postgres_changes — a client can only ever receive rows it could SELECT.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- ============================================================
-- ACADEMIC EVENTS (client-triggered, self-only)
-- ============================================================
-- Fixed title/message, no client-supplied content — the only thing the
-- caller controls is *that* it fires, for themselves. Future self-notify
-- events (e.g. a future "resume processed") can follow this same narrow-RPC
-- shape; cross-user events should be triggers like the TeamUp ones below.
create or replace function public.notify_gradesheet_processed()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, category, title, message, action_url, entity_type, entity_id)
  values (
    auth.uid(), 'gradesheet_processed', 'academic', 'Grades updated',
    'Your academic dashboard has been updated with your latest grade sheet.',
    '/dashboard', null, null
  );
end;
$$;

grant execute on function public.notify_gradesheet_processed() to authenticated;

-- ============================================================
-- TEAMUP EVENTS (trigger-based — zero changes needed to existing TeamUp
-- client code or RPCs; these observe the same INSERT/UPDATE statements
-- accept_join_request/reject_join_request/accept_team_invitation/createTeam
-- already perform, so notification creation is exactly-once with the row
-- event itself, not with how many times a client refetches.)
-- ============================================================

-- 1. Join request received -> notify the team creator (never the applicant).
create or replace function public.notify_join_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator_id uuid;
  v_competition_name text;
  v_applicant_name text;
begin
  select t.created_by, t.competition_name into v_creator_id, v_competition_name
  from public.teams t where t.id = new.team_id;

  if v_creator_id is null or v_creator_id = new.applicant_id then
    return new;
  end if;

  select full_name into v_applicant_name from public.profiles where id = new.applicant_id;

  insert into public.notifications (user_id, type, category, title, message, action_url, entity_type, entity_id)
  values (
    v_creator_id, 'team_join_request', 'teamup',
    coalesce(v_applicant_name, 'A student') || ' wants to join your team',
    coalesce(v_applicant_name, 'A student') || ' requested to join your team for ' || v_competition_name || '.',
    '/teamup/' || new.team_id, 'team_join_request', new.id
  );
  return new;
end;
$$;

drop trigger if exists team_join_requests_notify_insert on public.team_join_requests;
create trigger team_join_requests_notify_insert
  after insert on public.team_join_requests
  for each row execute function public.notify_join_request();

-- 2/3. Join request accepted/rejected -> notify the applicant.
create or replace function public.notify_join_request_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_competition_name text;
begin
  if new.status = old.status then
    return new;
  end if;

  select competition_name into v_competition_name from public.teams where id = new.team_id;

  if new.status = 'accepted' then
    insert into public.notifications (user_id, type, category, title, message, action_url, entity_type, entity_id)
    values (
      new.applicant_id, 'team_join_accepted', 'teamup', 'You''re in!',
      'Your request to join ' || coalesce(v_competition_name, 'the team') || ' has been accepted.',
      '/teamup/' || new.team_id, 'team', new.team_id
    );
  elsif new.status = 'rejected' then
    insert into public.notifications (user_id, type, category, title, message, action_url, entity_type, entity_id)
    values (
      new.applicant_id, 'team_join_rejected', 'teamup', 'Application update',
      'Your request to join ' || coalesce(v_competition_name, 'the team') || ' was not accepted this time.',
      '/teamup/' || new.team_id, 'team', new.team_id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists team_join_requests_notify_status on public.team_join_requests;
create trigger team_join_requests_notify_status
  after update on public.team_join_requests
  for each row execute function public.notify_join_request_status();

-- 4. Team invitation sent -> notify the invited student.
create or replace function public.notify_team_invitation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_competition_name text;
  v_inviter_name text;
begin
  if new.invited_by = new.invited_user_id then
    return new;
  end if;

  select competition_name into v_competition_name from public.teams where id = new.team_id;
  select full_name into v_inviter_name from public.profiles where id = new.invited_by;

  insert into public.notifications (user_id, type, category, title, message, action_url, entity_type, entity_id)
  values (
    new.invited_user_id, 'team_invitation', 'teamup', 'You''ve been invited to a team',
    coalesce(v_inviter_name, 'A team creator') || ' invited you to join ' || coalesce(v_competition_name, 'their team') || '.',
    '/teamup/mine', 'team_invitation', new.id
  );
  return new;
end;
$$;

drop trigger if exists team_invitations_notify_insert on public.team_invitations;
create trigger team_invitations_notify_insert
  after insert on public.team_invitations
  for each row execute function public.notify_team_invitation();

-- 5/6. Invitation accepted/declined -> notify the inviter (team creator).
create or replace function public.notify_invitation_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_competition_name text;
  v_invitee_name text;
begin
  if new.status = old.status then
    return new;
  end if;

  select competition_name into v_competition_name from public.teams where id = new.team_id;
  select full_name into v_invitee_name from public.profiles where id = new.invited_user_id;

  if new.status = 'accepted' then
    insert into public.notifications (user_id, type, category, title, message, action_url, entity_type, entity_id)
    values (
      new.invited_by, 'team_invitation_accepted', 'teamup',
      coalesce(v_invitee_name, 'A student') || ' accepted your invitation',
      coalesce(v_invitee_name, 'A student') || ' has joined your ' || coalesce(v_competition_name, 'team') || ' team.',
      '/teamup/' || new.team_id, 'team', new.team_id
    );
  elsif new.status = 'declined' then
    insert into public.notifications (user_id, type, category, title, message, action_url, entity_type, entity_id)
    values (
      new.invited_by, 'team_invitation_rejected', 'teamup', 'Invitation update',
      coalesce(v_invitee_name, 'A student') || ' declined the invitation to ' || coalesce(v_competition_name, 'the team') || '.',
      '/teamup/' || new.team_id, 'team', new.team_id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists team_invitations_notify_status on public.team_invitations;
create trigger team_invitations_notify_status
  after update on public.team_invitations
  for each row execute function public.notify_invitation_status();

-- 7. Team reaches capacity -> notify every current member. Guarded on the
-- actual open->full transition (not just "status = full"), so this fires
-- exactly once for that transition regardless of how many times the row is
-- subsequently re-read/refetched by clients. dedupe_key is a second layer of
-- protection against the trigger itself somehow firing twice for the same
-- transition (e.g. a retried transaction).
create or replace function public.notify_team_full()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'full' and old.status is distinct from 'full' then
    insert into public.notifications (user_id, type, category, title, message, action_url, entity_type, entity_id, dedupe_key)
    select
      tm.user_id, 'team_full', 'teamup', 'Your team is complete!',
      new.competition_name || ' now has all ' || new.max_members || ' members.',
      '/teamup/' || new.id, 'team', new.id,
      'team_full:' || new.id || ':' || tm.user_id
    from public.team_members tm
    where tm.team_id = new.id
    on conflict (dedupe_key) where dedupe_key is not null do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists teams_notify_full on public.teams;
create trigger teams_notify_full
  after update on public.teams
  for each row execute function public.notify_team_full();

-- 8. New team matches a looking-for-team student's interests/skills ->
-- relevance-based, not a broadcast. Deterministic matching only (no AI):
-- looking_for_team = true, not the creator, not already a member/applicant,
-- and at least one of (competition-type interest overlap, required-skill
-- overlap). dedupe_key ('team_match:<team>:<user>') means repeatedly editing
-- a team (or the two call sites below both matching the same user) can never
-- produce more than one notification per (user, team) pair.
create or replace function public.notify_team_match_candidates(p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team record;
begin
  select id, created_by, competition_name, competition_type_id, status
  into v_team
  from public.teams
  where id = p_team_id;

  if v_team.id is null or v_team.status <> 'open' then
    return;
  end if;

  insert into public.notifications (user_id, type, category, title, message, action_url, entity_type, entity_id, dedupe_key)
  select
    cp.user_id, 'team_match', 'teamup', 'New team matches your profile',
    v_team.competition_name || ' is looking for teammates that match your skills or interests.',
    '/teamup/' || v_team.id, 'team', v_team.id,
    'team_match:' || v_team.id || ':' || cp.user_id
  from public.competition_profiles cp
  where cp.looking_for_team = true
    and cp.user_id <> v_team.created_by
    and (
      exists (
        select 1 from public.user_competition_interests uci
        where uci.user_id = cp.user_id and uci.competition_type_id = v_team.competition_type_id
      )
      or exists (
        select 1 from public.user_skills us
        join public.team_skill_requirements tsr on tsr.skill_id = us.skill_id
        where us.user_id = cp.user_id and tsr.team_id = v_team.id
      )
    )
    and not exists (select 1 from public.team_members tm where tm.team_id = v_team.id and tm.user_id = cp.user_id)
    and not exists (
      select 1 from public.team_join_requests tjr
      where tjr.team_id = v_team.id and tjr.applicant_id = cp.user_id and tjr.status in ('pending', 'accepted')
    )
  on conflict (dedupe_key) where dedupe_key is not null do nothing;
end;
$$;

-- Fired from two points because the client inserts a team and its required
-- skills in two separate statements (see createTeam in lib/teamup/api.ts):
-- the teams-insert trigger catches interest-only matches immediately, and
-- the team_skill_requirements-insert trigger catches skill matches once
-- those rows land moments later. dedupe_key means a user matched by both
-- still only gets one notification. Scoped to INSERT only (not UPDATE), so
-- editing an existing team's fields never re-triggers matching notifications.
create or replace function public.notify_team_match_on_team_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_team_match_candidates(new.id);
  return new;
end;
$$;

drop trigger if exists teams_notify_match on public.teams;
create trigger teams_notify_match
  after insert on public.teams
  for each row execute function public.notify_team_match_on_team_insert();

create or replace function public.notify_team_match_on_skill_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_team_match_candidates(new.team_id);
  return new;
end;
$$;

drop trigger if exists team_skill_requirements_notify_match on public.team_skill_requirements;
create trigger team_skill_requirements_notify_match
  after insert on public.team_skill_requirements
  for each row execute function public.notify_team_match_on_skill_insert();
