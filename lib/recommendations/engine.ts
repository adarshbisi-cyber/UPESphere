// The recommendation engine. Deterministic and auditable by design (§18):
// every decision below is a rule over counts the student can see for
// themselves in Insights. No LLM decides whether someone is weak at group
// discussions — the elimination rate does, and the evidence rides along on
// the recommendation so the call can be checked.

import { computeRoundPerformance } from '@/lib/placementTracker/analytics'
import { roundTypeLabel } from '@/lib/placementTracker/constants'
import { practiceTypeLabel } from '@/lib/practiceTogether/constants'
import type { PlacementApplication, RoundType } from '@/lib/placementTracker/types'
import type { PracticeSession, PracticeType } from '@/lib/practiceTogether/types'
import { practiceTypeForRound } from './mapping'
import {
  signatureFor,
  type Recommendation,
  type RecommendationConfidence,
  type RecommendationPriority,
} from './types'

// One completed practice session of the right kind is enough to say the
// student acted on the advice. Requiring more would keep nagging someone
// who is already doing the thing; requiring none would let a click count as
// progress, which §16 rules out explicitly.
export const SESSIONS_TO_SATISFY = 1

// Below this, a stage has produced no eliminations worth reacting to.
const MIN_ELIMINATIONS = 1

// A stage only counts as a weakness if the student fails it more than about
// a third of the time. Confidence measures how much evidence there is, not
// how bad the stage is — without this, someone who reached group
// discussions nine times and was cut once would get a HIGH-priority "practise
// group discussions", because the evidence was plentiful. It was: evidence
// that they are good at it.
const WEAKNESS_ELIMINATION_RATE = 1 / 3

// Confidence comes from how many applications actually reached the stage,
// matching the Placement Tracker's own tiers so the two features never
// disagree about how strong the same evidence is.
function confidenceFor(reached: number): RecommendationConfidence {
  if (reached >= 5) return 'ESTABLISHED'
  if (reached >= 3) return 'EMERGING'
  return 'LIMITED'
}

// Priority escalates with evidence, never ahead of it: an isolated exit is
// a nudge, a hardened pattern is a priority (§7).
function priorityFor(confidence: RecommendationConfidence, eliminated: number): RecommendationPriority {
  if (confidence === 'ESTABLISHED') return 'HIGH'
  if (confidence === 'EMERGING' || eliminated >= 2) return 'MEDIUM'
  return 'LOW'
}

// Copy reflects the strength of the evidence (§6). The numbers are always
// present so the claim is checkable rather than asserted.
function describe(
  roundLabel: string,
  confidence: RecommendationConfidence,
  eliminated: number,
  reached: number,
): string {
  const stage = roundLabel.toLowerCase()
  if (confidence === 'ESTABLISHED') {
    return `${roundLabel} has been your most common exit point — you were eliminated there in ${eliminated} of the ${reached} applications that reached it.`
  }
  if (confidence === 'EMERGING') {
    return `You've exited during ${stage} in ${eliminated} of ${reached} recent applications. Practising with peers could help before your next opportunity.`
  }
  return `You recently exited during ${stage}. Practising with peers could help before your next opportunity.`
}

function countCompletedPractice(sessions: PracticeSession[], userId: string, practiceType: PracticeType): number {
  return sessions.filter(s =>
    s.status === 'completed'
    && s.practiceType === practiceType
    && s.participants.some(p => p.userId === userId)).length
}

export interface RecommendationInputs {
  userId: string
  applications: PlacementApplication[]
  /** Every practice session the app knows about; filtered to the user here. */
  practiceSessions: PracticeSession[]
  /** Signatures the user has dismissed — see signatureFor for why priority is part of it. */
  dismissedSignatures: string[]
}

/**
 * Derives the current set of recommendations. Pure: same inputs, same
 * output, no side effects and nothing written down — which is what makes
 * re-running it on every render safe (§5) and keeps it honest when the
 * underlying applications change (§19).
 */
export function computeRecommendations({
  userId,
  applications,
  practiceSessions,
  dismissedSignatures,
}: RecommendationInputs): Recommendation[] {
  const dismissed = new Set(dismissedSignatures)

  return computeRoundPerformance(applications)
    .filter(row => row.eliminated >= MIN_ELIMINATIONS)
    .flatMap<Recommendation>(row => {
      const practiceType = practiceTypeForRound(row.category)
      // An unmappable stage yields nothing rather than something irrelevant.
      if (!practiceType) return []

      const confidence = confidenceFor(row.reached)
      const eliminationRate = row.reached > 0 ? row.eliminated / row.reached : 0

      // Once there's enough data to judge, a stage the student mostly
      // clears is not something to recommend practising. With only a
      // handful of attempts we stay quiet about the rate and still offer a
      // gentle nudge, since one exit out of one says very little either way.
      if (confidence !== 'LIMITED' && eliminationRate < WEAKNESS_ELIMINATION_RATE) return []

      const priority = priorityFor(confidence, row.eliminated)
      const signature = signatureFor(practiceType, priority)
      const practiceSessionsCompleted = countCompletedPractice(practiceSessions, userId, practiceType)

      // Status precedence: acting on the advice outranks dismissing it, so
      // someone who dismissed the card and then practised anyway is shown
      // as having done it rather than as having ignored it.
      const status = practiceSessionsCompleted >= SESSIONS_TO_SATISFY
        ? 'COMPLETED'
        : dismissed.has(signature) ? 'DISMISSED' : 'ACTIVE'

      // The canonical stage name, not the student's own round wording.
      // computeRoundPerformance prefers their label — right for Insights,
      // wrong here: a round they typed as "R3" or "gd final" would produce
      // "Practice R3". The copy has to stand on its own.
      const roundLabel = roundTypeLabel(row.category)
      const practiceLabel = practiceTypeLabel(practiceType)

      return [{
        id: signature,
        userId,
        source: 'PLACEMENT_TRACKER',
        sourceId: row.category,
        recommendationType: 'PRACTICE',
        practiceType,
        roundType: row.category,
        roundLabel,
        title: `Practice ${practiceLabel}`,
        description: describe(roundLabel, confidence, row.eliminated, row.reached),
        priority,
        confidence,
        status,
        evidence: {
          eliminated: row.eliminated,
          reached: row.reached,
          eliminationRate,
          practiceSessionsCompleted,
        },
      }]
    })
    .sort((a, b) => rank(b.priority) - rank(a.priority)
      || b.evidence.eliminationRate - a.evidence.eliminationRate)
}

function rank(priority: RecommendationPriority): number {
  return priority === 'HIGH' ? 3 : priority === 'MEDIUM' ? 2 : 1
}

/** The one the dashboard should surface, or null when there's nothing worth saying (§8). */
export function topRecommendation(recommendations: Recommendation[]): Recommendation | null {
  return recommendations.find(r => r.status === 'ACTIVE') ?? null
}

/**
 * The recommendation for a single stage the student just recorded an
 * elimination at — the contextual prompt in §10. Returns null when the
 * stage can't be mapped, so recording an outcome on a custom round never
 * produces an irrelevant nudge.
 */
export function recommendationForRound(
  roundType: RoundType,
  recommendations: Recommendation[],
): Recommendation | null {
  if (!practiceTypeForRound(roundType)) return null
  return recommendations.find(r => r.roundType === roundType && r.status !== 'COMPLETED') ?? null
}

export { roundTypeLabel }
