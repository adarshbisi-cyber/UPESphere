import { describe, expect, it } from 'vitest'
import {
  computeActiveApplicationSummaries, computeBiggestBottleneck, computeConversionFunnel,
  computeFunnel, computeGroupPatterns, computeOverview, computeRoundPerformance,
  computeStrongestStage, computeTrends, confidenceFor, hasEnoughDataForInsights,
} from '@/lib/placementTracker/analytics'
import type { AnalyticsCategory, PlacementApplication, PlacementRound, RoundOutcome } from '@/lib/placementTracker/types'

let seq = 0
function round(category: AnalyticsCategory, outcome: RoundOutcome, overrides: Partial<PlacementRound> = {}): PlacementRound {
  seq++
  return {
    id: `r${seq}`, applicationId: 'a', roundOrder: seq, displayName: category, analyticsCategory: category,
    outcome, scheduledDate: null, completedDate: null, outcomeNotes: null, reflection: null,
    ...overrides,
  }
}

function application(overrides: Partial<PlacementApplication> = {}): PlacementApplication {
  seq++
  return {
    id: `a${seq}`, userId: 'u1', companyName: `Company ${seq}`, role: 'Analyst', opportunityType: 'placement',
    industry: null, location: null, package: null, stipend: null, applicationDate: '2026-01-01',
    status: 'active', notes: null, rounds: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('confidenceFor', () => {
  it('classifies observation counts into the three documented tiers', () => {
    expect(confidenceFor(1).label).toBe('Early Pattern')
    expect(confidenceFor(2).label).toBe('Early Pattern')
    expect(confidenceFor(3).label).toBe('Emerging Pattern')
    expect(confidenceFor(4).label).toBe('Emerging Pattern')
    expect(confidenceFor(5).label).toBe('Consistent Pattern')
    expect(confidenceFor(20).label).toBe('Consistent Pattern')
  })
})

describe('computeOverview', () => {
  it('counts total/active/offers correctly and never counts a rejected application as active', () => {
    const apps = [
      application({ status: 'active' }),
      application({ status: 'rejected' }),
      application({ status: 'offer' }),
      application({ status: 'withdrawn' }),
    ]
    const overview = computeOverview(apps)
    expect(overview.totalApplications).toBe(4)
    expect(overview.activeApplications).toBe(1)
    expect(overview.offersReceived).toBe(1)
  })

  it('counts upcoming rounds only for applications with a genuinely future scheduled round', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString()
    const past = new Date(Date.now() - 86_400_000).toISOString()
    const apps = [
      application({ rounds: [round('interview', 'upcoming', { scheduledDate: future })] }),
      application({ rounds: [round('interview', 'upcoming', { scheduledDate: past })] }), // past — not upcoming
      application({ rounds: [round('interview', 'upcoming', { scheduledDate: null })] }), // no date — not counted
      application({ rounds: [round('interview', 'eliminated', { scheduledDate: future })] }), // resolved — not counted
    ]
    expect(computeOverview(apps).upcomingRounds).toBe(1)
  })
})

describe('computeActiveApplicationSummaries', () => {
  it('only includes active applications and reports the current (earliest unresolved) round', () => {
    const active = application({
      status: 'active',
      rounds: [
        round('resume_screening', 'cleared', { roundOrder: 0, displayName: 'Resume Screening' }),
        round('interview', 'pending', { roundOrder: 1, displayName: 'Case Interview' }),
      ],
    })
    const rejected = application({ status: 'rejected' })
    const summaries = computeActiveApplicationSummaries([active, rejected])
    expect(summaries).toHaveLength(1)
    expect(summaries[0].currentStage).toBe('Case Interview')
  })
})

describe('computeFunnel', () => {
  it('counts rounds reached per category and excludes categories with zero reached', () => {
    const apps = [application({ rounds: [
      round('resume_screening', 'cleared'),
      round('assessment', 'eliminated'),
      round('interview', 'upcoming'), // not reached yet — excluded from its own count
    ] })]
    const funnel = computeFunnel(apps)
    const byCategory = Object.fromEntries(funnel.map(f => [f.category, f.count]))
    expect(byCategory.resume_screening).toBe(1)
    expect(byCategory.assessment).toBe(1)
    expect(byCategory.interview).toBeUndefined()
  })
})

describe('computeBiggestBottleneck', () => {
  it('identifies the category with the highest elimination rate, matching the spec example', () => {
    // 5 of 7 assessment rounds eliminated, 0 of 2 interview rounds eliminated.
    const rounds = [
      ...Array.from({ length: 5 }, () => round('assessment', 'eliminated')),
      ...Array.from({ length: 2 }, () => round('assessment', 'cleared')),
      ...Array.from({ length: 2 }, () => round('interview', 'cleared')),
    ]
    const bottleneck = computeBiggestBottleneck([application({ rounds })])
    expect(bottleneck?.category).toBe('assessment')
    expect(bottleneck?.eliminated).toBe(5)
    expect(bottleneck?.reached).toBe(7)
    expect(bottleneck?.supportingData).toBe('You were eliminated in 5 of the 7 assessment rounds you reached.')
    expect(bottleneck?.confidence.label).toBe('Consistent Pattern')
  })

  it('returns null when nobody has been eliminated anywhere', () => {
    const rounds = [round('assessment', 'cleared'), round('interview', 'cleared')]
    expect(computeBiggestBottleneck([application({ rounds })])).toBeNull()
  })

  it('uses low confidence language for a single data point', () => {
    const rounds = [round('assessment', 'eliminated')]
    const bottleneck = computeBiggestBottleneck([application({ rounds })])
    expect(bottleneck?.confidence.label).toBe('Early Pattern')
  })

  it('never treats upcoming or pending rounds as eliminations', () => {
    const rounds = [round('assessment', 'upcoming'), round('assessment', 'pending')]
    expect(computeBiggestBottleneck([application({ rounds })])).toBeNull()
  })
})

describe('computeStrongestStage', () => {
  it('identifies the category with the highest progression rate, matching the spec example', () => {
    const rounds = [
      ...Array.from({ length: 4 }, () => round('interview', 'cleared')),
      round('interview', 'eliminated'),
    ]
    const strength = computeStrongestStage([application({ rounds })])
    expect(strength?.category).toBe('interview')
    expect(strength?.progressed).toBe(4)
    expect(strength?.reached).toBe(5)
    expect(strength?.supportingData).toBe('You progressed through 4 of your last 5 interview rounds.')
  })

  it('returns null when there is no progression anywhere', () => {
    const rounds = [round('assessment', 'eliminated')]
    expect(computeStrongestStage([application({ rounds })])).toBeNull()
  })
})

describe('computeTrends', () => {
  it('reports an improvement across the two halves of applications, chronologically split', () => {
    const earlier = [
      application({ applicationDate: '2026-01-01', rounds: [round('assessment', 'eliminated'), round('assessment', 'eliminated'), round('assessment', 'cleared')] }),
    ]
    const recent = [
      application({ applicationDate: '2026-06-01', rounds: [round('assessment', 'cleared'), round('assessment', 'cleared'), round('assessment', 'eliminated')] }),
    ]
    const trends = computeTrends([...earlier, ...recent])
    const assessmentTrend = trends.find(t => t.category === 'assessment')
    expect(assessmentTrend).toBeDefined()
    expect(assessmentTrend!.recentRate).toBeGreaterThan(assessmentTrend!.earlierRate)
  })

  it('does not claim improvement when the rate did not actually improve', () => {
    const earlier = [application({ applicationDate: '2026-01-01', rounds: [round('assessment', 'cleared'), round('assessment', 'cleared')] })]
    const recent = [application({ applicationDate: '2026-06-01', rounds: [round('assessment', 'eliminated'), round('assessment', 'eliminated')] })]
    const trends = computeTrends([...earlier, ...recent])
    expect(trends.find(t => t.category === 'assessment')).toBeUndefined()
  })

  it('says nothing when either half has too little data to compare', () => {
    const earlier = [application({ applicationDate: '2026-01-01', rounds: [round('assessment', 'cleared')] })]
    const recent = [application({ applicationDate: '2026-06-01', rounds: [round('assessment', 'cleared'), round('assessment', 'cleared')] })]
    expect(computeTrends([...earlier, ...recent])).toEqual([])
  })
})

describe('computeRoundPerformance / computeConversionFunnel', () => {
  it('matches the spec\'s example shape (reached/eliminated per category)', () => {
    const rounds = [
      ...Array.from({ length: 4 }, () => round('resume_screening', 'cleared')),
      ...Array.from({ length: 4 }, () => round('resume_screening', 'eliminated')),
      ...Array.from({ length: 2 }, () => round('assessment', 'cleared')),
      ...Array.from({ length: 4 }, () => round('assessment', 'eliminated')),
      ...Array.from({ length: 2 }, () => round('interview', 'cleared')),
    ]
    const table = computeRoundPerformance([application({ rounds })])
    expect(table.find(r => r.category === 'resume_screening')).toMatchObject({ reached: 8, eliminated: 4 })
    expect(table.find(r => r.category === 'assessment')).toMatchObject({ reached: 6, eliminated: 4 })
    expect(table.find(r => r.category === 'interview')).toMatchObject({ reached: 2, eliminated: 0 })

    const funnel = computeConversionFunnel([application({ rounds })])
    expect(funnel.map(f => f.category)).toEqual(['resume_screening', 'assessment', 'interview'])
  })
})

describe('computeGroupPatterns', () => {
  it('requires at least 2 groups with 3+ applications each before comparing industries', () => {
    const consulting = Array.from({ length: 3 }, () => application({ industry: 'Consulting', rounds: [round('interview', 'cleared'), round('interview', 'cleared')] }))
    const tech = Array.from({ length: 3 }, () => application({ industry: 'Technology', rounds: [round('interview', 'eliminated')] }))
    const patterns = computeGroupPatterns([...consulting, ...tech])
    const industryPattern = patterns.find(p => p.dimension === 'industry')
    expect(industryPattern?.better).toBe('Consulting')
    expect(industryPattern?.worse).toBe('Technology')
  })

  it('produces no industry pattern with too few applications per group', () => {
    const apps = [application({ industry: 'Consulting' }), application({ industry: 'Technology' })]
    expect(computeGroupPatterns(apps).find(p => p.dimension === 'industry')).toBeUndefined()
  })
})

describe('hasEnoughDataForInsights', () => {
  it('is false with fewer than 2 resolved rounds', () => {
    expect(hasEnoughDataForInsights([application({ rounds: [round('assessment', 'cleared')] })])).toBe(false)
    expect(hasEnoughDataForInsights([application({ rounds: [round('assessment', 'upcoming'), round('assessment', 'pending')] })])).toBe(false)
  })

  it('is true with 2 or more resolved rounds', () => {
    expect(hasEnoughDataForInsights([application({ rounds: [round('assessment', 'cleared'), round('interview', 'eliminated')] })])).toBe(true)
  })
})
