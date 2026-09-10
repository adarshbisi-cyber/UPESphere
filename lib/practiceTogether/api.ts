'use client'

// Data-access layer for Practice Together. Mirrors lib/teamup/api.ts: reads
// go through PostgREST with RLS doing the authorisation, and every state
// change that touches capacity goes through an RPC so the guarded UPDATE in
// the database — not the client — decides whether it is allowed.

import { createClient } from '@/lib/supabase/client'
import type {
  CreateSessionInput, JoinRequestStatus, PracticeJoinRequest, PracticeParticipant,
  PracticeSession, PublicProfile,
} from './types'

const PROFILE_COLUMNS = 'id, full_name, avatar_url, university_id'
// Every column except meeting_link, which is deliberately absent: RLS is
// row-level, so selecting `*` would hand the link to anyone who can see the
// session — including a pending requester. It's fetched separately through
// practice_get_meeting_link, which checks membership.
const SESSION_COLUMNS = `
  id, creator_id, practice_type, custom_practice_type, title, description,
  scheduled_date, start_time, duration_minutes, mode, location,
  experience_level, college_preference,
  min_participants, max_participants, current_participants,
  status, type_specific, created_at, updated_at,
  creator:profiles!practice_sessions_creator_id_fkey(${PROFILE_COLUMNS}),
  participants:practice_participants(*, profile:profiles(${PROFILE_COLUMNS}))
`

interface ProfileRow { id: string; full_name: string | null; avatar_url: string | null; university_id: string | null }

function toProfile(r: ProfileRow | null): PublicProfile | null {
  if (!r) return null
  return { id: r.id, fullName: r.full_name, avatarUrl: r.avatar_url, universityId: r.university_id }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toParticipant(r: any): PracticeParticipant {
  return {
    id: r.id, sessionId: r.session_id, userId: r.user_id, role: r.role,
    joinedAt: r.joined_at, profile: toProfile(r.profile ?? null),
  }
}

function toSession(r: any): PracticeSession {
  return {
    id: r.id,
    creatorId: r.creator_id,
    practiceType: r.practice_type,
    customPracticeType: r.custom_practice_type,
    title: r.title,
    description: r.description,
    scheduledDate: r.scheduled_date,
    // Postgres returns 'HH:MM:SS'; the UI only ever needs HH:MM.
    startTime: String(r.start_time).slice(0, 5),
    durationMinutes: r.duration_minutes,
    mode: r.mode,
    location: r.location,
    // Never present on a list read; loaded on demand for members only.
    meetingLink: r.meeting_link ?? null,
    experienceLevel: r.experience_level,
    collegePreference: r.college_preference,
    minParticipants: r.min_participants,
    maxParticipants: r.max_participants,
    currentParticipants: r.current_participants,
    status: r.status,
    typeSpecific: r.type_specific ?? {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    creator: toProfile(r.creator ?? null),
    participants: (r.participants ?? []).map(toParticipant),
  }
}

function toRequest(r: any): PracticeJoinRequest {
  return {
    id: r.id, sessionId: r.session_id, requesterId: r.requester_id,
    message: r.message, status: r.status, createdAt: r.created_at,
    profile: toProfile(r.profile ?? null),
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ============================================================
// Reads
// ============================================================

export async function getSessions(): Promise<PracticeSession[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('practice_sessions')
    .select(SESSION_COLUMNS)
    .order('scheduled_date', { ascending: true })
    .order('start_time', { ascending: true })
  if (error) throw error
  return (data ?? []).map(toSession)
}

export async function getSession(sessionId: string): Promise<PracticeSession | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('practice_sessions').select(SESSION_COLUMNS).eq('id', sessionId).maybeSingle()
  if (error) throw error
  return data ? toSession(data) : null
}

// The viewer's own requests, used to derive each card's button state
// without a per-card query. RLS already restricts this to their own rows.
export async function getMyRequests(userId: string): Promise<PracticeJoinRequest[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('practice_join_requests').select('*').eq('requester_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toRequest)
}

export async function getSessionRequests(sessionId: string): Promise<PracticeJoinRequest[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('practice_join_requests')
    .select(`*, profile:profiles(${PROFILE_COLUMNS})`)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(toRequest)
}

// ============================================================
// Writes
// ============================================================

// Only the host and confirmed participants get a link back; everyone else
// gets null. Null therefore means "not yours to see" or "not set yet" — the
// caller already knows which from the viewer state.
export async function getMeetingLink(sessionId: string): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('practice_get_meeting_link', { p_session_id: sessionId })
  if (error) throw error
  return (data as string | null) ?? null
}

export async function createSession(userId: string, input: CreateSessionInput): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('practice_sessions')
    .insert({
      creator_id: userId,
      practice_type: input.practiceType,
      custom_practice_type: input.practiceType === 'other' ? input.customPracticeType : null,
      title: input.title,
      description: input.description,
      scheduled_date: input.scheduledDate,
      start_time: input.startTime,
      duration_minutes: input.durationMinutes,
      mode: input.mode,
      location: input.mode === 'offline' ? input.location : null,
      // Required for online sessions — see the constraint in
      // practice-together-meeting-link-migration.sql.
      meeting_link: input.mode === 'online' ? input.meetingLink : null,
      experience_level: input.experienceLevel,
      college_preference: input.collegePreference,
      min_participants: input.minParticipants,
      max_participants: input.maxParticipants,
      type_specific: input.typeSpecific,
    })
    .select('id')
    .single()
  if (error) throw error

  // The host takes the first seat, which is why current_participants
  // defaults to 1 — the row and the count are created together.
  const { error: seatError } = await supabase
    .from('practice_participants')
    .insert({ session_id: data.id, user_id: userId, role: 'host' })
  if (seatError) throw seatError

  return data.id as string
}

export async function updateSessionDetails(
  sessionId: string,
  patch: { title?: string; description?: string | null; meetingLink?: string | null; location?: string | null },
): Promise<void> {
  const supabase = createClient()
  const row: Record<string, unknown> = {}
  if (patch.title !== undefined) row.title = patch.title
  if (patch.description !== undefined) row.description = patch.description
  if (patch.meetingLink !== undefined) row.meeting_link = patch.meetingLink
  if (patch.location !== undefined) row.location = patch.location
  const { error } = await supabase.from('practice_sessions').update(row).eq('id', sessionId)
  if (error) throw error
}

export async function requestToJoin(sessionId: string, userId: string, message: string | null): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('practice_join_requests')
    .insert({ session_id: sessionId, requester_id: userId, message })
  if (error) throw error
}

export async function withdrawRequest(requestId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('practice_join_requests').update({ status: 'withdrawn' as JoinRequestStatus }).eq('id', requestId)
  if (error) throw error
}

// Everything below changes capacity or membership, so each is an RPC: the
// database re-checks ownership and seats regardless of what the UI believed.
export async function acceptRequest(requestId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('accept_practice_request', { p_request_id: requestId })
  if (error) throw error
}

export async function declineRequest(requestId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('decline_practice_request', { p_request_id: requestId })
  if (error) throw error
}

export async function leaveSession(sessionId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('practice_release_seat', { p_session_id: sessionId, p_user_id: userId })
  if (error) throw error
}

export async function removeParticipant(sessionId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('practice_release_seat', { p_session_id: sessionId, p_user_id: userId })
  if (error) throw error
}

// Marks a session as having actually happened. Host-only, and the database
// refuses until the session's end time has passed — see
// practice-together-completion-migration.sql for why that ordering matters.
export async function completeSession(sessionId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('complete_practice_session', { p_session_id: sessionId })
  if (error) throw error
}

export async function cancelSession(sessionId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('cancel_practice_session', { p_session_id: sessionId })
  if (error) throw error
}
