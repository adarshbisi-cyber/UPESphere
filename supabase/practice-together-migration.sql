-- UPESphere Practice Together
--
-- Peer-to-peer practice sessions under Community, alongside TeamUp. The
-- shape deliberately mirrors TeamUp's (sessions ~ teams, participants ~
-- team_members, join requests ~ team_join_requests) because the mechanic is
-- the same: a host-owned container with a capacity, an approval queue, and
-- membership. Reusing that shape means the same concurrency guarantees and
-- the same RLS reasoning apply, rather than inventing a second set.
--
-- Run after schema.sql and notifications-migration.sql. Safe to re-run.

-- ============================================================
-- PRACTICE_SESSIONS
-- ============================================================

create table if not exists public.practice_sessions (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,

  practice_type text not null check (practice_type in (
    'case_prep', 'guesstimate', 'group_discussion', 'mock_interview', 'hr_interview', 'aptitude', 'other'
  )),
  -- Only meaningful when practice_type = 'other'; the UI shows this instead.
  custom_practice_type text,

  title text not null,
  description text,

  scheduled_date date not null,
  start_time time not null,
  duration_minutes int not null check (duration_minutes > 0 and duration_minutes <= 480),

  mode text not null default 'online' check (mode in ('online', 'offline')),
  location text,      -- offline sessions
  meeting_link text,  -- online sessions; added later from Manage Session

  experience_level text not null default 'any' check (experience_level in
    ('any', 'beginner', 'intermediate', 'advanced')),
  college_preference text not null default 'any' check (college_preference in ('any', 'my_college')),

  -- The host occupies the first seat, so a session is never created empty.
  min_participants int not null default 2 check (min_participants >= 2),
  max_participants int not null check (max_participants >= 2),
  current_participants int not null default 1 check (current_participants >= 0),

  status text not null default 'open' check (status in ('open', 'full', 'completed', 'cancelled')),

  -- Per-type fields (case type, GD format, interview type, ...). Kept as
  -- jsonb rather than 20 mostly-null columns: every practice type asks for
  -- a different handful, and new types must not require a migration.
  -- Nothing aggregates on these, so they don't need to be queryable columns.
  type_specific jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint practice_sessions_capacity_ok check (current_participants <= max_participants),
  constraint practice_sessions_participant_range_ok check (max_participants >= min_participants),
  -- An offline session without somewhere to go isn't actionable.
  constraint practice_sessions_offline_has_location check (mode <> 'offline' or location is not null),
  constraint practice_sessions_custom_type_present check (
    practice_type <> 'other' or (custom_practice_type is not null and length(trim(custom_practice_type)) > 0)
  )
);

create index if not exists practice_sessions_status_idx on public.practice_sessions(status);
create index if not exists practice_sessions_date_idx on public.practice_sessions(scheduled_date);
create index if not exists practice_sessions_creator_idx on public.practice_sessions(creator_id);
create index if not exists practice_sessions_type_idx on public.practice_sessions(practice_type);

alter table public.practice_sessions enable row level security;

-- Discovery is cross-campus by design (see the college_preference column):
-- sessions are readable by any signed-in student, and the preference is a
-- filter the host expresses rather than a hard boundary in the data.
drop policy if exists "Authenticated users can view practice sessions" on public.practice_sessions;
create policy "Authenticated users can view practice sessions"
  on public.practice_sessions for select to authenticated using (true);

drop policy if exists "Users can create own practice sessions" on public.practice_sessions;
create policy "Users can create own practice sessions"
  on public.practice_sessions for insert to authenticated
  with check (auth.uid() = creator_id);

-- Hosts edit their own session's details. Capacity and status transitions
-- are NOT done this way — they go through the RPCs below, which is what
-- keeps current_participants honest.
drop policy if exists "Hosts can update own practice sessions" on public.practice_sessions;
create policy "Hosts can update own practice sessions"
  on public.practice_sessions for update to authenticated
  using (auth.uid() = creator_id) with check (auth.uid() = creator_id);

drop trigger if exists practice_sessions_updated_at on public.practice_sessions;
create trigger practice_sessions_updated_at before update on public.practice_sessions
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- PRACTICE_PARTICIPANTS
-- ============================================================

create table if not exists public.practice_participants (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.practice_sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'participant' check (role in ('host', 'participant')),
  joined_at timestamptz not null default now(),
  -- The database-level guarantee that nobody can join the same session twice.
  unique (session_id, user_id)
);

create index if not exists practice_participants_user_idx on public.practice_participants(user_id);
create index if not exists practice_participants_session_idx on public.practice_participants(session_id);

alter table public.practice_participants enable row level security;

drop policy if exists "Authenticated users can view participants" on public.practice_participants;
create policy "Authenticated users can view participants"
  on public.practice_participants for select to authenticated using (true);

-- The only participant row a client may insert directly is the host's own,
-- at creation. Everyone else arrives through accept_practice_request.
drop policy if exists "Hosts can seat themselves" on public.practice_participants;
create policy "Hosts can seat themselves"
  on public.practice_participants for insert to authenticated
  with check (
    auth.uid() = user_id
    and role = 'host'
    and exists (select 1 from public.practice_sessions s where s.id = session_id and s.creator_id = auth.uid())
  );

-- ============================================================
-- PRACTICE_JOIN_REQUESTS
-- ============================================================

create table if not exists public.practice_join_requests (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.practice_sessions(id) on delete cascade not null,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Partial unique index rather than a table-level constraint: it blocks a
-- second *pending* request to the same session (the duplicate-request rule)
-- while leaving the door open to re-applying after withdrawing. A declined
-- request deliberately also occupies no pending slot, so re-application
-- after a decline is a product decision to make later, not a schema change.
create unique index if not exists practice_join_requests_one_pending_per_user
  on public.practice_join_requests (session_id, requester_id)
  where status = 'pending';

create index if not exists practice_join_requests_session_idx on public.practice_join_requests(session_id);
create index if not exists practice_join_requests_requester_idx on public.practice_join_requests(requester_id);

alter table public.practice_join_requests enable row level security;

drop policy if exists "Requesters and hosts can view requests" on public.practice_join_requests;
create policy "Requesters and hosts can view requests"
  on public.practice_join_requests for select to authenticated
  using (
    auth.uid() = requester_id
    or exists (select 1 from public.practice_sessions s where s.id = session_id and s.creator_id = auth.uid())
  );

-- Two rules enforced here rather than in the UI: a host can't request to
-- join their own session, and an existing participant can't request again.
drop policy if exists "Users can request as themselves" on public.practice_join_requests;
create policy "Users can request as themselves"
  on public.practice_join_requests for insert to authenticated
  with check (
    auth.uid() = requester_id
    and not exists (select 1 from public.practice_sessions s where s.id = session_id and s.creator_id = auth.uid())
    and not exists (select 1 from public.practice_participants p where p.session_id = session_id and p.user_id = auth.uid())
  );

-- A requester may only withdraw their own pending request. Accept/decline
-- go exclusively through the RPCs, so a host can never accept via a raw
-- UPDATE that skips the capacity check.
drop policy if exists "Requesters can withdraw own pending request" on public.practice_join_requests;
create policy "Requesters can withdraw own pending request"
  on public.practice_join_requests for update to authenticated
  using (auth.uid() = requester_id and status = 'pending')
  with check (auth.uid() = requester_id and status = 'withdrawn');

drop trigger if exists practice_join_requests_updated_at on public.practice_join_requests;
create trigger practice_join_requests_updated_at before update on public.practice_join_requests
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- CONCURRENCY-SAFE RPCS
--
-- The guarded UPDATE in accept_practice_request
-- (`... where current_participants < max_participants`) is what actually
-- prevents overfilling under concurrent accepts: Postgres takes a row lock,
-- so two simultaneous accepts for the same session serialize — the first
-- commits and increments, the second's WHERE matches zero rows and raises a
-- clean "session is full". Frontend button state is a courtesy; this is the
-- rule.
-- ============================================================

create or replace function public.accept_practice_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
  v_requester_id uuid;
begin
  select r.session_id, r.requester_id into v_session_id, v_requester_id
  from public.practice_join_requests r
  where r.id = p_request_id and r.status = 'pending';

  if v_session_id is null then
    raise exception 'Request not found or already handled';
  end if;

  if not exists (select 1 from public.practice_sessions where id = v_session_id and creator_id = auth.uid()) then
    raise exception 'Only the host can accept requests';
  end if;

  -- Already a participant: settle the request without taking a second seat.
  if exists (select 1 from public.practice_participants where session_id = v_session_id and user_id = v_requester_id) then
    update public.practice_join_requests set status = 'accepted' where id = p_request_id;
    return;
  end if;

  update public.practice_sessions
  set current_participants = current_participants + 1,
      status = case when current_participants + 1 >= max_participants then 'full' else status end
  where id = v_session_id
    and current_participants < max_participants
    and status in ('open');

  if not found then
    raise exception 'Session is already full';
  end if;

  update public.practice_join_requests set status = 'accepted' where id = p_request_id;

  insert into public.practice_participants (session_id, user_id, role)
  values (v_session_id, v_requester_id, 'participant')
  on conflict (session_id, user_id) do nothing;
end;
$$;

create or replace function public.decline_practice_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator_id uuid;
begin
  select s.creator_id into v_creator_id
  from public.practice_join_requests r
  join public.practice_sessions s on s.id = r.session_id
  where r.id = p_request_id and r.status = 'pending';

  if v_creator_id is null then
    raise exception 'Request not found or already handled';
  end if;
  if auth.uid() <> v_creator_id then
    raise exception 'Only the host can decline requests';
  end if;

  update public.practice_join_requests set status = 'declined' where id = p_request_id;
end;
$$;

-- Leaving and being removed are the same state change from opposite sides,
-- so they share one guarded implementation. The host can never be the
-- target: they own the session, and removing them would orphan it.
create or replace function public.practice_release_seat(p_session_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator_id uuid;
  v_role text;
begin
  select creator_id into v_creator_id from public.practice_sessions where id = p_session_id;
  if v_creator_id is null then
    raise exception 'Session not found';
  end if;

  -- Either you are removing yourself, or you are the host removing someone.
  if auth.uid() <> p_user_id and auth.uid() <> v_creator_id then
    raise exception 'Only the host can remove another participant';
  end if;

  select role into v_role from public.practice_participants
  where session_id = p_session_id and user_id = p_user_id;

  if v_role is null then
    raise exception 'That person is not a participant';
  end if;
  if v_role = 'host' then
    raise exception 'The host cannot leave or be removed — cancel the session instead';
  end if;

  delete from public.practice_participants where session_id = p_session_id and user_id = p_user_id;

  -- Freeing a seat reopens a full session, but must never revive one that
  -- was cancelled or completed.
  update public.practice_sessions
  set current_participants = greatest(current_participants - 1, 0),
      status = case when status = 'full' then 'open' else status end
  where id = p_session_id;
end;
$$;

create or replace function public.cancel_practice_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.practice_sessions where id = p_session_id and creator_id = auth.uid()) then
    raise exception 'Only the host can cancel this session';
  end if;

  update public.practice_sessions
  set status = 'cancelled'
  where id = p_session_id and status in ('open', 'full');

  if not found then
    raise exception 'Session is not in a cancellable state';
  end if;

  -- Pending requests can never be accepted after cancellation, so they are
  -- settled rather than left dangling in the requesters' Pending lists.
  update public.practice_join_requests
  set status = 'declined'
  where session_id = p_session_id and status = 'pending';
end;
$$;

grant execute on function public.accept_practice_request(uuid) to authenticated;
grant execute on function public.decline_practice_request(uuid) to authenticated;
grant execute on function public.practice_release_seat(uuid, uuid) to authenticated;
grant execute on function public.cancel_practice_session(uuid) to authenticated;

-- ============================================================
-- NOTIFICATIONS
--
-- Trigger-based, matching the TeamUp events in
-- notifications-migration.sql: triggers observe the same row events the
-- RPCs already perform, so a notification is created exactly once with the
-- state change itself rather than once per client refetch, and no client
-- can forge one.
-- ============================================================

-- The type/category CHECKs are rebuilt from the union of (a) the values
-- this migration knows about and (b) whatever is already stored. Hardcoding
-- the full list is what broke here: this file was written against the list
-- in notifications-migration.sql and silently omitted 'team_member_removed',
-- which teamup-membership-fix-migration.sql had added later — so the new
-- constraint rejected rows that already existed. Deriving the existing half
-- from the table means a third migration can't repeat that, while the
-- constraint still blocks genuinely unknown values going forward.
do $$
declare
  v_types text;
  v_categories text;
begin
  select string_agg(quote_literal(t), ', ') into v_types
  from (
    select unnest(array[
      'team_join_request', 'team_join_accepted', 'team_join_rejected',
      'team_invitation', 'team_invitation_accepted', 'team_invitation_rejected',
      'team_full', 'team_match', 'team_member_removed', 'competition_deadline',
      'gradesheet_processed', 'gradesheet_failed',
      'system_announcement',
      -- Practice Together
      'practice_join_request', 'practice_request_accepted', 'practice_request_declined',
      'practice_participant_left', 'practice_participant_removed', 'practice_session_cancelled',
      -- Reserved so reminders can be delivered later without another
      -- migration. Nothing writes this yet: there is no scheduler, and a
      -- reminder that only fires while the student happens to have the app
      -- open would be worse than none.
      'practice_session_reminder'
    ]) as t
    union
    select distinct type from public.notifications
  ) all_types;

  select string_agg(quote_literal(c), ', ') into v_categories
  from (
    select unnest(array['teamup', 'academic', 'system', 'practice']) as c
    union
    select distinct category from public.notifications
  ) all_categories;

  execute 'alter table public.notifications drop constraint if exists notifications_type_check';
  execute format('alter table public.notifications add constraint notifications_type_check check (type in (%s))', v_types);

  execute 'alter table public.notifications drop constraint if exists notifications_category_check';
  execute format('alter table public.notifications add constraint notifications_category_check check (category in (%s))', v_categories);
end $$;

-- Readable label for a session, used in notification copy.
create or replace function public.practice_session_label(p_session public.practice_sessions)
returns text
language sql
immutable
as $$
  select coalesce(nullif(trim(p_session.title), ''), 'your practice session');
$$;

-- 1. Join request received -> notify the host (never the requester).
create or replace function public.notify_practice_join_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.practice_sessions;
  v_name text;
begin
  select * into v_session from public.practice_sessions where id = new.session_id;
  if v_session.creator_id = new.requester_id then return new; end if;

  select coalesce(full_name, 'A student') into v_name from public.profiles where id = new.requester_id;

  insert into public.notifications (user_id, type, category, title, message, action_url, entity_type, entity_id)
  values (
    v_session.creator_id, 'practice_join_request', 'practice', 'New practice request',
    v_name || ' wants to join ' || public.practice_session_label(v_session) || '.',
    '/practice/' || new.session_id, 'practice_session', new.session_id
  );
  return new;
end;
$$;

drop trigger if exists practice_join_request_created on public.practice_join_requests;
create trigger practice_join_request_created after insert on public.practice_join_requests
  for each row execute procedure public.notify_practice_join_request();

-- 2. Request accepted or declined -> notify the requester.
create or replace function public.notify_practice_request_resolved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.practice_sessions;
begin
  if new.status = old.status then return new; end if;
  -- A withdrawal is the requester's own action; nobody needs telling.
  if new.status not in ('accepted', 'declined') then return new; end if;

  select * into v_session from public.practice_sessions where id = new.session_id;

  if new.status = 'accepted' then
    insert into public.notifications (user_id, type, category, title, message, action_url, entity_type, entity_id)
    values (
      new.requester_id, 'practice_request_accepted', 'practice', 'Request accepted',
      'Your request to join ' || public.practice_session_label(v_session) || ' has been accepted.',
      '/practice/' || new.session_id, 'practice_session', new.session_id
    );
  else
    insert into public.notifications (user_id, type, category, title, message, action_url, entity_type, entity_id)
    values (
      new.requester_id, 'practice_request_declined', 'practice', 'Request update',
      'Your request to join ' || public.practice_session_label(v_session) || ' was not accepted.',
      '/practice', 'practice_session', new.session_id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists practice_request_resolved on public.practice_join_requests;
create trigger practice_request_resolved after update on public.practice_join_requests
  for each row execute procedure public.notify_practice_request_resolved();

-- 3. A seat is released -> tell whichever side didn't perform the action.
create or replace function public.notify_practice_seat_released()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.practice_sessions;
  v_name text;
begin
  select * into v_session from public.practice_sessions where id = old.session_id;
  -- The session (and its participants) may be going away entirely.
  if v_session.id is null then return old; end if;

  if auth.uid() = old.user_id then
    select coalesce(full_name, 'A participant') into v_name from public.profiles where id = old.user_id;
    insert into public.notifications (user_id, type, category, title, message, action_url, entity_type, entity_id)
    values (
      v_session.creator_id, 'practice_participant_left', 'practice', 'A participant left',
      v_name || ' has left ' || public.practice_session_label(v_session) || '.',
      '/practice/' || old.session_id, 'practice_session', old.session_id
    );
  else
    insert into public.notifications (user_id, type, category, title, message, action_url, entity_type, entity_id)
    values (
      old.user_id, 'practice_participant_removed', 'practice', 'Practice session update',
      'You are no longer a participant in ' || public.practice_session_label(v_session) || '.',
      '/practice', 'practice_session', old.session_id
    );
  end if;
  return old;
end;
$$;

drop trigger if exists practice_seat_released on public.practice_participants;
create trigger practice_seat_released after delete on public.practice_participants
  for each row execute procedure public.notify_practice_seat_released();

-- 4. Session cancelled -> notify every confirmed participant except the host.
create or replace function public.notify_practice_session_cancelled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'cancelled' or old.status = 'cancelled' then return new; end if;

  insert into public.notifications (user_id, type, category, title, message, action_url, entity_type, entity_id)
  select
    p.user_id, 'practice_session_cancelled', 'practice', 'Session cancelled',
    public.practice_session_label(new) || ' scheduled for ' ||
      to_char(new.scheduled_date, 'DD Mon') || ' at ' || to_char(new.start_time, 'HH12:MI AM') ||
      ' has been cancelled.',
    '/practice', 'practice_session', new.id
  from public.practice_participants p
  where p.session_id = new.id and p.user_id <> new.creator_id;

  return new;
end;
$$;

drop trigger if exists practice_session_cancelled on public.practice_sessions;
create trigger practice_session_cancelled after update on public.practice_sessions
  for each row execute procedure public.notify_practice_session_cancelled();
