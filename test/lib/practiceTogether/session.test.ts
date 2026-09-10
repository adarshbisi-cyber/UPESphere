import { describe, expect, it } from 'vitest'
import {
  canAcceptAnotherRequest, defaultCapacityFor, formatDuration, isDiscoverable, isPast,
  isSessionFull, relationshipFor, seatsRemaining, sessionEndsAt, sessionStartsAt,
  validateCapacity, viewerStateFor,
} from '@/lib/practiceTogether/session'
import type { JoinRequestStatus, PracticeSession, SessionStatus } from '@/lib/practiceTogether/types'

let seq = 0
function session(overrides: Partial<PracticeSession> = {}): PracticeSession {
  seq++
  return {
    id: `s${seq}`, creatorId: 'host', practiceType: 'case_prep', customPracticeType: null,
    title: 'Consulting Case Practice', description: null,
    scheduledDate: '2026-12-01', startTime: '19:00', durationMinutes: 60,
    mode: 'online', location: null, meetingLink: null,
    experienceLevel: 'intermediate', collegePreference: 'any',
    minParticipants: 2, maxParticipants: 2, currentParticipants: 1,
    status: 'open', typeSpecific: {}, createdAt: '', updatedAt: '',
    creator: null,
    participants: [{ id: 'p1', sessionId: `s${seq}`, userId: 'host', role: 'host', joinedAt: '', profile: null }],
    ...overrides,
  }
}

describe('relationshipFor', () => {
  it('ranks host above participant above pending', () => {
    const s = session({
      participants: [
        { id: 'p1', sessionId: 's', userId: 'host', role: 'host', joinedAt: '', profile: null },
        { id: 'p2', sessionId: 's', userId: 'amy', role: 'participant', joinedAt: '', profile: null },
      ],
    })
    // Even with a stray pending request, being seated wins.
    expect(relationshipFor(s, 'host', 'pending')).toBe('host')
    expect(relationshipFor(s, 'amy', 'pending')).toBe('participant')
    expect(relationshipFor(s, 'bob', 'pending')).toBe('pending')
    expect(relationshipFor(s, 'bob', null)).toBe('none')
  })

  it('treats a signed-out viewer as unrelated', () => {
    expect(relationshipFor(session(), null, 'pending')).toBe('none')
  })
})

describe('viewerStateFor — the button rules from the spec', () => {
  it('offers the host Manage Session, never Request to Join', () => {
    const state = viewerStateFor(session(), 'host')
    expect(state.action).toBe('manage')
    expect(state.canRequest).toBe(false)
    expect(state.canManage).toBe(true)
  })

  it('shows an accepted participant Joined, with the option to leave', () => {
    const s = session({
      currentParticipants: 2,
      participants: [
        { id: 'p1', sessionId: 's', userId: 'host', role: 'host', joinedAt: '', profile: null },
        { id: 'p2', sessionId: 's', userId: 'amy', role: 'participant', joinedAt: '', profile: null },
      ],
    })
    const state = viewerStateFor(s, 'amy')
    expect(state.action).toBe('joined')
    expect(state.canRequest).toBe(false)
    expect(state.canLeave).toBe(true)
  })

  it('shows a pending requester Request Pending, with the option to withdraw', () => {
    const state = viewerStateFor(session(), 'bob', 'pending')
    expect(state.action).toBe('pending')
    expect(state.canRequest).toBe(false)
    expect(state.canWithdraw).toBe(true)
  })

  it('offers Request to Join to an unrelated signed-in viewer', () => {
    const state = viewerStateFor(session(), 'bob')
    expect(state.action).toBe('request')
    expect(state.canRequest).toBe(true)
  })

  it('reports a full session as full and takes no more requests', () => {
    const full = session({ status: 'full', currentParticipants: 2 })
    const state = viewerStateFor(full, 'bob')
    expect(state.action).toBe('full')
    expect(state.canRequest).toBe(false)
  })

  it('treats a session at capacity as full even if the status lags behind', () => {
    const s = session({ status: 'open', currentParticipants: 2, maxParticipants: 2 })
    expect(isSessionFull(s)).toBe(true)
    expect(viewerStateFor(s, 'bob').canRequest).toBe(false)
  })

  it('takes no requests on a cancelled or completed session', () => {
    for (const status of ['cancelled', 'completed'] as SessionStatus[]) {
      expect(viewerStateFor(session({ status }), 'bob').canRequest).toBe(false)
    }
  })

  it('lets the host keep managing a session after it is cancelled', () => {
    expect(viewerStateFor(session({ status: 'cancelled' }), 'host').canManage).toBe(true)
  })

  it('does not let a participant leave a session that has already closed', () => {
    const s = session({
      status: 'cancelled',
      participants: [
        { id: 'p1', sessionId: 's', userId: 'host', role: 'host', joinedAt: '', profile: null },
        { id: 'p2', sessionId: 's', userId: 'amy', role: 'participant', joinedAt: '', profile: null },
      ],
    })
    expect(viewerStateFor(s, 'amy').canLeave).toBe(false)
  })

  it('does not silently re-offer joining after a decline', () => {
    const state = viewerStateFor(session(), 'bob', 'declined')
    expect(state.canRequest).toBe(false)
  })

  it('never offers a request to a signed-out viewer', () => {
    expect(viewerStateFor(session(), null).canRequest).toBe(false)
  })

  it('never offers two actions at once, for any combination', () => {
    const statuses: SessionStatus[] = ['open', 'full', 'completed', 'cancelled']
    const requests: (JoinRequestStatus | null)[] = [null, 'pending', 'accepted', 'declined', 'withdrawn']
    for (const status of statuses) {
      for (const request of requests) {
        for (const viewer of ['host', 'amy', 'bob', null]) {
          const s = session({
            status,
            currentParticipants: status === 'full' ? 2 : 1,
            participants: [
              { id: 'p1', sessionId: 's', userId: 'host', role: 'host', joinedAt: '', profile: null },
              { id: 'p2', sessionId: 's', userId: 'amy', role: 'participant', joinedAt: '', profile: null },
            ],
          })
          const st = viewerStateFor(s, viewer, request)
          const flags = [st.canRequest, st.canWithdraw, st.canLeave].filter(Boolean)
          expect(flags.length).toBeLessThanOrEqual(1)
          // Manage is the host's, and the host can do nothing else.
          if (st.canManage) expect(flags).toHaveLength(0)
        }
      }
    }
  })
})

describe('capacity', () => {
  it('counts the host as the first seat', () => {
    expect(seatsRemaining(session({ maxParticipants: 2, currentParticipants: 1 }))).toBe(1)
  })

  it('stops the host accepting past capacity', () => {
    expect(canAcceptAnotherRequest(session({ currentParticipants: 1, maxParticipants: 2 }))).toBe(true)
    expect(canAcceptAnotherRequest(session({ currentParticipants: 2, maxParticipants: 2 }))).toBe(false)
  })

  it('stops the host accepting into a cancelled session', () => {
    expect(canAcceptAnotherRequest(session({ status: 'cancelled', currentParticipants: 1 }))).toBe(false)
  })

  it('never reports negative seats', () => {
    expect(seatsRemaining(session({ currentParticipants: 5, maxParticipants: 2 }))).toBe(0)
  })
})

describe('validateCapacity', () => {
  it('accepts a normal pair session', () => {
    expect(validateCapacity('case_prep', 2, 2)).toBeNull()
  })

  it('enforces the group discussion floor of 4', () => {
    expect(validateCapacity('group_discussion', 3, 6)?.field).toBe('min')
    expect(validateCapacity('group_discussion', 4, 6)).toBeNull()
  })

  it('rejects a maximum below the minimum', () => {
    expect(validateCapacity('group_discussion', 6, 4)?.field).toBe('max')
  })

  it('rejects a session nobody else can join', () => {
    expect(validateCapacity('case_prep', 1, 1)?.field).toBe('min')
  })

  it('caps the maximum', () => {
    expect(validateCapacity('aptitude', 2, 99)?.field).toBe('max')
  })

  it('defaults each type to a sensible capacity that passes its own rules', () => {
    for (const type of ['case_prep', 'guesstimate', 'group_discussion', 'mock_interview', 'hr_interview', 'aptitude', 'other'] as const) {
      const { min, max } = defaultCapacityFor(type)
      expect(validateCapacity(type, min, max)).toBeNull()
    }
  })
})

describe('scheduling', () => {
  it('builds the start time on the host’s chosen calendar day, not a UTC-shifted one', () => {
    const start = sessionStartsAt({ scheduledDate: '2026-12-01', startTime: '19:00' })
    expect(start.getFullYear()).toBe(2026)
    expect(start.getMonth()).toBe(11)
    expect(start.getDate()).toBe(1)
    expect(start.getHours()).toBe(19)
  })

  it('ends a session after its duration', () => {
    const end = sessionEndsAt({ scheduledDate: '2026-12-01', startTime: '19:00', durationMinutes: 90 })
    expect(end.getHours()).toBe(20)
    expect(end.getMinutes()).toBe(30)
  })

  it('is only past once the session has finished, not when it starts', () => {
    const s = session({ scheduledDate: '2026-12-01', startTime: '19:00', durationMinutes: 60 })
    expect(isPast(s, new Date(2026, 11, 1, 19, 30))).toBe(false)
    expect(isPast(s, new Date(2026, 11, 1, 20, 30))).toBe(true)
  })

  it('hides cancelled and past sessions from Discover, but not full ones', () => {
    const now = new Date(2026, 10, 1)
    expect(isDiscoverable(session({ status: 'cancelled' }), now)).toBe(false)
    expect(isDiscoverable(session({ status: 'completed' }), now)).toBe(false)
    expect(isDiscoverable(session({ status: 'full' }), now)).toBe(true)
    expect(isDiscoverable(session({ scheduledDate: '2020-01-01' }), now)).toBe(false)
  })

  it('formats durations readably', () => {
    expect(formatDuration(30)).toBe('30 minutes')
    expect(formatDuration(60)).toBe('1 hour')
    expect(formatDuration(90)).toBe('1.5 hours')
    expect(formatDuration(120)).toBe('2 hours')
  })
})
