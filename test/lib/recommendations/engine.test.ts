import { describe, expect, it } from 'vitest'
import {
  computeRecommendations, recommendationForRound, topRecommendation,
} from '@/lib/recommendations/engine'
import { practiceTypeForRound } from '@/lib/recommendations/mapping'
import { signatureFor } from '@/lib/recommendations/types'
import { safeRedirectPath } from '@/lib/auth/redirect'
import type { PlacementApplication, PlacementRound, RoundOutcome, RoundType } from '@/lib/placementTracker/types'
import type { PracticeSession, PracticeType, SessionStatus } from '@/lib/practiceTogether/types'

let seq = 0
function round(type: RoundType, outcome: RoundOutcome): PlacementRound {
  seq++
  return {
    id: `r${seq}`, applicationId: 'a', roundOrder: seq, displayName: type, analyticsCategory: type,
    outcome, exitReason: null, scheduledDate: null, completedDate: null, outcomeNotes: null, reflection: null,
  }
}
function application(rounds: PlacementRound[]): PlacementApplication {
  seq++
  return {
    id: `a${seq}`, userId: 'me', companyName: `Co ${seq}`, role: 'Associate', opportunityType: 'placement',
    industry: null, location: null, package: null, stipend: null, applicationDate: '2026-08-01',
    status: 'active', notes: null, rounds, createdAt: '', updatedAt: '',
  }
}
function practice(practiceType: PracticeType, status: SessionStatus = 'completed', userId = 'me'): PracticeSession {
  seq++
  return {
    id: `s${seq}`, creatorId: userId, practiceType, customPracticeType: null, title: 'Practice',
    description: null, scheduledDate: '2026-08-20', startTime: '19:00', durationMinutes: 60,
    mode: 'online', location: null, meetingLink: null, experienceLevel: 'any', collegePreference: 'any',
    minParticipants: 2, maxParticipants: 2, currentParticipants: 2, status, typeSpecific: {},
    createdAt: '', updatedAt: '', creator: null,
    participants: [{ id: `p${seq}`, sessionId: `s${seq}`, userId, role: 'host', joinedAt: '', profile: null }],
  }
}
const run = (applications: PlacementApplication[], practiceSessions: PracticeSession[] = [], dismissedSignatures: string[] = []) =>
  computeRecommendations({ userId: 'me', applications, practiceSessions, dismissedSignatures })

// Eliminated at `type` in `losses` applications, cleared it in `wins`.
function stage(type: RoundType, losses: number, wins = 0): PlacementApplication[] {
  return [
    ...Array.from({ length: losses }, () => application([round(type, 'eliminated')])),
    ...Array.from({ length: wins }, () => application([round(type, 'cleared')])),
  ]
}

describe('round -> practice mapping', () => {
  it('maps each stage to the format that actually addresses it', () => {
    expect(practiceTypeForRound('group_discussion')).toBe('group_discussion')
    expect(practiceTypeForRound('assessment')).toBe('aptitude')
    expect(practiceTypeForRound('case_interview')).toBe('case_prep')
    expect(practiceTypeForRound('hr_fit')).toBe('hr_interview')
    expect(practiceTypeForRound('final_interview')).toBe('mock_interview')
  })

  // Spec test 15: an unmapped round must not produce an irrelevant nudge.
  it('refuses to map a stage no practice format addresses', () => {
    expect(practiceTypeForRound('other')).toBeNull()
    // Practice Together has no resume-review format, so sending someone to a
    // live session would not help them.
    expect(practiceTypeForRound('resume')).toBeNull()
  })

  it('produces no recommendation at all for an unmappable stage', () => {
    expect(run(stage('other', 3))).toEqual([])
    expect(run(stage('resume', 4))).toEqual([])
  })
})

describe('generating from placement data', () => {
  // Spec tests 1-2.
  it('makes a gentle low-priority suggestion after a single exit', () => {
    const recs = run(stage('group_discussion', 1))
    expect(recs).toHaveLength(1)
    expect(recs[0]).toMatchObject({
      practiceType: 'group_discussion', priority: 'LOW', confidence: 'LIMITED', status: 'ACTIVE',
    })
    expect(recs[0].description).toContain('recently exited')
  })

  // Spec tests 3-4.
  it('escalates as the pattern hardens', () => {
    expect(run(stage('group_discussion', 2))[0].priority).toBe('MEDIUM')
    expect(run(stage('group_discussion', 2, 1))[0]).toMatchObject({ confidence: 'EMERGING', priority: 'MEDIUM' })
    expect(run(stage('group_discussion', 3, 2))[0]).toMatchObject({ confidence: 'ESTABLISHED', priority: 'HIGH' })
  })

  it('never claims high priority from thin evidence', () => {
    for (const rec of [...run(stage('group_discussion', 1)), ...run(stage('case_interview', 1))]) {
      expect(rec.priority).not.toBe('HIGH')
      expect(rec.confidence).toBe('LIMITED')
    }
  })

  // Confidence is about how much evidence exists, not how bad the stage is.
  it('does not recommend practising a stage the student mostly clears', () => {
    // Cut once in nine attempts: plentiful evidence that they are fine at it.
    expect(run(stage('group_discussion', 1, 8))).toEqual([])
    expect(run(stage('case_interview', 2, 10))).toEqual([])
  })

  it('still nudges gently when there is too little data to judge the rate', () => {
    // One exit from one attempt says little, so the nudge stands.
    expect(run(stage('group_discussion', 1))[0].priority).toBe('LOW')
  })

  it('says nothing when nobody has been eliminated anywhere', () => {
    expect(run(stage('group_discussion', 0, 4))).toEqual([])
    expect(run([])).toEqual([])
  })

  it('carries the evidence it used, so the call can be audited', () => {
    const rec = run(stage('assessment', 3, 2))[0]
    expect(rec.evidence).toMatchObject({ eliminated: 3, reached: 5 })
    expect(rec.evidence.eliminationRate).toBeCloseTo(0.6)
    expect(rec.description).toContain('3')
  })

  // Spec test 13-14.
  it('recommends the right format for a different weak stage', () => {
    expect(run(stage('assessment', 2))[0].practiceType).toBe('aptitude')
    expect(run(stage('case_interview', 2))[0].practiceType).toBe('case_prep')
    expect(run(stage('hr_fit', 2))[0].practiceType).toBe('hr_interview')
  })

  it('ranks the strongest evidence first', () => {
    const recs = run([...stage('group_discussion', 1), ...stage('assessment', 3, 2)])
    expect(recs[0].practiceType).toBe('aptitude')
    expect(recs[0].priority).toBe('HIGH')
    expect(recs[1].priority).toBe('LOW')
  })
})

describe('deduplication and staleness', () => {
  // Spec test 11: re-deriving is not re-creating.
  it('returns the same stable recommendation however many times it runs', () => {
    const apps = stage('group_discussion', 2)
    const a = run(apps)
    const b = run(apps)
    const c = run(apps)
    expect(a.map(r => r.id)).toEqual(b.map(r => r.id))
    expect(b).toEqual(c)
    expect(new Set(a.map(r => r.id)).size).toBe(a.length)
  })

  // Spec test 12: removing the evidence removes the recommendation.
  it('disappears when the applications behind it are deleted', () => {
    const apps = stage('group_discussion', 2)
    expect(run(apps)).toHaveLength(1)
    expect(run([])).toEqual([])
  })

  it('recalculates rather than persisting a stale verdict', () => {
    // The same stage, now mostly cleared, is no longer a weakness at all.
    expect(run(stage('group_discussion', 1, 8))).toEqual([])
  })
})

describe('dismissal', () => {
  it('hides a recommendation the user dismissed', () => {
    const apps = stage('group_discussion', 2)
    const signature = signatureFor('group_discussion', 'MEDIUM')
    expect(run(apps, [], [signature])[0].status).toBe('DISMISSED')
    expect(topRecommendation(run(apps, [], [signature]))).toBeNull()
  })

  // Spec §17: dismissing does not silence a weakness that later hardens.
  it('surfaces again when the same weakness becomes materially stronger', () => {
    const dismissed = [signatureFor('group_discussion', 'MEDIUM')]
    // Escalating to HIGH changes the signature, so the old dismissal no
    // longer applies.
    const recs = run(stage('group_discussion', 3, 2), [], dismissed)
    expect(recs[0]).toMatchObject({ priority: 'HIGH', status: 'ACTIVE' })
  })

  it('leaves the underlying evidence intact when dismissed', () => {
    const recs = run(stage('group_discussion', 2), [], [signatureFor('group_discussion', 'MEDIUM')])
    expect(recs[0].evidence.eliminated).toBe(2)
  })
})

describe('acting on a recommendation', () => {
  // Spec tests 9-10.
  it('marks it completed once the user actually practises that format', () => {
    const recs = run(stage('group_discussion', 2), [practice('group_discussion')])
    expect(recs[0].status).toBe('COMPLETED')
    expect(recs[0].evidence.practiceSessionsCompleted).toBe(1)
  })

  // Spec §16: clicking through is not doing the thing.
  it('does not count a session that never happened', () => {
    for (const status of ['open', 'full', 'cancelled'] as SessionStatus[]) {
      expect(run(stage('group_discussion', 2), [practice('group_discussion', status)])[0].status).toBe('ACTIVE')
    }
  })

  it('does not count practice of a different format', () => {
    expect(run(stage('group_discussion', 2), [practice('case_prep')])[0].status).toBe('ACTIVE')
  })

  it("does not count someone else's session", () => {
    expect(run(stage('group_discussion', 2), [practice('group_discussion', 'completed', 'someone-else')])[0].status)
      .toBe('ACTIVE')
  })

  it('counts acting on it above having dismissed it', () => {
    const recs = run(stage('group_discussion', 2), [practice('group_discussion')], [signatureFor('group_discussion', 'MEDIUM')])
    expect(recs[0].status).toBe('COMPLETED')
  })
})

describe('surfacing', () => {
  it('offers only an active recommendation to the dashboard', () => {
    expect(topRecommendation(run(stage('group_discussion', 2)))?.practiceType).toBe('group_discussion')
    expect(topRecommendation(run(stage('group_discussion', 2), [practice('group_discussion')]))).toBeNull()
    expect(topRecommendation([])).toBeNull()
  })

  it('finds the recommendation for the stage just recorded', () => {
    const recs = run(stage('group_discussion', 2))
    expect(recommendationForRound('group_discussion', recs)?.practiceType).toBe('group_discussion')
  })

  it('offers nothing for a stage that cannot be practised', () => {
    const recs = run([...stage('group_discussion', 2), ...stage('other', 2)])
    expect(recommendationForRound('other', recs)).toBeNull()
    expect(recommendationForRound('resume', recs)).toBeNull()
  })

  it('offers nothing for a stage the user has already practised', () => {
    const recs = run(stage('group_discussion', 2), [practice('group_discussion')])
    expect(recommendationForRound('group_discussion', recs)).toBeNull()
  })
})

describe('copy stands on its own', () => {
  // Regression: the engine used to take the label from the student's own
  // round wording, so a round typed as "R3" produced "Practice R3".
  it('uses canonical names, not whatever the student typed', () => {
    const odd = round('group_discussion', 'eliminated')
    odd.displayName = 'R3 — gd final'
    const recs = run([application([odd]), application([round('group_discussion', 'eliminated')])])
    expect(recs[0].title).toBe('Practice Group Discussion')
    expect(recs[0].roundLabel).toBe('Group Discussion')
    expect(recs[0].description).not.toContain('R3')
  })

  it('names the practice format the student will actually do', () => {
    expect(run(stage('assessment', 2))[0].title).toBe('Practice Aptitude')
    expect(run(stage('case_interview', 2))[0].title).toBe('Practice Case Prep')
    expect(run(stage('final_interview', 2))[0].title).toBe('Practice Mock Interview')
  })
})

describe('the deep link survives a sign-in bounce', () => {
  it('keeps the practice filter on the redirect target', () => {
    // Middleware sends `path + search` to /login, and safeRedirectPath must
    // not strip the query — otherwise "Find GD Practice" lands the student
    // on an unfiltered page after signing in.
    expect(safeRedirectPath('/practice?practiceType=group_discussion'))
      .toBe('/practice?practiceType=group_discussion')
  })

  it('still refuses an off-site redirect', () => {
    expect(safeRedirectPath('//evil.example.com')).toBe('/dashboard')
    expect(safeRedirectPath('https://evil.example.com')).toBe('/dashboard')
  })
})
