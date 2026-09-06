'use client'

// Data-access layer for Placement Tracker. Every write is scoped to the
// signed-in user (enforced twice over: RLS policies in
// supabase/placement-tracker-migration.sql, and explicit user_id/ownership
// filters here) — mirrors lib/teamup/api.ts's and lib/onboarding/api.ts's
// convention.

import { createClient } from '@/lib/supabase/client'
import { deriveApplicationStatus } from './status'
import type {
  AnalyticsCategory, ApplicationInput, ApplicationStatus, PlacementApplication,
  PlacementRound, ReflectionType, RoundInput, RoundOutcome, RoundReflection,
} from './types'

// ============================================================
// Row shapes (snake_case, mirror the DB) — private to this module.
// ============================================================

interface ReflectionRow {
  id: string
  round_id: string
  reflection_type: ReflectionType
  notes: string | null
  created_at: string
}

interface RoundRow {
  id: string
  application_id: string
  round_order: number
  display_name: string
  analytics_category: AnalyticsCategory
  outcome: RoundOutcome
  scheduled_date: string | null
  completed_date: string | null
  outcome_notes: string | null
  placement_round_reflections: ReflectionRow[] | null
}

interface ApplicationRow {
  id: string
  user_id: string
  company_name: string
  role: string
  opportunity_type: PlacementApplication['opportunityType']
  industry: string | null
  location: string | null
  package: string | null
  stipend: string | null
  application_date: string
  status: ApplicationStatus
  notes: string | null
  created_at: string
  updated_at: string
  placement_rounds: RoundRow[] | null
}

const APPLICATION_SELECT = '*, placement_rounds(*, placement_round_reflections(*))'

function toReflection(r: ReflectionRow): RoundReflection {
  return { id: r.id, roundId: r.round_id, reflectionType: r.reflection_type, notes: r.notes, createdAt: r.created_at }
}

function toRound(r: RoundRow): PlacementRound {
  return {
    id: r.id,
    applicationId: r.application_id,
    roundOrder: r.round_order,
    displayName: r.display_name,
    analyticsCategory: r.analytics_category,
    outcome: r.outcome,
    scheduledDate: r.scheduled_date,
    completedDate: r.completed_date,
    outcomeNotes: r.outcome_notes,
    reflection: r.placement_round_reflections?.[0] ? toReflection(r.placement_round_reflections[0]) : null,
  }
}

function toApplication(r: ApplicationRow): PlacementApplication {
  const rounds = (r.placement_rounds ?? []).map(toRound).sort((a, b) => a.roundOrder - b.roundOrder)
  return {
    id: r.id,
    userId: r.user_id,
    companyName: r.company_name,
    role: r.role,
    opportunityType: r.opportunity_type,
    industry: r.industry,
    location: r.location,
    package: r.package,
    stipend: r.stipend,
    applicationDate: r.application_date,
    status: r.status,
    notes: r.notes,
    rounds,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

// ============================================================
// Reads
// ============================================================

export async function getApplications(userId: string): Promise<PlacementApplication[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('placement_applications')
    .select(APPLICATION_SELECT)
    .eq('user_id', userId)
    .order('application_date', { ascending: false })
  if (error) throw error
  return (data as ApplicationRow[]).map(toApplication)
}

export async function getApplication(userId: string, applicationId: string): Promise<PlacementApplication | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('placement_applications')
    .select(APPLICATION_SELECT)
    .eq('user_id', userId)
    .eq('id', applicationId)
    .maybeSingle()
  if (error) throw error
  return data ? toApplication(data as ApplicationRow) : null
}

// ============================================================
// Writes — applications
// ============================================================

export async function createApplication(
  userId: string,
  input: ApplicationInput,
  rounds: RoundInput[],
): Promise<PlacementApplication> {
  const supabase = createClient()
  const { data: app, error: appError } = await supabase
    .from('placement_applications')
    .insert({
      user_id: userId,
      company_name: input.companyName,
      role: input.role,
      opportunity_type: input.opportunityType,
      industry: input.industry,
      location: input.location,
      package: input.package,
      stipend: input.stipend,
      application_date: input.applicationDate,
      notes: input.notes,
    })
    .select('id')
    .single()
  if (appError) throw appError

  if (rounds.length > 0) {
    const { error: roundsError } = await supabase.from('placement_rounds').insert(
      rounds.map((r, i) => ({
        application_id: app.id,
        round_order: i,
        display_name: r.displayName,
        analytics_category: r.analyticsCategory,
      })),
    )
    if (roundsError) throw roundsError
  }

  const created = await getApplication(userId, app.id)
  if (!created) throw new Error('Application was created but could not be re-fetched')
  return created
}

export async function updateApplicationDetails(
  userId: string,
  applicationId: string,
  patch: Partial<ApplicationInput>,
): Promise<void> {
  const supabase = createClient()
  const row: Record<string, unknown> = {}
  if (patch.companyName !== undefined) row.company_name = patch.companyName
  if (patch.role !== undefined) row.role = patch.role
  if (patch.opportunityType !== undefined) row.opportunity_type = patch.opportunityType
  if (patch.industry !== undefined) row.industry = patch.industry
  if (patch.location !== undefined) row.location = patch.location
  if (patch.package !== undefined) row.package = patch.package
  if (patch.stipend !== undefined) row.stipend = patch.stipend
  if (patch.applicationDate !== undefined) row.application_date = patch.applicationDate
  if (patch.notes !== undefined) row.notes = patch.notes

  const { error } = await supabase
    .from('placement_applications')
    .update(row)
    .eq('id', applicationId)
    .eq('user_id', userId)
  if (error) throw error
}

// Explicit withdrawal is the one application state a rounds-derivation can't
// represent (see lib/placementTracker/status.ts) — everything else is
// recomputed automatically after a round update.
export async function withdrawApplication(userId: string, applicationId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('placement_applications')
    .update({ status: 'withdrawn' })
    .eq('id', applicationId)
    .eq('user_id', userId)
  if (error) throw error
}

// Recomputes and persists `status` from the application's current rounds.
// Called after every round mutation so the stored status can never drift
// out of sync with the recruitment journey it's derived from. Skips
// applications already manually withdrawn — that override always wins.
async function syncApplicationStatus(userId: string, applicationId: string): Promise<void> {
  const app = await getApplication(userId, applicationId)
  if (!app || app.status === 'withdrawn') return
  const derived = deriveApplicationStatus(app.rounds)
  if (derived !== app.status) {
    const supabase = createClient()
    const { error } = await supabase
      .from('placement_applications')
      .update({ status: derived })
      .eq('id', applicationId)
      .eq('user_id', userId)
    if (error) throw error
  }
}

// ============================================================
// Writes — rounds
// ============================================================

export async function addRound(
  userId: string,
  applicationId: string,
  input: RoundInput,
  roundOrder: number,
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('placement_rounds').insert({
    application_id: applicationId,
    round_order: roundOrder,
    display_name: input.displayName,
    analytics_category: input.analyticsCategory,
  })
  if (error) throw error
  await syncApplicationStatus(userId, applicationId)
}

export async function deleteRound(userId: string, applicationId: string, roundId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('placement_rounds').delete().eq('id', roundId)
  if (error) throw error
  await syncApplicationStatus(userId, applicationId)
}

export async function reorderRounds(applicationId: string, orderedRoundIds: string[]): Promise<void> {
  const supabase = createClient()
  // Sequential, not Promise.all — round_order has a unique constraint per
  // application, so concurrent writes could collide on an in-between state.
  for (let i = 0; i < orderedRoundIds.length; i++) {
    const { error } = await supabase
      .from('placement_rounds')
      .update({ round_order: i })
      .eq('id', orderedRoundIds[i])
      .eq('application_id', applicationId)
    if (error) throw error
  }
}

export interface RoundUpdate {
  displayName?: string
  analyticsCategory?: AnalyticsCategory
  outcome?: RoundOutcome
  scheduledDate?: string | null
  completedDate?: string | null
  outcomeNotes?: string | null
}

export async function updateRound(
  userId: string,
  applicationId: string,
  roundId: string,
  patch: RoundUpdate,
): Promise<void> {
  const supabase = createClient()
  const row: Record<string, unknown> = {}
  if (patch.displayName !== undefined) row.display_name = patch.displayName
  if (patch.analyticsCategory !== undefined) row.analytics_category = patch.analyticsCategory
  if (patch.outcome !== undefined) row.outcome = patch.outcome
  if (patch.scheduledDate !== undefined) row.scheduled_date = patch.scheduledDate
  if (patch.completedDate !== undefined) row.completed_date = patch.completedDate
  if (patch.outcomeNotes !== undefined) row.outcome_notes = patch.outcomeNotes

  const { error } = await supabase.from('placement_rounds').update(row).eq('id', roundId)
  if (error) throw error
  await syncApplicationStatus(userId, applicationId)
}

export async function addReflection(
  roundId: string,
  input: { reflectionType: ReflectionType; notes: string | null },
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('placement_round_reflections')
    .upsert(
      { round_id: roundId, reflection_type: input.reflectionType, notes: input.notes },
      { onConflict: 'round_id' },
    )
  if (error) throw error
}
