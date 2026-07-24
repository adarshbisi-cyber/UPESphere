-- Tightens max_members to the same >= 2 floor the Create Team Request form
-- now enforces (a 1-person team can never recruit anyone). Safe to re-run.
--
-- max_members is set once at team creation and never mutated by any RPC
-- afterwards (accept/remove flows only touch current_members), so this is
-- safe to add without a data-migration step. It's added as NOT VALID so it
-- applies only to future inserts/updates and doesn't fail if an existing row
-- (created before this form fix) already has max_members = 1 — existing
-- data is left alone rather than being rejected retroactively.
--
-- current_members' existing `>= 0` check is intentionally left untouched:
-- remove_team_member() floors it at 0 via greatest(current_members - 1, 0),
-- and a stricter `>= 1` table constraint could conflict with that floor.
-- The current_members >= 1 rule is enforced at the application layer
-- (CreateTeamModal) instead, since it only matters at creation time.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'teams_max_members_min_check'
  ) then
    alter table public.teams
      add constraint teams_max_members_min_check check (max_members >= 2) not valid;
  end if;
end $$;
