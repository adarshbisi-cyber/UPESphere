-- UPESphere Practice Together — session completion
--
-- Run after practice-together-migration.sql. Safe to re-run.
--
-- Practice Activity only counts sessions that actually happened, which
-- needs someone to say so. The schema already had a 'completed' status but
-- nothing could reach it, so every session sat at open/full forever.
--
-- The host confirms, and only after the session's scheduled end time has
-- passed. That ordering is the point: if a session could be marked complete
-- the moment it was created, Practice Activity would measure how many
-- sessions someone *scheduled* rather than how much they practised, and the
-- streak would be trivially farmable.

create or replace function public.complete_practice_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.practice_sessions;
begin
  select * into v_session from public.practice_sessions where id = p_session_id;

  if v_session.id is null then
    raise exception 'Session not found';
  end if;
  if v_session.creator_id <> auth.uid() then
    raise exception 'Only the host can complete this session';
  end if;
  if v_session.status not in ('open', 'full') then
    raise exception 'Only an active session can be completed';
  end if;

  -- The end time, computed the same way the client does: start plus
  -- duration. A session still in progress hasn't happened yet.
  if (v_session.scheduled_date + v_session.start_time
      + make_interval(mins => v_session.duration_minutes)) > now() then
    raise exception 'This session has not finished yet';
  end if;

  update public.practice_sessions set status = 'completed' where id = p_session_id;

  -- Nobody can join a session that already took place.
  update public.practice_join_requests
  set status = 'declined'
  where session_id = p_session_id and status = 'pending';
end;
$$;

grant execute on function public.complete_practice_session(uuid) to authenticated;
