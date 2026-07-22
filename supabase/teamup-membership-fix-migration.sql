-- TeamUp Membership Fix Migration
-- Fixes a real bug: a user already accepted into team_members (most likely
-- via an invitation accept, which never touches team_join_requests at all)
-- could still show "Request Pending" / "Cancel Request" for the same team,
-- because the UI treated an old/stray pending join-request row as
-- authoritative instead of checking current membership first, and nothing
-- at the database layer stopped an existing member from creating (or
-- keeping) a pending request in the first place.
--
-- Also adds member removal (creator-only), which a removed user can then
-- re-apply against cleanly.
--
-- Run this AFTER schema.sql, teamup-migration.sql, AND
-- notifications-migration.sql (it hardens team_join_requests and extends
-- notifications' type constraint). Safe to re-run.

-- ============================================================
-- 1. HARDEN JOIN-REQUEST CREATION AT THE DATABASE LAYER
-- ============================================================
-- Previously only blocked the creator from applying to their own team.
-- Now also blocks: existing members (the actual bug), and applying to a
-- team that is no longer accepting applications (full, not open, or past
-- its registration deadline) — enforced here so a direct API call can't
-- bypass the frontend's canApply gate.
drop policy if exists "Users can apply as themselves" on public.team_join_requests;
create policy "Users can apply as themselves"
  on public.team_join_requests for insert
  with check (
    auth.uid() = applicant_id
    and not exists (select 1 from public.teams t where t.id = team_id and t.created_by = auth.uid())
    and not exists (select 1 from public.team_members tm where tm.team_id = team_join_requests.team_id and tm.user_id = auth.uid())
    and exists (
      select 1 from public.teams t
      where t.id = team_join_requests.team_id
        and t.status = 'open'
        and t.registration_deadline >= current_date
        and t.current_members < t.max_members
    )
  );

-- ============================================================
-- 2. CLEAN UP STALE PENDING REQUESTS FROM EXISTING MEMBERS
-- ============================================================
-- One-time (and safe-to-repeat) fix for rows created by the bug above: if a
-- user is already a member of a team, any 'pending' join request they still
-- have for that same team is stale — cancel it rather than delete it, so
-- the historical record survives. A no-op once already cleaned up.
update public.team_join_requests tjr
set status = 'cancelled', updated_at = now()
where tjr.status = 'pending'
  and exists (
    select 1 from public.team_members tm
    where tm.team_id = tjr.team_id and tm.user_id = tjr.applicant_id
  );

-- ============================================================
-- 3. MEMBER REMOVAL
-- ============================================================
-- team_members has no DELETE policy at all (verified in teamup-migration.sql
-- — only SELECT and a creator-adds-self-as-creator INSERT policy exist), so
-- RLS already default-denies any direct client DELETE. This
-- security-definer RPC is therefore the ONLY way a row can be removed, and
-- it does its own creator/self-removal checks before touching anything.
create or replace function public.remove_team_member(p_team_id uuid, p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator_id uuid;
  v_competition_name text;
begin
  select created_by, competition_name into v_creator_id, v_competition_name
  from public.teams where id = p_team_id;

  if v_creator_id is null then
    raise exception 'Team not found';
  end if;

  if auth.uid() <> v_creator_id then
    raise exception 'Only the team creator can remove members';
  end if;

  if p_target_user_id = v_creator_id then
    raise exception 'The team creator cannot remove themselves';
  end if;

  delete from public.team_members
  where team_id = p_team_id and user_id = p_target_user_id;

  if not found then
    raise exception 'That user is not a member of this team';
  end if;

  -- Removal always frees a slot. 'full' was itself an automatic, capacity-
  -- derived state (set by accept_join_request/accept_team_invitation when
  -- the team hit capacity), so reopening it here is the exact symmetric
  -- reverse of that transition. 'closed'/'cancelled' were creator-initiated
  -- and must NOT be silently reopened by a removal.
  update public.teams
  set current_members = greatest(current_members - 1, 0),
      status = case when status = 'full' then 'open' else status end
  where id = p_team_id;

  insert into public.notifications (user_id, type, category, title, message, action_url, entity_type, entity_id)
  values (
    p_target_user_id, 'team_member_removed', 'teamup', 'You''ve been removed from the team',
    'You are no longer a member of the team for ' || coalesce(v_competition_name, 'this competition') || '.',
    '/teamup/' || p_team_id, 'team', p_team_id
  );
end;
$$;

grant execute on function public.remove_team_member(uuid, uuid) to authenticated;

-- Extend the notifications type enum for the new event above.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'team_join_request', 'team_join_accepted', 'team_join_rejected',
    'team_invitation', 'team_invitation_accepted', 'team_invitation_rejected',
    'team_full', 'team_match', 'competition_deadline',
    'team_member_removed',
    'gradesheet_processed', 'gradesheet_failed',
    'system_announcement'
  ));
