-- UPESphere Placement Tracker — standardised round types + exit reasons
--
-- Run after placement-tracker-migration.sql. Safe to re-run.
--
-- This migrates the recruitment-round model in three ways:
--
--  1. The round taxonomy is split so analytics can distinguish stages that
--     used to collapse into one bucket. 'interview' became case_interview /
--     hr_fit / final_interview, 'group_exercise' became group_discussion,
--     'resume_screening' became resume, and 'video' was added.
--
--  2. 'final_outcome' is retired as a round type. An offer is the *outcome*
--     of a journey, not a stage inside it — nobody is "eliminated at Final
--     Result". Those rounds are converted into the application's status and
--     then deleted.
--
--  3. Rounds gain `exit_reason`, recorded when a round eliminates the
--     student. This is what lets Insights say "you keep losing case rounds
--     on structure" rather than just "you keep getting rejected".
--
-- NOTHING IS DESTROYED except the Final Result rounds in step 2, and only
-- after their meaning has been moved onto the application. Every round's
-- `display_name` — the student's own wording — is left exactly as it was.

-- ------------------------------------------------------------
-- 1. exit_reason column
-- ------------------------------------------------------------

alter table public.placement_rounds
  add column if not exists exit_reason text;

alter table public.placement_rounds drop constraint if exists placement_rounds_exit_reason_check;
alter table public.placement_rounds add constraint placement_rounds_exit_reason_check check (
  exit_reason is null or exit_reason in (
    'RESUME_PROFILE', 'TEST_ASSESSMENT', 'GROUP_DISCUSSION', 'CASE_STRUCTURE', 'CASE_MATH',
    'COMMUNICATION', 'HR_FIT', 'TECHNICAL_DOMAIN', 'FIRM_SIDE', 'WITHDREW', 'OTHER'
  )
);

-- ------------------------------------------------------------
-- 2. Widen analytics_category before rewriting values
--
-- Both old and new values are allowed while the backfill runs, so the
-- constraint can never reject a row mid-migration. It's tightened in step 5.
-- ------------------------------------------------------------

alter table public.placement_rounds drop constraint if exists placement_rounds_analytics_category_check;
alter table public.placement_rounds add constraint placement_rounds_analytics_category_check check (
  analytics_category in (
    'resume', 'assessment', 'group_discussion', 'video', 'case_interview', 'hr_fit', 'final_interview', 'other',
    'resume_screening', 'group_exercise', 'interview', 'final_outcome'
  )
);

-- ------------------------------------------------------------
-- 3. Move Final Result rounds onto the application, then drop them
--
-- A cleared "Final Result" was how an offer used to be recorded, so that
-- meaning is preserved on the application before the round disappears.
-- Applications already rejected/withdrawn keep their existing status.
-- ------------------------------------------------------------

update public.placement_applications a
set status = 'offer'
where a.status not in ('rejected', 'withdrawn')
  and exists (
    select 1 from public.placement_rounds r
    where r.application_id = a.id
      and r.analytics_category = 'final_outcome'
      and r.outcome = 'cleared'
  );

delete from public.placement_rounds
where analytics_category = 'final_outcome';

-- ------------------------------------------------------------
-- 4. Backfill the remaining rounds onto the new taxonomy
--
-- Direct renames first, then the ambiguous 'interview' bucket, which can
-- only be resolved from the round's own label. Anything unrecognisable
-- becomes 'other' rather than being guessed at or dropped — the label is
-- still shown to the student either way. The frontend applies exactly the
-- same mapping on read (lib/placementTracker/categoryInference.ts), so the
-- app behaves correctly whether or not this has run yet.
-- ------------------------------------------------------------

update public.placement_rounds set analytics_category = 'resume'           where analytics_category = 'resume_screening';
update public.placement_rounds set analytics_category = 'group_discussion' where analytics_category = 'group_exercise';

update public.placement_rounds
set analytics_category = case
  when display_name ~* 'case'                              then 'case_interview'
  when display_name ~* '(\yhr\y|cultural fit|\yfit\y|behaviou?ral)' then 'hr_fit'
  when display_name ~* 'video'                             then 'video'
  when display_name ~* 'group'                             then 'group_discussion'
  else 'final_interview'
end
where analytics_category = 'interview';

-- Rounds whose label says "video" but were filed under another bucket.
update public.placement_rounds
set analytics_category = 'video'
where analytics_category = 'other' and display_name ~* 'video';

-- ------------------------------------------------------------
-- 5. Tighten the constraint to the new taxonomy only
-- ------------------------------------------------------------

alter table public.placement_rounds drop constraint if exists placement_rounds_analytics_category_check;
alter table public.placement_rounds add constraint placement_rounds_analytics_category_check check (
  analytics_category in (
    'resume', 'assessment', 'group_discussion', 'video', 'case_interview', 'hr_fit', 'final_interview', 'other'
  )
);

-- ------------------------------------------------------------
-- 6. Backfill exit reasons for eliminations recorded before this existed
--
-- Inferred from the stage the student was eliminated at, which is the only
-- evidence available retrospectively. 'OTHER' is used wherever the stage
-- doesn't imply a cause, so nothing invents a more specific reason than the
-- data supports.
-- ------------------------------------------------------------

update public.placement_rounds
set exit_reason = case analytics_category
  when 'resume'           then 'RESUME_PROFILE'
  when 'assessment'       then 'TEST_ASSESSMENT'
  when 'group_discussion' then 'GROUP_DISCUSSION'
  when 'case_interview'   then 'CASE_STRUCTURE'
  when 'hr_fit'           then 'HR_FIT'
  else 'OTHER'
end
where outcome = 'eliminated' and exit_reason is null;

-- ------------------------------------------------------------
-- 7. Rule 6 — closed applications must not carry live rounds
--
-- Leftover 'upcoming' rounds on a rejected or withdrawn application are
-- stages the student can never reach; they used to inflate the Upcoming
-- Rounds metric. Marked withdrawn rather than deleted so the journey the
-- student recorded stays visible.
-- ------------------------------------------------------------

update public.placement_rounds r
set outcome = 'withdrawn'
from public.placement_applications a
where r.application_id = a.id
  and a.status in ('rejected', 'withdrawn')
  and r.outcome in ('upcoming', 'pending')
  and r.round_order > coalesce(
    (select min(r2.round_order) from public.placement_rounds r2
     where r2.application_id = a.id and r2.outcome = 'eliminated'),
    r.round_order
  );
