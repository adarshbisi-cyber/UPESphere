-- UPESphere Practice Together — meeting-link access + requirement
--
-- Run after practice-together-migration.sql. Safe to re-run.
--
-- Two changes:
--
--  1. The meeting link stops being readable by everyone. RLS is row-level,
--     not column-level, so `select *` on a session handed the link to any
--     signed-in student — including someone whose request was still
--     pending. Hiding it in the UI is not the same as them not having it:
--     the value was in the network response either way. The column is now
--     fetched through an RPC that checks membership.
--
--  2. An online session must carry a link. Added NOT VALID on purpose:
--     sessions created before this migration may legitimately have none,
--     and a validating constraint would refuse to install (exactly how the
--     notifications type check failed earlier). NOT VALID enforces the rule
--     on every insert and update from here on, while leaving existing rows
--     alone until their host next edits them.

alter table public.practice_sessions
  drop constraint if exists practice_sessions_online_has_link;
alter table public.practice_sessions
  add constraint practice_sessions_online_has_link check (
    mode <> 'online' or (meeting_link is not null and length(trim(meeting_link)) > 0)
  ) not valid;

-- Returns the link only to the host and confirmed participants. Everyone
-- else gets null rather than an error: a pending requester asking is a
-- normal thing for the UI to do, not an exceptional one.
create or replace function public.practice_get_meeting_link(p_session_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link text;
begin
  select s.meeting_link into v_link
  from public.practice_sessions s
  where s.id = p_session_id
    and (
      s.creator_id = auth.uid()
      or exists (
        select 1 from public.practice_participants p
        where p.session_id = s.id and p.user_id = auth.uid()
      )
    );
  return v_link;
end;
$$;

grant execute on function public.practice_get_meeting_link(uuid) to authenticated;
