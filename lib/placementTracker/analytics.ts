// Deterministic placement analytics — no LLM/AI call anywhere in this file.
// Every insight this module produces carries the chain the feature spec
// requires: Insight -> Supporting data -> Recommendation, so nothing shown
// to a student is a black box. Upcoming/pending rounds are never counted as
// failures, and every insight is gated on having enough data to say
// something real (see `confidenceFor` and each function's own threshold).

import { getApplicationsNeedingUpdate, getUpcomingRounds } from './journey'
import { currentRound } from './status'
import { FUNNEL_ORDER, ROUND_TYPES, exitReasonLabel, roundTypeLabel } from './constants'
import type { ExitReason, PlacementApplication, PlacementRound, RoundType } from './types'

// ============================================================
// Confidence — distinguishes a fluke from a real pattern.
// ============================================================

export type ConfidenceLevel = 'limited' | 'emerging' | 'established'

export interface Confidence {
  level: ConfidenceLevel
  label: string
  observationCount: number
  // False below MIN_OBSERVATIONS_FOR_PATTERN: the stage may still be shown
  // with its raw numbers, but it must not be classified as a strength or a
  // weakness, and nothing may be concluded from its percentage.
  qualifies: boolean
}

export function confidenceFor(observationCount: number): Confidence {
  if (observationCount >= 5) return { level: 'established', label: 'Established Pattern', observationCount, qualifies: true }
  if (observationCount >= 3) return { level: 'emerging', label: 'Emerging Pattern', observationCount, qualifies: true }
  return { level: 'limited', label: 'Limited Data', observationCount, qualifies: false }
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
  return {
    totalApplications: applications.length,
    activeApplications: applications.filter(a => a.status === 'active').length,
    // Same selector Upcoming Actions renders from, so the metric and the
    // list can't disagree. It previously required a future scheduled date,
    // which silently excluded undated rounds the list was already showing
    // and counted leftover rounds on closed applications.
    upcomingRounds: getUpcomingRounds(applications).length,
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
// Section C — Application Funnel
// ============================================================

// The minimum number of applications that must have reached a stage before
// this module will describe it as a pattern rather than a coincidence.
// Below it, callers get an `insufficientData` result and are expected to
// say "More data needed" instead of drawing a conclusion.
export const MIN_OBSERVATIONS_FOR_PATTERN = 3

// Companies name the same stage differently ("Aptitude Test" vs "Online
// Assessment"), so analytics groups by the standardised analyticsCategory.
// The *label* still prefers the student's own wording: when every round in
// a category shares one display name, that name is used verbatim, and only
// a genuine mix falls back to the generic category label. That keeps the
// funnel recognisable without inventing equivalences the data doesn't
// support.
function bestLabelFor(category: RoundType, rounds: PlacementRound[]): string {
  const names = new Set(
    rounds.filter(r => r.analyticsCategory === category).map(r => r.displayName.trim()).filter(Boolean),
  )
  if (names.size === 1) return Array.from(names)[0]
  return roundTypeLabel(category)
}

function reachedStage(app: PlacementApplication, category: RoundType): boolean {
  return app.rounds.some(r => r.analyticsCategory === category && r.outcome !== 'upcoming')
}

function clearedStage(app: PlacementApplication, category: RoundType): boolean {
  return app.rounds.some(r => r.analyticsCategory === category && r.outcome === 'cleared')
}

// "Reached an interview" spans every interview-shaped stage now that the
// single coarse 'interview' bucket has been split — a student who got to a
// case round and a student who got to an HR round have both interviewed.
const INTERVIEW_TYPES: RoundType[] = ['case_interview', 'hr_fit', 'final_interview']

function reachedInterview(app: PlacementApplication): boolean {
  return INTERVIEW_TYPES.some(t => reachedStage(app, t))
}

function clearedInterview(app: PlacementApplication): boolean {
  return INTERVIEW_TYPES.some(t => clearedStage(app, t))
}

export interface FunnelStage {
  key: string // 'applied' | RoundType | 'offer'
  label: string
  count: number // applications that got past this stage (== progressed)
  reached: number // applications that got to this stage at all
  progressed: number
  eliminated: number
  conversionRate: number // progressed / reached, 0..1
}

// Applications, not rounds: "8 of my 12 applications cleared resume
// screening" is the question a student is actually asking. Stages appear in
// the canonical order of ANALYTICS_CATEGORIES and only when some
// application has actually reached them, so a student whose companies skip
// group exercises never sees an empty group-exercise row.
export function computeApplicationFunnel(applications: PlacementApplication[]): FunnelStage[] {
  if (applications.length === 0) return []
  const allRounds = applications.flatMap(a => a.rounds)

  const stages: FunnelStage[] = [
    {
      key: 'applied', label: 'Applied',
      count: applications.length, reached: applications.length, progressed: applications.length,
      eliminated: 0, conversionRate: 1,
    },
  ]

  // FUNNEL_ORDER, not ROUND_TYPES: a funnel is a sequence, and 'other' has
  // no defensible position in one. Those rounds still count in round
  // performance, they just don't get a slot implying a fixed stage.
  for (const type of FUNNEL_ORDER) {
    const reached = applications.filter(a => reachedStage(a, type)).length
    if (reached === 0) continue
    const progressed = applications.filter(a => clearedStage(a, type)).length
    stages.push({
      key: type,
      label: bestLabelFor(type, allRounds),
      count: progressed,
      reached,
      progressed,
      eliminated: applications.filter(a => a.rounds.some(r => r.analyticsCategory === type && r.outcome === 'eliminated')).length,
      conversionRate: reached > 0 ? progressed / reached : 0,
    })
  }

  // Offers close the funnel. They come from the application's own status
  // now that "Final Result" is no longer a round, so there is nothing left
  // for this row to duplicate.
  const offers = applications.filter(a => a.status === 'offer').length
  if (offers > 0) {
    stages.push({
      key: 'offer', label: 'Offers',
      count: offers, reached: offers, progressed: offers, eliminated: 0, conversionRate: 1,
    })
  }

  return stages
}

// ============================================================
// Shared per-category stats — backs bottleneck, strengths, and the
// Insights round-performance table.
// ============================================================

export interface CategoryStats {
  category: RoundType
  label: string
  reached: number
  progressed: number
  eliminated: number
  eliminationRate: number
  progressionRate: number
}

function categoryStats(applications: PlacementApplication[]): CategoryStats[] {
  const allRounds = applications.flatMap(a => a.rounds)
  return ROUND_TYPES
    .map(c => {
      const inCategory = allRounds.filter(r => r.analyticsCategory === c.value)
      const reached = inCategory.filter(r => r.outcome !== 'upcoming').length
      const eliminated = inCategory.filter(r => r.outcome === 'eliminated').length
      return {
        category: c.value,
        label: bestLabelFor(c.value, allRounds),
        reached,
        progressed: reached - eliminated,
        eliminated,
        eliminationRate: reached > 0 ? eliminated / reached : 0,
        progressionRate: reached > 0 ? (reached - eliminated) / reached : 0,
      }
    })
    .filter(s => s.reached > 0)
}

const RECOMMENDATIONS: Record<RoundType, string> = {
  resume: 'Consider getting your resume reviewed and tailored per role.',
  assessment: 'Consider prioritising aptitude and timed assessment preparation.',
  group_discussion: 'Consider practising group discussions and case-based teamwork exercises.',
  video: 'Consider rehearsing recorded answers and tightening your delivery to time.',
  case_interview: 'Consider drilling case structuring and quantitative case practice.',
  hr_fit: 'Consider preparing your story, motivation and fit answers more concretely.',
  final_interview: 'Consider mock interviews focused on your weaker interview formats.',
  other: 'Consider reviewing your preparation for this stage.',
}

// The concrete "what do I actually do about this" list the drop-off card
// shows under its recommendation. Fixed per stage rather than generated,
// so nothing here can drift into inventing advice the data doesn't support.
const SUGGESTED_FOCUS: Record<RoundType, string[]> = {
  resume: ['Resume review and tailoring', 'Highlighting measurable impact', 'Role-specific keywords'],
  assessment: ['Aptitude preparation', 'Timed problem solving', 'Mock assessments'],
  group_discussion: ['Structured group discussion practice', 'Making your point concisely', "Building on others' ideas"],
  video: ['Recording and reviewing practice answers', 'Answering within the time limit', 'Camera presence and clarity'],
  case_interview: ['Case structuring frameworks', 'Case math drills', 'Live case practice with a partner'],
  hr_fit: ['Your "why this firm" answer', 'Competency stories (STAR)', 'Questions to ask the interviewer'],
  final_interview: ['Mock interviews', 'Answer structuring', 'Company and role research'],
  other: ['Reviewing your preparation for this stage'],
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

// ============================================================
// Sections D & E — Biggest Drop-off and Strongest Stage
//
// These two are computed together, not independently, because they are the
// same ranking read from opposite ends: progressionRate is exactly
// 1 - eliminationRate, so whichever stage is worst is also, mechanically,
// the least good. When only one stage clears the evidence threshold it
// therefore tops BOTH rankings, and the student gets told the same stage is
// their biggest weakness and their greatest strength. Reconciling here is
// what makes that contradiction unrepresentable rather than merely unlikely.
// ============================================================

// The midpoint a lone qualifying stage is judged against. Above it the
// student clears the stage more often than not, so calling it a strength
// is defensible; below it, the eliminations dominate and it is a weakness.
const MEANINGFUL_PROGRESSION_RATE = 0.5

export const DROPOFF_EMPTY_MESSAGE =
  'Track and update more applications to identify where you most frequently exit the recruitment process.'
export const STRENGTH_EMPTY_MESSAGE =
  'Track more application outcomes to identify your strongest stage.'

export interface BottleneckInsight {
  category: RoundType
  label: string
  eliminated: number
  reached: number
  eliminationRate: number
  confidence: Confidence
  supportingData: string
  recommendation: string
  suggestedFocus: string[]
}

export interface StrengthInsight {
  category: RoundType
  label: string
  progressed: number
  reached: number
  progressionRate: number
  confidence: Confidence
  supportingData: string
}

export type BottleneckResult =
  | { status: 'ok'; insight: BottleneckInsight }
  | { status: 'insufficient_data' }
  | { status: 'no_dropoff' }

export type StrengthResult =
  | { status: 'ok'; insight: StrengthInsight }
  | { status: 'insufficient_data' }
  | { status: 'no_strength' }

export interface StageInsights {
  bottleneck: BottleneckResult
  strength: StrengthResult
}

function toBottleneckInsight(st: CategoryStats): BottleneckInsight {
  return {
    category: st.category,
    label: st.label,
    eliminated: st.eliminated,
    reached: st.reached,
    eliminationRate: st.eliminationRate,
    confidence: confidenceFor(st.reached),
    supportingData: `You were eliminated in ${st.eliminated} of the ${plural(st.reached, 'application')} that reached this stage (${Math.round(st.eliminationRate * 100)}%).`,
    recommendation: RECOMMENDATIONS[st.category],
    suggestedFocus: SUGGESTED_FOCUS[st.category],
  }
}

function toStrengthInsight(st: CategoryStats): StrengthInsight {
  return {
    category: st.category,
    label: st.label,
    progressed: st.progressed,
    reached: st.reached,
    progressionRate: st.progressionRate,
    confidence: confidenceFor(st.reached),
    supportingData: `You progressed beyond this stage in ${st.progressed} of ${st.reached} applications (${Math.round(st.progressionRate * 100)}%).`,
  }
}

export function computeStageInsights(applications: PlacementApplication[]): StageInsights {
  const stats = categoryStats(applications)

  // Only stages with enough evidence may be classified at all. Ranking has
  // to happen *after* this filter, never before: a single elimination at
  // some rarely-reached stage would otherwise top the table on a 100%
  // elimination rate and then fail the threshold, hiding a real,
  // well-evidenced drop-off further down.
  const qualifying = stats.filter(st => st.reached >= MIN_OBSERVATIONS_FOR_PATTERN)

  if (qualifying.length === 0) {
    return { bottleneck: { status: 'insufficient_data' }, strength: { status: 'insufficient_data' } }
  }

  const worst = [...qualifying]
    .filter(st => st.eliminated > 0)
    .sort((a, b) => b.eliminationRate - a.eliminationRate || b.eliminated - a.eliminated)[0]
  const best = [...qualifying]
    .filter(st => st.progressionRate > 0)
    .sort((a, b) => b.progressionRate - a.progressionRate || b.progressed - a.progressed)[0]

  const bottleneck: BottleneckResult = worst
    ? { status: 'ok', insight: toBottleneckInsight(worst) }
    : { status: 'no_dropoff' }
  const strength: StrengthResult = best
    ? { status: 'ok', insight: toStrengthInsight(best) }
    : { status: 'no_strength' }

  // The contradiction check. Reaching here means one stage came top of both
  // rankings — only possible when the comparative data is too thin to
  // separate them.
  if (worst && best && worst.category === best.category) {
    if (best.progressionRate > MEANINGFUL_PROGRESSION_RATE) {
      // Clearing it more often than not: report the strength, and admit we
      // can't yet say where the student actually drops off.
      return { bottleneck: { status: 'insufficient_data' }, strength }
    }
    if (worst.eliminationRate > MEANINGFUL_PROGRESSION_RATE) {
      // The mirror case, and the reason this isn't just "prefer the
      // strength": a stage eliminating the student in 5 of 7 applications
      // is a real, well-evidenced finding, and suppressing it merely
      // because it also happens to be the only stage anyone has cleared
      // would throw away the most useful thing the tracker knows.
      return { bottleneck, strength: { status: 'insufficient_data' } }
    }
    // An exact coin flip: neither convincingly good nor convincingly bad,
    // so claiming either would be overreading the data.
    return { bottleneck: { status: 'insufficient_data' }, strength: { status: 'insufficient_data' } }
  }

  return { bottleneck, strength }
}

export function computeBiggestBottleneck(applications: PlacementApplication[]): BottleneckResult {
  return computeStageInsights(applications).bottleneck
}

export function computeStrongestStage(applications: PlacementApplication[]): StrengthResult {
  return computeStageInsights(applications).strength
}

// ============================================================
// Section F — Progress Over Time
// ============================================================

export interface TrendInsight {
  category: RoundType
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
  for (const c of ROUND_TYPES) {
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
  category: RoundType
  label: string
  reached: number
  progressed: number
  eliminated: number
  progressionRate: number
  // Drives both the badge and whether the row may be coloured as a
  // strength/weakness at all — a 100% rate off one application must not
  // read as green (spec: never imply strength or weakness from 1-2
  // applications).
  confidence: Confidence
}

export function computeRoundPerformance(applications: PlacementApplication[]): RoundPerformanceRow[] {
  return categoryStats(applications).map(({ category, label, reached, progressed, eliminated, progressionRate }) => ({
    category, label, reached, progressed, eliminated, progressionRate,
    confidence: confidenceFor(reached),
  }))
}

// ============================================================
// Insights tab — Section B: Application Conversion
// ============================================================

export interface ConversionStep {
  fromLabel: string
  toLabel: string
  fromCount: number
  toCount: number
  rate: number // 0..1
}

// The step-to-step conversion between consecutive funnel stages —
// "Applied -> Resume Shortlist: 66.7%". Derived from the same funnel the
// dashboard renders, so the two can never disagree.
export function computeConversionSteps(applications: PlacementApplication[]): ConversionStep[] {
  const funnel = computeApplicationFunnel(applications)
  const steps: ConversionStep[] = []
  for (let i = 0; i < funnel.length - 1; i++) {
    const from = funnel[i]
    const to = funnel[i + 1]
    if (from.count === 0) continue
    steps.push({
      fromLabel: from.label,
      toLabel: to.label,
      fromCount: from.count,
      toCount: to.count,
      rate: to.count / from.count,
    })
  }
  return steps
}

// ============================================================
// Insights tab — "Your Placement Pattern" at-a-glance summary
// ============================================================

export interface PlacementPattern {
  applicationsTracked: number
  // Each of these is independently nullable, and null always means "not
  // enough data to say" — never zero, never a guess. The UI renders null as
  // "More data needed".
  mostCommonExitPoint: { label: string; confidence: Confidence } | null
  strongestStage: { label: string; confidence: Confidence } | null
  interviewConversion: { rate: number; reached: number; cleared: number } | null
  currentFocus: string
}

// Priority ladder from the spec: an established weakness earns a specific
// recommendation, an emerging one earns a hedged "may need attention", and
// with no reliable weakness we fall back to naming an emerging strength or
// simply asking for more data. Because the bottleneck and strength have
// already been reconciled, this can never recommend improving the very
// stage shown as the student's strongest.
function currentFocusFor(bottleneck: BottleneckResult, strength: StrengthResult): string {
  if (bottleneck.status === 'ok') {
    const { label, confidence, recommendation } = bottleneck.insight
    if (confidence.level === 'established') return recommendation
    return `Early data suggests that ${label} may need attention. Continue tracking more outcomes to confirm this pattern.`
  }
  if (strength.status === 'ok') {
    return `Continue tracking your applications to identify reliable patterns. Your current data shows an emerging strength in ${strength.insight.label.toLowerCase()}.`
  }
  return 'Keep tracking and updating your applications. More data will help identify where you can improve.'
}

export function computePlacementPattern(applications: PlacementApplication[]): PlacementPattern {
  const { bottleneck, strength } = computeStageInsights(applications)

  const interviewsReached = applications.filter(reachedInterview).length
  const interviewsCleared = applications.filter(clearedInterview).length

  return {
    applicationsTracked: applications.length,
    mostCommonExitPoint: bottleneck.status === 'ok'
      ? { label: bottleneck.insight.label, confidence: bottleneck.insight.confidence }
      : null,
    strongestStage: strength.status === 'ok'
      ? { label: strength.insight.label, confidence: strength.insight.confidence }
      : null,
    // Gated on the same threshold as everything else: a conversion rate off
    // one or two interviews is noise, not a statistic.
    interviewConversion: interviewsReached >= MIN_OBSERVATIONS_FOR_PATTERN
      ? { rate: interviewsCleared / interviewsReached, reached: interviewsReached, cleared: interviewsCleared }
      : null,
    currentFocus: currentFocusFor(bottleneck, strength),
  }
}

// ============================================================
// Insights tab — Section C: plain-language observations
// ============================================================

export interface Observation {
  id: string
  text: string
  tone: 'positive' | 'concern' | 'neutral'
  confidence: Confidence
}

// Every observation states the numbers it was derived from and hedges to
// match its own sample size, so a student can always check the claim
// against their own data rather than taking it on faith. Nothing here is
// inferred beyond the counts.
function confidenceSentence(confidence: Confidence): string {
  if (confidence.level === 'established') return 'This is an established pattern across your applications.'
  if (confidence.level === 'emerging') return 'This is an emerging pattern based on your current data.'
  return 'This is based on limited data so far.'
}

export function computeObservations(applications: PlacementApplication[]): Observation[] {
  const observations: Observation[] = []
  if (applications.length === 0) return observations

  const stats = categoryStats(applications)
  const total = applications.length

  // Resume shortlist rate — the single most commonly asked-about number.
  const resume = stats.find(st => st.category === 'resume')
  if (resume && resume.reached >= 2) {
    const confidence = confidenceFor(resume.reached)
    const rate = Math.round(resume.progressionRate * 100)
    // Below the threshold the rate is reported but not judged: no "holding
    // up well" or "may be an area to improve" from two applications.
    const tone = !confidence.qualifies ? 'neutral' : rate < 50 ? 'concern' : 'positive'
    // Kept as a trailing clause rather than its own sentence so the text
    // doesn't run "This is ... . This is ..." into the confidence line.
    const verdict = !confidence.qualifies
      ? ''
      : rate < 50
        ? ', which may be an area to improve'
        : ', which is holding up well'
    observations.push({
      id: 'resume-rate',
      text: `Your resume shortlist rate is currently ${rate}% (${resume.progressed} of ${resume.reached} applications)${verdict}. ${confidenceSentence(confidence)}`,
      tone,
      confidence,
    })
  }

  // Stages the student reliably gets through. Resume screening is skipped
  // when the rate observation above already covered it — two sentences
  // making the same point about the same stage reads as padding.
  const resumeAlreadyCovered = observations.some(o => o.id === 'resume-rate')
  for (const st of stats) {
    if (st.category === 'resume' && resumeAlreadyCovered) continue
    if (st.reached < MIN_OBSERVATIONS_FOR_PATTERN || st.progressionRate < 0.7) continue
    const confidence = confidenceFor(st.reached)
    observations.push({
      id: `strong-${st.category}`,
      text: `You progressed through ${st.progressed} of ${st.reached} ${st.label.toLowerCase()} rounds (${Math.round(st.progressionRate * 100)}%). ${confidenceSentence(confidence)}`,
      tone: 'positive',
      confidence,
    })
  }

  // How far applications are actually getting — a plain count, no verdict.
  const interviewsReached = applications.filter(reachedInterview).length
  if (interviewsReached > 0) {
    observations.push({
      id: 'interview-reach',
      text: `You have reached interviews in ${interviewsReached} of ${total} applications.`,
      tone: 'neutral',
      confidence: confidenceFor(total),
    })
  }

  // Where the applications are concentrated — stated as the raw split
  // rather than as "most of your applications", and only when one group
  // genuinely dominates rather than being an even spread.
  const industries = applications.map(a => a.industry).filter((i): i is string => !!i)
  if (industries.length >= MIN_OBSERVATIONS_FOR_PATTERN) {
    const counts = new Map<string, number>()
    for (const i of industries) counts.set(i, (counts.get(i) ?? 0) + 1)
    const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]
    if (top[1] / industries.length > 0.5) {
      observations.push({
        id: 'industry-concentration',
        text: `${top[1]} of your ${industries.length} tracked applications are in ${top[0].toLowerCase()}-related roles.`,
        tone: 'neutral',
        confidence: confidenceFor(industries.length),
      })
    }
  }

  // Improvement over time, folded in here rather than given its own card —
  // it's an observation about the student's data like any other.
  for (const trend of computeTrends(applications)) {
    observations.push({
      id: `trend-${trend.category}`,
      text: trend.supportingData,
      tone: 'positive',
      confidence: trend.confidence,
    })
  }

  // Role/industry comparison, folded in here rather than given its own card
  // (see computeGroupPatterns) — it's another observation, not another chart.
  for (const pattern of computeGroupPatterns(applications)) {
    observations.push({
      id: `group-${pattern.dimension}`,
      text: pattern.supportingData,
      tone: 'neutral',
      confidence: pattern.confidence,
    })
  }

  return observations
}

// ============================================================
// Dashboard — Upcoming Actions
//
// Rendered straight from getUpcomingRounds, the same selector the Upcoming
// Rounds metric counts, so the number and the list can never disagree.
// ============================================================

export interface UpcomingAction {
  applicationId: string
  companyName: string
  // 'next_round' — there's a known next stage to prepare for.
  // 'needs_update' — the journey has run out of rounds, so the useful
  // prompt is to record what happened rather than to prepare.
  kind: 'next_round' | 'needs_update'
  detail: string
  scheduledDate: string | null
}

export function computeUpcomingActions(applications: PlacementApplication[]): UpcomingAction[] {
  const actions: UpcomingAction[] = getUpcomingRounds(applications).map(({ application, round }) => ({
    applicationId: application.id,
    companyName: application.companyName,
    kind: 'next_round' as const,
    detail: `Next: ${round.displayName}`,
    scheduledDate: round.scheduledDate,
  }))

  for (const app of getApplicationsNeedingUpdate(applications)) {
    actions.push({
      applicationId: app.id,
      companyName: app.companyName,
      kind: 'needs_update',
      detail: 'Update your application status',
      scheduledDate: null,
    })
  }

  return actions
}

// ============================================================
// Insights tab — Exit Reason Breakdown
//
// The payoff for asking "why?" at elimination: this is what turns "you keep
// getting rejected" into "you keep losing case rounds on structure".
// ============================================================

export interface ExitReasonCount {
  reason: ExitReason
  label: string
  count: number
}

export function computeExitReasonBreakdown(applications: PlacementApplication[]): ExitReasonCount[] {
  const counts = new Map<ExitReason, number>()
  for (const app of applications) {
    for (const round of app.rounds) {
      if (round.outcome !== 'eliminated' || !round.exitReason) continue
      counts.set(round.exitReason, (counts.get(round.exitReason) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([reason, count]) => ({ reason, label: exitReasonLabel(reason), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

// ============================================================
// Role / industry patterns
//
// No longer rendered as its own card: it answers the same "where is this
// going well" question the observation list already answers, so it feeds
// into computeObservations instead of adding another chart of its own.
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
