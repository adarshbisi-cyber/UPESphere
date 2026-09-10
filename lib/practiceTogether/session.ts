// Pure derivations for Practice Together. Every rule about what a viewer
// may do with a session lives here rather than being re-derived in each
// component, because the same question is asked by the discover card, the
// detail modal and My Practice — and three copies would eventually disagree
// (a card offering "Request to Join" on a session the user already joined).

import { MAX_PARTICIPANTS_CEILING, MIN_PARTICIPANTS_FOR_TYPE, PRACTICE_TYPE_CONFIG } from './constants'
import type { JoinRequestStatus, PracticeSession, PracticeType, SessionStatus } from './types'

// What the viewer is to this session. Exactly one applies, in this order of
// precedence: being the host outranks being a participant, which outranks
// having a pending request.
export type ViewerRelationship = 'host' | 'participant' | 'pending' | 'declined' | 'none'

// The single action a viewer can take, which is what the primary button
// renders. 'full' and 'closed' are states, not actions — they render as
// disabled labels.
export type ViewerAction = 'manage' | 'joined' | 'pending' | 'request' | 'full' | 'closed'

export interface ViewerState {
  relationship: ViewerRelationship
  action: ViewerAction
  canRequest: boolean
  canWithdraw: boolean
  canLeave: boolean
  canManage: boolean
}

export function relationshipFor(
  session: PracticeSession,
  viewerId: string | null,
  requestStatus: JoinRequestStatus | null,
): ViewerRelationship {
  if (!viewerId) return 'none'
  if (session.creatorId === viewerId) return 'host'
  if (session.participants.some(p => p.userId === viewerId)) return 'participant'
  if (requestStatus === 'pending') return 'pending'
  if (requestStatus === 'declined') return 'declined'
  return 'none'
}

export function isSessionClosed(status: SessionStatus): boolean {
  return status === 'cancelled' || status === 'completed'
}

export function isSessionFull(session: PracticeSession): boolean {
  return session.status === 'full' || session.currentParticipants >= session.maxParticipants
}

export function viewerStateFor(
  session: PracticeSession,
  viewerId: string | null,
  requestStatus: JoinRequestStatus | null = null,
): ViewerState {
  const relationship = relationshipFor(session, viewerId, requestStatus)
  const closed = isSessionClosed(session.status)

  // The host keeps managing a session after it closes — that's where its
  // history and participants remain visible.
  if (relationship === 'host') {
    return { relationship, action: 'manage', canRequest: false, canWithdraw: false, canLeave: false, canManage: true }
  }
  if (relationship === 'participant') {
    return {
      relationship, action: closed ? 'closed' : 'joined',
      canRequest: false, canWithdraw: false, canLeave: !closed, canManage: false,
    }
  }
  if (closed) {
    return { relationship, action: 'closed', canRequest: false, canWithdraw: false, canLeave: false, canManage: false }
  }
  if (relationship === 'pending') {
    return { relationship, action: 'pending', canRequest: false, canWithdraw: true, canLeave: false, canManage: false }
  }
  // A full session takes no more requests, and a declined requester doesn't
  // silently get another go — re-application is a deliberate product
  // decision, not a default (see the migration's partial unique index).
  if (isSessionFull(session)) {
    return { relationship, action: 'full', canRequest: false, canWithdraw: false, canLeave: false, canManage: false }
  }
  if (relationship === 'declined') {
    return { relationship, action: 'closed', canRequest: false, canWithdraw: false, canLeave: false, canManage: false }
  }
  return { relationship, action: 'request', canRequest: !!viewerId, canWithdraw: false, canLeave: false, canManage: false }
}

// Whether the host may accept one more request right now. Mirrors the
// guarded UPDATE in accept_practice_request so the button matches what the
// database will actually allow — the database remains the authority.
export function canAcceptAnotherRequest(session: PracticeSession): boolean {
  return !isSessionClosed(session.status) && session.currentParticipants < session.maxParticipants
}

export function seatsRemaining(session: PracticeSession): number {
  return Math.max(0, session.maxParticipants - session.currentParticipants)
}

export interface CapacityError { field: 'min' | 'max'; message: string }

// One validator used by the create form and by anything else that sets
// capacity, so the GD floor and the min<=max rule can't be enforced in one
// place and forgotten in another.
export function validateCapacity(
  practiceType: PracticeType,
  min: number,
  max: number,
): CapacityError | null {
  const floor = MIN_PARTICIPANTS_FOR_TYPE[practiceType] ?? 2
  if (!Number.isInteger(min) || min < floor) {
    return { field: 'min', message: `This format needs at least ${floor} participants.` }
  }
  if (!Number.isInteger(max) || max < min) {
    return { field: 'max', message: 'Maximum cannot be lower than minimum.' }
  }
  if (max > MAX_PARTICIPANTS_CEILING) {
    return { field: 'max', message: `Maximum is ${MAX_PARTICIPANTS_CEILING} participants.` }
  }
  return null
}

export function defaultCapacityFor(practiceType: PracticeType): { min: number; max: number } {
  const config = PRACTICE_TYPE_CONFIG[practiceType]
  return { min: config.defaultMin, max: config.defaultMax }
}

// ============================================================
// Scheduling
// ============================================================

export function sessionStartsAt(session: Pick<PracticeSession, 'scheduledDate' | 'startTime'>): Date {
  const [y, m, d] = session.scheduledDate.split('-').map(Number)
  const [hh, mm] = session.startTime.split(':').map(Number)
  // Built from parts so the session lands on the calendar day the host
  // picked, rather than being shifted by UTC parsing.
  return new Date(y, m - 1, d, hh, mm)
}

export function sessionEndsAt(session: Pick<PracticeSession, 'scheduledDate' | 'startTime' | 'durationMinutes'>): Date {
  return new Date(sessionStartsAt(session).getTime() + session.durationMinutes * 60_000)
}

// "Past" means the session's end time has gone by. Status is left alone:
// the spec is explicit that a scheduled time passing must not be taken as
// evidence the session actually happened.
export function isPast(session: PracticeSession, now: Date = new Date()): boolean {
  return sessionEndsAt(session) < now
}

export function isDiscoverable(session: PracticeSession, now: Date = new Date()): boolean {
  if (session.status === 'cancelled' || session.status === 'completed') return false
  return !isPast(session, now)
}

export function formatWhen(session: PracticeSession, now: Date = new Date()): string {
  const start = sessionStartsAt(session)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const dayDiff = Math.round((day.getTime() - today.getTime()) / 86_400_000)

  const time = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (dayDiff === 0) return `Today · ${time}`
  if (dayDiff === 1) return `Tomorrow · ${time}`
  if (dayDiff === -1) return `Yesterday · ${time}`
  return `${start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · ${time}`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`
  const hours = minutes / 60
  return hours === 1 ? '1 hour' : `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hours`
}
