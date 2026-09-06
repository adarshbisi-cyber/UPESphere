// Deterministic placement analytics — no LLM/AI call anywhere in this file.
// Every insight this module produces carries the chain the feature spec
// requires: Insight -> Supporting data -> Recommendation, so nothing shown
// to a student is a black box. Upcoming/pending rounds are never counted as
// failures, and every insight is gated on having enough data to say
// something real (see `confidenceFor` and each function's own threshold).

import { currentRound } from './status'
import { ANALYTICS_CATEGORIES } from './constants'
import type { AnalyticsCategory, PlacementApplication, PlacementRound } from './types'

// ============================================================
// Confidence — distinguishes a fluke from a real pattern.
// ============================================================

export type ConfidenceLevel = 'low' | 'moderate' | 'high'

export interface Confidence {
  level: ConfidenceLevel
  label: string
  observationCount: number
}

export function confidenceFor(observationCount: number): Confidence {
  if (observationCount >= 5) return { level: 'high', label: 'Consistent Pattern', observationCount }
  if (observationCount >= 3) return { level: 'moderate', label: 'Emerging Pattern', observationCount }
  return { level: 'low', label: 'Early Pattern', observationCount }
}

// A journey counts as "resolved" once at least one round has a real
// (non-upcoming, non-pending) outcome — that's the minimum needed for any
// insight to have something to say.
export function hasEnoughDataForInsights(applications: PlacementApplication[]): boolean {
  const resolvedRounds = applications.flatMap(a => a.rounds).filter(r => r.outcome === 'cleared' || r.outcome === 'eliminated')
  return resolvedRounds.length >= 2
}

// ============================================================
// Section A — Placement Overview
// ============================================================

export interface Overview {
  totalApplications: number
  activeApplications: number
  upcomingRounds: number
  offersReceived: number
}

export function computeOverview(applications: PlacementApplication[]): Overview {
  const now = new Date()
  return {
    totalApplications: applications.length,
    activeApplications: applications.filter(a => a.status === 'active').length,
    // "Applications with a future round date/time" — counts applications,
    // not individual rounds, per the feature spec's own definition.
    upcomingRounds: applications.filter(a =>
      a.rounds.some(r => (r.outcome === 'upcoming' || r.outcome === 'pending') && r.scheduledDate && new Date(r.scheduledDate) > now)
    ).length,
    offersReceived: applications.filter(a => a.status === 'offer').length,
  }
}

// ============================================================
// Section B — Active Applications
// ============================================================

export interface ActiveApplicationSummary {
  application: PlacementApplication
  currentStage: string | null
  nextRound: { displayName: string; scheduledDate: string | null } | null
}

export function computeActiveApplicationSummaries(applications: PlacementApplication[]): ActiveApplicationSummary[] {
  return applications
    .filter(a => a.status === 'active')
    .map(a => {
      const current = currentRound(a.rounds)
      return {
        application: a,
        currentStage: current?.displayName ?? null,
        nextRound: current ? { displayName: current.displayName, scheduledDate: current.scheduledDate } : null,
      }
    })
}

// ============================================================
// Section C — Placement Funnel
// ============================================================

export interface FunnelStage {
  category: AnalyticsCategory
  label: string
  count: number
}

// Counts rounds actually reached (outcome != 'upcoming') per standardised
// category, across every application — the visual funnel, not per-company.
export function computeFunnel(applications: PlacementApplication[]): FunnelStage[] {
  const allRounds = applications.flatMap(a => a.rounds)
  return ANALYTICS_CATEGORIES
    .map(c => ({ category: c.value, label: c.label, count: allRounds.filter(r => r.analyticsCategory === c.value && r.outcome !== 'upcoming').length }))
    .filter(stage => stage.count > 0)
}

// ============================================================
// Shared per-category stats — backs bottleneck, strengths, and the
// Insights round-performance table.
// ============================================================

interface CategoryStats {
  category: AnalyticsCategory
  label: string
  reached: number
  eliminated: number
  eliminationRate: number
  progressionRate: number
}

function categoryStats(applications: PlacementApplication[]): CategoryStats[] {
  const allRounds = applications.flatMap(a => a.rounds)
  return ANALYTICS_CATEGORIES
    .map(c => {
      const inCategory = allRounds.filter(r => r.analyticsCategory === c.value)
      const reached = inCategory.filter(r => r.outcome !== 'upcoming').length
      const eliminated = inCategory.filter(r => r.outcome === 'eliminated').length
      return {
        category: c.value,
        label: c.label,
        reached,
        eliminated,
        eliminationRate: reached > 0 ? eliminated / reached : 0,
        progressionRate: reached > 0 ? (reached - eliminated) / reached : 0,
      }
    })
    .filter(s => s.reached > 0)
}

const RECOMMENDATIONS: Record<AnalyticsCategory, string> = {
  resume_screening: 'Consider getting your resume reviewed and tailored per role.',
  assessment: 'Consider prioritising aptitude and timed assessment preparation.',
  group_exercise: 'Consider practising group discussions and case-based teamwork exercises.',
  interview: 'Consider mock interviews focused on your weaker interview formats.',
  final_outcome: 'Consider revisiting your overall interview and negotiation approach.',
  other: 'Consider reviewing your preparation for this stage.',
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

// ============================================================
// Section D — Biggest Bottleneck
// ============================================================

export interface BottleneckInsight {
  category: AnalyticsCategory
  label: string
  eliminated: number
  reached: number
  confidence: Confidence
  supportingData: string
  recommendation: string
}

export function computeBiggestBottleneck(applications: PlacementApplication[]): BottleneckInsight | null {
  const stats = categoryStats(applications)
  if (stats.length === 0) return null

  const worst = [...stats].sort((a, b) => b.eliminationRate - a.eliminationRate || b.eliminated - a.eliminated)[0]
  if (worst.eliminationRate <= 0) return null // nobody's being eliminated anywhere — no bottleneck to report

  return {
    category: worst.category,
    label: worst.label,
    eliminated: worst.eliminated,
    reached: worst.reached,
    confidence: confidenceFor(worst.reached),
    supportingData: `You were eliminated in ${worst.eliminated} of the ${plural(worst.reached, worst.label.toLowerCase() + ' round')} you reached.`,
    recommendation: RECOMMENDATIONS[worst.category],
  }
}

// ============================================================
// Section E — Strengths
// ============================================================

export interface StrengthInsight {
  category: AnalyticsCategory
  label: string
  progressed: number
  reached: number
  confidence: Confidence
  supportingData: string
}

export function computeStrongestStage(applications: PlacementApplication[]): StrengthInsight | null {
  const stats = categoryStats(applications)
  if (stats.length === 0) return null

  const best = [...stats].sort((a, b) => b.progressionRate - a.progressionRate || (b.reached - b.eliminated) - (a.reached - a.eliminated))[0]
  if (best.progressionRate <= 0) return null

  const progressed = best.reached - best.eliminated
  return {
    category: best.category,
    label: best.label,
    progressed,
    reached: best.reached,
    confidence: confidenceFor(best.reached),
    supportingData: `You progressed through ${progressed} of your last ${plural(best.reached, best.label.toLowerCase() + ' round')}.`,
  }
}

// ============================================================
// Section F — Progress Over Time
// ============================================================

export interface TrendInsight {
  category: AnalyticsCategory
  label: string
  earlierRate: number
  recentRate: number
  confidence: Confidence
  supportingData: string
}

// Splits applications chronologically in half and compares each category's
// success rate across the two halves — only reports a trend when both
// halves have enough data AND the rate genuinely improved (never claims
// improvement the data doesn't support).
export function computeTrends(applications: PlacementApplication[]): TrendInsight[] {
  const sorted = [...applications].sort((a, b) => a.applicationDate.localeCompare(b.applicationDate))
  const mid = Math.floor(sorted.length / 2)
  const earlierApps = sorted.slice(0, mid)
  const recentApps = sorted.slice(mid)

  const trends: TrendInsight[] = []
  for (const c of ANALYTICS_CATEGORIES) {
    const earlierRounds = earlierApps.flatMap(a => a.rounds).filter(r => r.analyticsCategory === c.value && r.outcome !== 'upcoming')
    const recentRounds = recentApps.flatMap(a => a.rounds).filter(r => r.analyticsCategory === c.value && r.outcome !== 'upcoming')
    if (earlierRounds.length < 2 || recentRounds.length < 2) continue

    const rateOf = (rounds: PlacementRound[]) => (rounds.length - rounds.filter(r => r.outcome === 'eliminated').length) / rounds.length
    const earlierRate = rateOf(earlierRounds)
    const recentRate = rateOf(recentRounds)
    if (recentRate <= earlierRate) continue

    trends.push({
      category: c.value,
      label: c.label,
      earlierRate,
      recentRate,
      confidence: confidenceFor(earlierRounds.length + recentRounds.length),
      supportingData: `Your ${c.label.toLowerCase()} success rate improved from ${Math.round(earlierRate * 100)}% to ${Math.round(recentRate * 100)}% across your recent applications.`,
    })
  }
  return trends
}

// ============================================================
// Insights tab — Section A: Round Performance table
// ============================================================

export interface RoundPerformanceRow {
  category: AnalyticsCategory
  label: string
  reached: number
  eliminated: number
  progressionRate: number
}

export function computeRoundPerformance(applications: PlacementApplication[]): RoundPerformanceRow[] {
  return categoryStats(applications).map(({ category, label, reached, eliminated, progressionRate }) => ({
    category, label, reached, eliminated, progressionRate,
  }))
}

// ============================================================
// Insights tab — Section B: Application Conversion
// ============================================================

// Starts at Resume Screening, not Application — the funnel tracks selection
// stages a candidate can be eliminated at, and applying isn't one of them.
const CONVERSION_STAGES: AnalyticsCategory[] = ['resume_screening', 'assessment', 'interview', 'final_outcome']

export interface ConversionStage {
  category: AnalyticsCategory
  label: string
  count: number
}

export function computeConversionFunnel(applications: PlacementApplication[]): ConversionStage[] {
  const allRounds = applications.flatMap(a => a.rounds)
  return CONVERSION_STAGES
    .map(cat => ({
      category: cat,
      label: ANALYTICS_CATEGORIES.find(c => c.value === cat)!.label,
      count: allRounds.filter(r => r.analyticsCategory === cat && r.outcome !== 'upcoming').length,
    }))
    .filter(s => s.count > 0)
}

// ============================================================
// Insights tab — Section D: Role / Industry patterns
// ============================================================

export interface GroupPatternInsight {
  dimension: 'industry' | 'opportunityType'
  better: string
  worse: string
  confidence: Confidence
  supportingData: string
}

// "Progress depth" for one application = how many of its own rounds
// actually got a real outcome — a rough proxy for how far the student got.
function progressDepth(application: PlacementApplication): number {
  return application.rounds.filter(r => r.outcome !== 'upcoming').length
}

function averageDepthByGroup(applications: PlacementApplication[], keyFn: (a: PlacementApplication) => string | null): Map<string, number[]> {
  const map = new Map<string, number[]>()
  for (const app of applications) {
    const key = keyFn(app)
    if (!key) continue
    const depth = progressDepth(app)
    if (depth === 0) continue
    map.set(key, [...(map.get(key) ?? []), depth])
  }
  return map
}

// Requires at least 2 comparable groups, each with at least 3 applications
// (the "moderate" confidence threshold) — otherwise a role/industry
// comparison is just noise from tiny samples.
function computeGroupPattern(
  applications: PlacementApplication[],
  dimension: GroupPatternInsight['dimension'],
  keyFn: (a: PlacementApplication) => string | null,
): GroupPatternInsight | null {
  const groups = averageDepthByGroup(applications, keyFn)
  const eligible = Array.from(groups.entries()).filter(([, depths]) => depths.length >= 3)
  if (eligible.length < 2) return null

  const averaged = eligible
    .map(([name, depths]) => ({ name, avg: depths.reduce((a, b) => a + b, 0) / depths.length, count: depths.length }))
    .sort((a, b) => b.avg - a.avg)
  const better = averaged[0]
  const worse = averaged[averaged.length - 1]
  if (better.avg <= worse.avg) return null

  return {
    dimension,
    better: better.name,
    worse: worse.name,
    confidence: confidenceFor(Math.min(better.count, worse.count)),
    supportingData: `You have progressed further on average in ${better.name} opportunities than ${worse.name} opportunities.`,
  }
}

export function computeGroupPatterns(applications: PlacementApplication[]): GroupPatternInsight[] {
  const patterns = [
    computeGroupPattern(applications, 'industry', a => a.industry),
    computeGroupPattern(applications, 'opportunityType', a => a.opportunityType),
  ]
  return patterns.filter((p): p is GroupPatternInsight => p !== null)
}
