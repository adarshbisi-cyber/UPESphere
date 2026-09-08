import { describe, expect, it } from 'vitest'
import {
  getApplicationJourneyState, getApplicationsNeedingUpdate, getUpcomingRounds,
} from '@/lib/placementTracker/journey'
import { computeExitReasonBreakdown, computeOverview, computeUpcomingActions } from '@/lib/placementTracker/analytics'
import { roundResult, roundStatus } from '@/lib/placementTracker/status'
import type {
  ApplicationStatus, ExitReason, PlacementApplication, PlacementRound, RoundOutcome, RoundType,
} from '@/lib/placementTracker/types'

let seq = 0
function round(
  type: RoundType, outcome: RoundOutcome, displayName: string, overrides: Partial<PlacementRound> = {},
): PlacementRound {
  seq++
  return {
    id: `r${seq}`, applicationId: 'a', roundOrder: seq, displayName, analyticsCategory: type,
    outcome, exitReason: null, scheduledDate: null, completedDate: null, outcomeNotes: null, reflection: null,
    ...overrides,
  }
}
function application(
  companyName: string, status: ApplicationStatus, rounds: PlacementRound[],
): PlacementApplication {
  seq++
  return {
    id: `a${seq}`, userId: 'u1', companyName, role: 'Associate', opportunityType: 'placement',
    industry: null, location: null, package: null, stipend: null, applicationDate: '2026-08-01',
    status, notes: null, rounds, createdAt: '', updatedAt: '',
  }
}

describe('getApplicationJourneyState', () => {
  // Scenario 1 from the spec. A rejected application whose later rounds are
  // still marked upcoming used to report "Current: Group Discussion" — a
  // stage the student can never reach.
  it('reports where a rejected application exited, never a current round', () => {
    const bain = application('Bain', 'rejected', [
      round('resume', 'cleared', 'Resume'),
      round('assessment', 'eliminated', 'Assessment'),
      round('group_discussion', 'upcoming', 'Group Discussion'),
    ])
    const state = getApplicationJourneyState(bain)
    expect(state.label).toBe('Rejected at: Assessment')
    expect(state.label).not.toContain('Current')
    expect(state.label).not.toContain('Group Discussion')
    expect(state.round?.displayName).toBe('Assessment')
  })

  it('says where a withdrawn application stopped', () => {
    const app = application('Deloitte', 'withdrawn', [
      round('resume', 'cleared', 'Resume'),
      round('case_interview', 'eliminated', 'Case Interview', { exitReason: 'WITHDREW' }),
    ])
    expect(getApplicationJourneyState(app).label).toBe('Withdrawn at: Case Interview')
  })

  it('reports an offer as an outcome with no round attached', () => {
    const app = application('BCG', 'offer', [round('final_interview', 'cleared', 'Final Interview')])
    const state = getApplicationJourneyState(app)
    expect(state.label).toBe('Offer Received')
    expect(state.phase).toBe('offer')
  })

  it('reports the next unresolved round while the journey is live', () => {
    const app = application('McKinsey', 'active', [
      round('resume', 'cleared', 'Resume'),
      round('case_interview', 'upcoming', 'Case Interview'),
    ])
    expect(getApplicationJourneyState(app).label).toBe('Current: Case Interview')
  })

  it('asks for an update when an active journey has run out of rounds', () => {
    const app = application('PwC', 'active', [round('resume', 'cleared', 'Resume')])
    expect(getApplicationJourneyState(app).label).toBe('Awaiting your update')
  })

  it('handles an application with no rounds yet', () => {
    expect(getApplicationJourneyState(application('New Co', 'active', [])).label).toBe('No rounds yet')
  })
})

describe('getUpcomingRounds', () => {
  // Scenario 2 from the spec: the metric and the list must agree.
  it('counts an undated upcoming round — a date is information, not a precondition', () => {
    const hilti = application('Hilti', 'active', [round('video', 'upcoming', 'Video Upload')])
    const upcoming = getUpcomingRounds([hilti])
    expect(upcoming).toHaveLength(1)
    expect(upcoming[0].round.displayName).toBe('Video Upload')
    expect(computeOverview([hilti]).upcomingRounds).toBe(1)
    expect(computeUpcomingActions([hilti])[0].detail).toBe('Next: Video Upload')
  })

  // Rule 6.
  it('excludes every closed application, however its rounds are left', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString()
    const apps: PlacementApplication[] = (['rejected', 'withdrawn', 'offer', 'closed'] as ApplicationStatus[])
      .map(status => application(status, status, [round('final_interview', 'upcoming', 'Interview', { scheduledDate: future })]))
    expect(getUpcomingRounds(apps)).toEqual([])
    expect(computeOverview(apps).upcomingRounds).toBe(0)
  })

  // Rule 5.
  it('surfaces only the earliest unresolved round per application', () => {
    const app = application('Kearney', 'active', [
      round('assessment', 'upcoming', 'Assessment'),
      round('case_interview', 'upcoming', 'Case Interview'),
    ])
    const upcoming = getUpcomingRounds([app])
    expect(upcoming).toHaveLength(1)
    expect(upcoming[0].round.displayName).toBe('Assessment')
  })

  it('orders dated rounds first, soonest first', () => {
    const soon = new Date(Date.now() + 86_400_000).toISOString()
    const later = new Date(Date.now() + 5 * 86_400_000).toISOString()
    const apps = [
      application('Undated', 'active', [round('assessment', 'upcoming', 'Assessment')]),
      application('Later', 'active', [round('assessment', 'upcoming', 'Assessment', { scheduledDate: later })]),
      application('Soon', 'active', [round('assessment', 'upcoming', 'Assessment', { scheduledDate: soon })]),
    ]
    expect(getUpcomingRounds(apps).map(u => u.application.companyName)).toEqual(['Soon', 'Later', 'Undated'])
  })
})

describe('getApplicationsNeedingUpdate', () => {
  it('finds active applications whose rounds are all resolved', () => {
    const stalled = application('Stalled', 'active', [round('resume', 'cleared', 'Resume')])
    const live = application('Live', 'active', [round('resume', 'upcoming', 'Resume')])
    const closed = application('Closed', 'rejected', [round('resume', 'eliminated', 'Resume')])
    expect(getApplicationsNeedingUpdate([stalled, live, closed]).map(a => a.companyName)).toEqual(['Stalled'])
  })
})

describe('round status and result are derived, never contradictory', () => {
  it('never reports a round as both upcoming and eliminated', () => {
    const outcomes: RoundOutcome[] = ['cleared', 'eliminated', 'pending', 'upcoming', 'withdrawn']
    for (const outcome of outcomes) {
      const r = round('assessment', outcome, 'Assessment')
      const status = roundStatus(r)
      const result = roundResult(r)
      if (status === 'ELIMINATED') expect(result).toBe('ELIMINATED')
      if (result === 'PROGRESSED') expect(status).toBe('COMPLETED')
      if (status === 'UPCOMING') expect(result).toBe('PENDING')
    }
  })
})

describe('computeExitReasonBreakdown', () => {
  // Scenario 4 from the spec.
  it('ranks the reasons journeys actually ended for', () => {
    const apps = [
      application('A', 'rejected', [round('resume', 'eliminated', 'Resume', { exitReason: 'RESUME_PROFILE' })]),
      application('B', 'rejected', [round('case_interview', 'eliminated', 'Case', { exitReason: 'CASE_STRUCTURE' })]),
      application('C', 'rejected', [round('case_interview', 'eliminated', 'Case', { exitReason: 'CASE_STRUCTURE' })]),
    ]
    const breakdown = computeExitReasonBreakdown(apps)
    expect(breakdown[0]).toMatchObject({ reason: 'CASE_STRUCTURE', label: 'Case Structure', count: 2 })
    expect(breakdown[1]).toMatchObject({ reason: 'RESUME_PROFILE', count: 1 })
  })

  it('ignores eliminations with no reason recorded, rather than inventing one', () => {
    const apps = [application('A', 'rejected', [round('resume', 'eliminated', 'Resume')])]
    expect(computeExitReasonBreakdown(apps)).toEqual([])
  })

  it('is empty when nothing has been eliminated', () => {
    expect(computeExitReasonBreakdown([application('A', 'active', [round('resume', 'cleared', 'Resume')])])).toEqual([])
  })
})
