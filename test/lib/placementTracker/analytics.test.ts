import { describe, expect, it } from 'vitest'
import {
  computeActiveApplicationSummaries, computeApplicationFunnel, computeBiggestBottleneck,
  computeConversionSteps, computeGroupPatterns, computeObservations, computeOverview,
  computePlacementPattern, computeRoundPerformance, computeStrongestStage, computeTrends,
  computeStageInsights, computeUpcomingActions, confidenceFor, hasEnoughDataForInsights,
} from '@/lib/placementTracker/analytics'
import type { RoundType, PlacementApplication, PlacementRound, RoundOutcome } from '@/lib/placementTracker/types'

let seq = 0
function round(category: RoundType, outcome: RoundOutcome, overrides: Partial<PlacementRound> = {}): PlacementRound {
  seq++
  return {
    id: `r${seq}`, applicationId: 'a', roundOrder: seq, displayName: category, analyticsCategory: category,
    outcome, exitReason: null, scheduledDate: null, completedDate: null, outcomeNotes: null, reflection: null,
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
    expect(confidenceFor(1).label).toBe('Limited Data')
    expect(confidenceFor(2).label).toBe('Limited Data')
    expect(confidenceFor(3).label).toBe('Emerging Pattern')
    expect(confidenceFor(4).label).toBe('Emerging Pattern')
    expect(confidenceFor(5).label).toBe('Established Pattern')
    expect(confidenceFor(20).label).toBe('Established Pattern')
  })

  it('only qualifies a stage for classification at 3+ observations', () => {
    expect(confidenceFor(2).qualifies).toBe(false)
    expect(confidenceFor(3).qualifies).toBe(true)
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

  // Regression: this metric used to require a future scheduled date, which
  // silently disagreed with the Upcoming Actions list beside it.
  it('counts an upcoming round even when no date has been scheduled yet', () => {
    const hilti = application({ status: 'active', rounds: [round('video', 'upcoming', { displayName: 'Video Upload' })] })
    expect(computeOverview([hilti]).upcomingRounds).toBe(1)
    expect(computeUpcomingActions([hilti])).toHaveLength(1)
  })

  it('never counts rounds left over on a closed application', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString()
    const apps = [
      application({ status: 'rejected', rounds: [round('final_interview', 'upcoming', { scheduledDate: future })] }),
      application({ status: 'withdrawn', rounds: [round('final_interview', 'upcoming', { scheduledDate: future })] }),
      application({ status: 'offer', rounds: [round('final_interview', 'upcoming', { scheduledDate: future })] }),
    ]
    expect(computeOverview(apps).upcomingRounds).toBe(0)
  })

  it('agrees with the Upcoming Actions list it is rendered beside', () => {
    const apps = [
      application({ status: 'active', rounds: [round('assessment', 'upcoming')] }),
      application({ status: 'active', rounds: [round('case_interview', 'pending')] }),
      application({ status: 'rejected', rounds: [round('assessment', 'eliminated')] }),
    ]
    const nextRoundActions = computeUpcomingActions(apps).filter(a => a.kind === 'next_round')
    expect(computeOverview(apps).upcomingRounds).toBe(nextRoundActions.length)
  })
})

describe('computeActiveApplicationSummaries', () => {
  it('only includes active applications and reports the current (earliest unresolved) round', () => {
    const active = application({
      status: 'active',
      rounds: [
        round('resume', 'cleared', { roundOrder: 0, displayName: 'Resume Screening' }),
        round('final_interview', 'pending', { roundOrder: 1, displayName: 'Case Interview' }),
      ],
    })
    const rejected = application({ status: 'rejected' })
    const summaries = computeActiveApplicationSummaries([active, rejected])
    expect(summaries).toHaveLength(1)
    expect(summaries[0].currentStage).toBe('Case Interview')
  })
})

describe('computeApplicationFunnel', () => {
  it('counts applications through each stage, starting from Applied', () => {
    const apps = [
      application({ rounds: [round('resume', 'cleared'), round('assessment', 'cleared')] }),
      application({ rounds: [round('resume', 'cleared'), round('assessment', 'eliminated')] }),
      application({ rounds: [round('resume', 'eliminated')] }),
    ]
    const funnel = computeApplicationFunnel(apps)
    expect(funnel[0]).toMatchObject({ key: 'applied', count: 3 })
    expect(funnel.find(f => f.key === 'resume')).toMatchObject({ count: 2, reached: 3 })
    expect(funnel.find(f => f.key === 'assessment')).toMatchObject({ count: 1, reached: 2 })
  })

  it('omits stages no application has reached', () => {
    const apps = [application({ rounds: [round('resume', 'cleared'), round('final_interview', 'upcoming')] })]
    const funnel = computeApplicationFunnel(apps)
    expect(funnel.find(f => f.key === 'final_interview')).toBeUndefined()
  })

  it("keeps the student's own round name when a stage is named consistently", () => {
    const apps = [
      application({ rounds: [round('assessment', 'cleared', { displayName: 'Aptitude Test' })] }),
      application({ rounds: [round('assessment', 'eliminated', { displayName: 'Aptitude Test' })] }),
    ]
    expect(computeApplicationFunnel(apps).find(f => f.key === 'assessment')?.label).toBe('Aptitude Test')
  })

  it('falls back to the generic category label when companies name a stage differently', () => {
    const apps = [
      application({ rounds: [round('assessment', 'cleared', { displayName: 'Aptitude Test' })] }),
      application({ rounds: [round('assessment', 'cleared', { displayName: 'Online Assessment' })] }),
    ]
    expect(computeApplicationFunnel(apps).find(f => f.key === 'assessment')?.label).toBe('Online Test / Assessment')
  })

  it('returns nothing at all with no applications', () => {
    expect(computeApplicationFunnel([])).toEqual([])
  })
})

describe('computeBiggestBottleneck', () => {
  it('identifies the category with the highest elimination rate, matching the spec example', () => {
    // 5 of 7 assessment rounds eliminated, 0 of 2 interview rounds eliminated.
    const rounds = [
      ...Array.from({ length: 5 }, () => round('assessment', 'eliminated')),
      ...Array.from({ length: 2 }, () => round('assessment', 'cleared')),
      ...Array.from({ length: 2 }, () => round('final_interview', 'cleared')),
    ]
    const result = computeBiggestBottleneck([application({ rounds })])
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.insight.category).toBe('assessment')
    expect(result.insight.eliminated).toBe(5)
    expect(result.insight.reached).toBe(7)
    expect(result.insight.confidence.label).toBe('Established Pattern')
    expect(result.insight.suggestedFocus.length).toBeGreaterThan(0)
  })

  it('reports no drop-off (not missing data) when a well-evidenced stage has zero eliminations', () => {
    const rounds = [
      ...Array.from({ length: 3 }, () => round('assessment', 'cleared')),
      ...Array.from({ length: 3 }, () => round('final_interview', 'cleared')),
    ]
    expect(computeBiggestBottleneck([application({ rounds })]).status).toBe('no_dropoff')
  })

  // The spec is explicit: below 3 relevant applications, say "More data
  // needed" rather than claiming a pattern exists.
  it('refuses to name a drop-off from fewer than three observations', () => {
    const rounds = [round('assessment', 'eliminated'), round('assessment', 'cleared')]
    expect(computeBiggestBottleneck([application({ rounds })]).status).toBe('insufficient_data')
  })

  it('names a drop-off once the third observation arrives', () => {
    const rounds = [round('assessment', 'eliminated'), round('assessment', 'eliminated'), round('assessment', 'cleared')]
    expect(computeBiggestBottleneck([application({ rounds })]).status).toBe('ok')
  })

  it('never treats upcoming or pending rounds as eliminations', () => {
    const rounds = [round('assessment', 'upcoming'), round('assessment', 'pending')]
    expect(computeBiggestBottleneck([application({ rounds })]).status).not.toBe('ok')
  })
})

describe('computeStrongestStage', () => {
  it('identifies the category with the highest progression rate and reports it as a rate', () => {
    const rounds = [
      ...Array.from({ length: 4 }, () => round('final_interview', 'cleared')),
      round('final_interview', 'eliminated'),
    ]
    const result = computeStrongestStage([application({ rounds })])
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.insight.category).toBe('final_interview')
    expect(result.insight.progressed).toBe(4)
    expect(result.insight.reached).toBe(5)
    expect(result.insight.progressionRate).toBeCloseTo(0.8)
    expect(result.insight.supportingData).toBe('You progressed beyond this stage in 4 of 5 applications (80%).')
  })

  it('reports no strength when a well-evidenced stage never progresses', () => {
    const rounds = Array.from({ length: 3 }, () => round('assessment', 'eliminated'))
    expect(computeStrongestStage([application({ rounds })]).status).toBe('no_strength')
  })

  it('refuses to name a strongest stage from fewer than three observations', () => {
    const rounds = [round('final_interview', 'cleared'), round('final_interview', 'cleared')]
    expect(computeStrongestStage([application({ rounds })]).status).toBe('insufficient_data')
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

describe('computeRoundPerformance', () => {
  it("reports reached, progressed, eliminated and the progression rate per stage", () => {
    const rounds = [
      ...Array.from({ length: 4 }, () => round('resume', 'cleared')),
      ...Array.from({ length: 4 }, () => round('resume', 'eliminated')),
      ...Array.from({ length: 2 }, () => round('assessment', 'cleared')),
      ...Array.from({ length: 4 }, () => round('assessment', 'eliminated')),
      ...Array.from({ length: 2 }, () => round('final_interview', 'cleared')),
    ]
    const table = computeRoundPerformance([application({ rounds })])
    expect(table.find(r => r.category === 'resume')).toMatchObject({ reached: 8, progressed: 4, eliminated: 4, progressionRate: 0.5 })
    expect(table.find(r => r.category === 'assessment')).toMatchObject({ reached: 6, progressed: 2, eliminated: 4 })
    expect(table.find(r => r.category === 'final_interview')).toMatchObject({ reached: 2, progressed: 2, eliminated: 0, progressionRate: 1 })
  })
})

describe('computeConversionSteps', () => {
  it('computes the step-to-step conversion between consecutive funnel stages', () => {
    // 3 applications, 2 clear resume screening, 1 of those clears assessment.
    const apps = [
      application({ rounds: [round('resume', 'cleared'), round('assessment', 'cleared')] }),
      application({ rounds: [round('resume', 'cleared'), round('assessment', 'eliminated')] }),
      application({ rounds: [round('resume', 'eliminated')] }),
    ]
    const steps = computeConversionSteps(apps)
    expect(steps[0]).toMatchObject({ fromCount: 3, toCount: 2 })
    expect(steps[0].rate).toBeCloseTo(2 / 3)
    expect(steps[1]).toMatchObject({ fromCount: 2, toCount: 1 })
    expect(steps[1].rate).toBeCloseTo(0.5)
  })

  it('never divides by zero when a stage has nobody in it', () => {
    expect(() => computeConversionSteps([])).not.toThrow()
    expect(computeConversionSteps([])).toEqual([])
  })
})

describe('computeUpcomingActions', () => {
  it('lists the next round for active applications, soonest scheduled first', () => {
    const soon = new Date(Date.now() + 86_400_000).toISOString()
    const later = new Date(Date.now() + 5 * 86_400_000).toISOString()
    const apps = [
      application({ companyName: 'Later Co', status: 'active', rounds: [round('final_interview', 'upcoming', { scheduledDate: later, displayName: 'Interview' })] }),
      application({ companyName: 'Soon Co', status: 'active', rounds: [round('assessment', 'upcoming', { scheduledDate: soon, displayName: 'Assessment' })] }),
    ]
    const actions = computeUpcomingActions(apps)
    expect(actions.map(a => a.companyName)).toEqual(['Soon Co', 'Later Co'])
    expect(actions[0].detail).toBe('Next: Assessment')
  })

  it('asks for a status update when an active application has no unresolved round left', () => {
    const apps = [application({ companyName: 'Stalled Co', status: 'active', rounds: [round('final_interview', 'cleared')] })]
    const actions = computeUpcomingActions(apps)
    expect(actions[0]).toMatchObject({ kind: 'needs_update', detail: 'Update your application status' })
  })

  it('ignores applications that are no longer active', () => {
    const apps = [
      application({ status: 'rejected', rounds: [round('final_interview', 'upcoming')] }),
      application({ status: 'withdrawn', rounds: [round('final_interview', 'upcoming')] }),
      application({ status: 'offer', rounds: [round('final_interview', 'upcoming')] }),
    ]
    expect(computeUpcomingActions(apps)).toEqual([])
  })
})

describe('computePlacementPattern', () => {
  it('summarises the journey and leaves fields null when there is not enough data', () => {
    const apps = [application({ rounds: [round('assessment', 'eliminated')] })]
    const pattern = computePlacementPattern(apps)
    expect(pattern.applicationsTracked).toBe(1)
    expect(pattern.mostCommonExitPoint).toBeNull()
    expect(pattern.strongestStage).toBeNull()
    expect(pattern.interviewConversion).toBeNull()
  })

  it('withholds the interview conversion rate until enough interviews have been reached', () => {
    const twoInterviews = [
      application({ rounds: [round('final_interview', 'cleared')] }),
      application({ rounds: [round('final_interview', 'eliminated')] }),
    ]
    expect(computePlacementPattern(twoInterviews).interviewConversion).toBeNull()
  })

  it('reports the interview conversion rate with its supporting counts once it qualifies', () => {
    const apps = [
      application({ rounds: [round('final_interview', 'cleared')] }),
      application({ rounds: [round('final_interview', 'cleared')] }),
      application({ rounds: [round('final_interview', 'eliminated')] }),
      application({ rounds: [round('final_interview', 'eliminated')] }),
    ]
    expect(computePlacementPattern(apps).interviewConversion).toMatchObject({ rate: 0.5, reached: 4, cleared: 2 })
  })
})

describe('computeObservations', () => {
  it('says nothing at all with no applications', () => {
    expect(computeObservations([])).toEqual([])
  })

  it('flags a weak resume shortlist rate as a concern', () => {
    const apps = [
      application({ rounds: [round('resume', 'eliminated')] }),
      application({ rounds: [round('resume', 'eliminated')] }),
      application({ rounds: [round('resume', 'cleared')] }),
    ]
    const resume = computeObservations(apps).find(o => o.id === 'resume-rate')
    expect(resume?.tone).toBe('concern')
    expect(resume?.text).toContain('33%')
  })

  it('describes a stage the student reliably clears as a strength', () => {
    const apps = Array.from({ length: 4 }, () => application({ rounds: [round('group_discussion', 'cleared', { displayName: 'Group Discussion' })] }))
    const strong = computeObservations(apps).find(o => o.id === 'strong-group_discussion')
    expect(strong?.tone).toBe('positive')
  })

  it('only calls out an industry concentration when one genuinely dominates', () => {
    const even = [
      application({ industry: 'Consulting' }), application({ industry: 'Consulting' }),
      application({ industry: 'Technology' }), application({ industry: 'Technology' }),
      application({ industry: 'Finance' }), application({ industry: 'Retail' }),
    ]
    expect(computeObservations(even).find(o => o.id === 'industry-concentration')).toBeUndefined()

    const concentrated = Array.from({ length: 4 }, () => application({ industry: 'Consulting' }))
    expect(computeObservations(concentrated).find(o => o.id === 'industry-concentration')).toBeDefined()
  })
})

describe('computeGroupPatterns', () => {
  it('requires at least 2 groups with 3+ applications each before comparing industries', () => {
    const consulting = Array.from({ length: 3 }, () => application({ industry: 'Consulting', rounds: [round('final_interview', 'cleared'), round('final_interview', 'cleared')] }))
    const tech = Array.from({ length: 3 }, () => application({ industry: 'Technology', rounds: [round('final_interview', 'eliminated')] }))
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
    expect(hasEnoughDataForInsights([application({ rounds: [round('assessment', 'cleared'), round('final_interview', 'eliminated')] })])).toBe(true)
  })
})

describe('evidence threshold is applied before ranking, not after', () => {
  // Regression: a rarely-reached stage with a perfect rate used to win the
  // ranking and then fail the >=3 check, hiding the genuinely strongest
  // (or weakest) well-evidenced stage entirely.
  it('does not let a one-off perfect stage mask a well-evidenced strength', () => {
    const apps = [
      ...Array.from({ length: 4 }, () => application({ rounds: [round('resume', 'cleared')] })),
      application({ rounds: [round('final_interview', 'cleared')] }), // 1 observation, 100%
    ]
    const result = computeStrongestStage(apps)
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.insight.category).toBe('resume')
  })

  it('does not let a one-off total elimination mask a well-evidenced drop-off', () => {
    const apps = [
      ...Array.from({ length: 4 }, () => application({ rounds: [round('assessment', 'eliminated')] })),
      application({ rounds: [round('group_discussion', 'eliminated')] }), // 1 observation, 100%
    ]
    const result = computeBiggestBottleneck(apps)
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.insight.category).toBe('assessment')
  })
})

describe('computeObservations does not repeat itself', () => {
  it('states the resume-screening result once, not twice', () => {
    const apps = Array.from({ length: 4 }, () => application({ rounds: [round('resume', 'cleared')] }))
    const ids = computeObservations(apps).map(o => o.id)
    expect(ids).toContain('resume-rate')
    expect(ids).not.toContain('strong-resume')
  })
})

describe('the same stage is never both the biggest drop-off and the strongest stage', () => {
  // The reported bug: with only one stage above the evidence threshold, it
  // topped both rankings at once, so the student was told the same stage
  // was their greatest weakness and their greatest strength.
  it('reports only a strength when the single qualifying stage is mostly cleared', () => {
    const apps = [
      application({ rounds: [round('resume', 'cleared'), round('assessment', 'cleared')] }),
      application({ rounds: [round('resume', 'cleared'), round('assessment', 'eliminated')] }),
      application({ rounds: [round('resume', 'eliminated')] }),
    ]
    const { bottleneck, strength } = computeStageInsights(apps)
    expect(strength.status).toBe('ok')
    if (strength.status !== 'ok') return
    expect(strength.insight.category).toBe('resume')
    expect(bottleneck.status).toBe('insufficient_data')
  })

  it('reports only a drop-off when the single qualifying stage mostly eliminates', () => {
    const apps = [
      application({ rounds: [round('assessment', 'eliminated')] }),
      application({ rounds: [round('assessment', 'eliminated')] }),
      application({ rounds: [round('assessment', 'cleared')] }),
    ]
    const { bottleneck, strength } = computeStageInsights(apps)
    expect(bottleneck.status).toBe('ok')
    if (bottleneck.status !== 'ok') return
    expect(bottleneck.insight.category).toBe('assessment')
    expect(strength.status).toBe('insufficient_data')
  })

  it('claims neither when the single qualifying stage is an exact coin flip', () => {
    const apps = [
      application({ rounds: [round('assessment', 'cleared')] }),
      application({ rounds: [round('assessment', 'cleared')] }),
      application({ rounds: [round('assessment', 'eliminated')] }),
      application({ rounds: [round('assessment', 'eliminated')] }),
    ]
    const { bottleneck, strength } = computeStageInsights(apps)
    expect(bottleneck.status).toBe('insufficient_data')
    expect(strength.status).toBe('insufficient_data')
  })

  it('holds across many shapes of data: the two never name the same stage', () => {
    const outcomes = ['cleared', 'eliminated'] as const
    const categories = ['resume', 'assessment', 'final_interview'] as const
    // Exhaustively walk a spread of journeys rather than trusting one fixture.
    for (let mask = 0; mask < 1 << 6; mask++) {
      const apps = categories.flatMap((cat, ci) =>
        Array.from({ length: 3 }, (_, i) =>
          application({ rounds: [round(cat, outcomes[(mask >> (ci * 2 + (i % 2))) & 1])] })),
      )
      const { bottleneck, strength } = computeStageInsights(apps)
      if (bottleneck.status === 'ok' && strength.status === 'ok') {
        expect(bottleneck.insight.category).not.toBe(strength.insight.category)
      }
    }
  })
})

describe('current focus never contradicts the strongest stage', () => {
  it('asks for more data when nothing qualifies', () => {
    const apps = [application({ rounds: [round('assessment', 'cleared')] })]
    expect(computePlacementPattern(apps).currentFocus).toBe(
      'Keep tracking and updating your applications. More data will help identify where you can improve.',
    )
  })

  it('hedges an emerging weakness rather than issuing a firm recommendation', () => {
    const apps = [
      application({ rounds: [round('assessment', 'eliminated')] }),
      application({ rounds: [round('assessment', 'eliminated')] }),
      application({ rounds: [round('assessment', 'cleared')] }),
    ]
    expect(computePlacementPattern(apps).currentFocus).toContain('may need attention')
  })

  it('names an emerging strength when there is no reliable weakness', () => {
    const apps = Array.from({ length: 3 }, () => application({ rounds: [round('resume', 'cleared')] }))
    const pattern = computePlacementPattern(apps)
    expect(pattern.currentFocus).toContain('emerging strength')
    expect(pattern.mostCommonExitPoint).toBeNull()
  })

  it('never tells the student to improve the stage it just called their strongest', () => {
    const apps = [
      application({ rounds: [round('resume', 'cleared'), round('assessment', 'eliminated')] }),
      application({ rounds: [round('resume', 'cleared'), round('assessment', 'eliminated')] }),
      application({ rounds: [round('resume', 'cleared'), round('assessment', 'cleared')] }),
    ]
    const pattern = computePlacementPattern(apps)
    if (pattern.strongestStage) {
      expect(pattern.currentFocus.toLowerCase()).not.toContain(`${pattern.strongestStage.label.toLowerCase()} may need attention`)
    }
  })
})

describe('round performance carries a confidence indicator', () => {
  it('marks a stage reached fewer than 3 times as limited data', () => {
    const apps = [application({ rounds: [round('final_interview', 'cleared'), round('final_interview', 'cleared')] })]
    const row = computeRoundPerformance(apps).find(r => r.category === 'final_interview')
    expect(row?.confidence.label).toBe('Limited Data')
    expect(row?.confidence.qualifies).toBe(false)
  })

  it('escalates from emerging to established as observations accumulate', () => {
    const emerging = [application({ rounds: Array.from({ length: 3 }, () => round('final_interview', 'cleared')) })]
    expect(computeRoundPerformance(emerging)[0].confidence.label).toBe('Emerging Pattern')
    const established = [application({ rounds: Array.from({ length: 5 }, () => round('final_interview', 'cleared')) })]
    expect(computeRoundPerformance(established)[0].confidence.label).toBe('Established Pattern')
  })
})
