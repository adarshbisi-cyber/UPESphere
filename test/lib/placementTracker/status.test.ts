import { describe, expect, it } from 'vitest'
import { currentRound, deriveApplicationStatus, isApplicationClosed } from '@/lib/placementTracker/status'
import type { PlacementRound } from '@/lib/placementTracker/types'

function round(overrides: Partial<PlacementRound>): PlacementRound {
  return {
    id: 'r1', applicationId: 'a1', roundOrder: 0, displayName: 'Round',
    analyticsCategory: 'other', outcome: 'upcoming',
    scheduledDate: null, completedDate: null, outcomeNotes: null, reflection: null,
    ...overrides,
  }
}

describe('deriveApplicationStatus', () => {
  it('is active when rounds are still in progress and nothing was eliminated', () => {
    const rounds = [
      round({ roundOrder: 0, outcome: 'cleared' }),
      round({ roundOrder: 1, outcome: 'pending' }),
    ]
    expect(deriveApplicationStatus(rounds)).toBe('active')
  })

  it('is rejected as soon as any round is eliminated, regardless of position', () => {
    const rounds = [
      round({ roundOrder: 0, outcome: 'cleared' }),
      round({ roundOrder: 1, outcome: 'eliminated' }),
      round({ roundOrder: 2, outcome: 'upcoming' }),
    ]
    expect(deriveApplicationStatus(rounds)).toBe('rejected')
  })

  it('is offer only when the final_outcome round is cleared', () => {
    const rounds = [
      round({ roundOrder: 0, outcome: 'cleared' }),
      round({ roundOrder: 1, analyticsCategory: 'final_outcome', outcome: 'cleared' }),
    ]
    expect(deriveApplicationStatus(rounds)).toBe('offer')
  })

  it('is not offer if the final_outcome round exists but is not yet cleared', () => {
    const rounds = [round({ analyticsCategory: 'final_outcome', outcome: 'pending' })]
    expect(deriveApplicationStatus(rounds)).toBe('active')
  })

  it('a manual withdrawal overrides everything, including an eventual offer', () => {
    const rounds = [round({ analyticsCategory: 'final_outcome', outcome: 'cleared' })]
    expect(deriveApplicationStatus(rounds, 'withdrawn')).toBe('withdrawn')
  })

  it('is active with no rounds at all (freshly created application)', () => {
    expect(deriveApplicationStatus([])).toBe('active')
  })
})

describe('isApplicationClosed', () => {
  it('treats rejected, withdrawn and closed as closed', () => {
    expect(isApplicationClosed('rejected')).toBe(true)
    expect(isApplicationClosed('withdrawn')).toBe(true)
    expect(isApplicationClosed('closed')).toBe(true)
  })

  it('treats active and offer as not closed', () => {
    expect(isApplicationClosed('active')).toBe(false)
    expect(isApplicationClosed('offer')).toBe(false)
  })
})

describe('currentRound', () => {
  it('picks the earliest unresolved round by order, not by array position', () => {
    const rounds = [
      round({ id: 'r2', roundOrder: 2, outcome: 'upcoming' }),
      round({ id: 'r1', roundOrder: 1, outcome: 'pending' }),
      round({ id: 'r0', roundOrder: 0, outcome: 'cleared' }),
    ]
    expect(currentRound(rounds)?.id).toBe('r1')
  })

  it('returns null when every round is resolved', () => {
    const rounds = [round({ outcome: 'cleared' }), round({ outcome: 'eliminated' })]
    expect(currentRound(rounds)).toBeNull()
  })

  it('returns null for an application with no rounds yet', () => {
    expect(currentRound([])).toBeNull()
  })
})
