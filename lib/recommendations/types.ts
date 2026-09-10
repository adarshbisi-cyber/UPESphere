// Shared types for the recommendation engine.
//
// Recommendations are DERIVED from current data, never stored as rows. That
// is what makes "don't create the same recommendation on every render" (§5)
// and "remove stale recommendations when the data changes" (§19) structural
// rather than bookkeeping: a pure derivation cannot duplicate itself, and
// deleting the applications behind a pattern removes the recommendation
// automatically. The only thing that needs persisting is the user's own
// decision to dismiss one.

import type { PracticeType } from '@/lib/practiceTogether/types'
import type { RoundType } from '@/lib/placementTracker/types'

/** Where the evidence came from. New sources plug in without touching consumers. */
export type RecommendationSource = 'PLACEMENT_TRACKER'

/** What kind of action is being recommended. PRACTICE is the only one today. */
export type RecommendationType = 'PRACTICE'

export type RecommendationPriority = 'LOW' | 'MEDIUM' | 'HIGH'

/** Mirrors the Placement Tracker's own confidence tiers — one framework, not two. */
export type RecommendationConfidence = 'LIMITED' | 'EMERGING' | 'ESTABLISHED'

export type RecommendationStatus = 'ACTIVE' | 'COMPLETED' | 'DISMISSED'

export interface Recommendation {
  /** Stable across renders for the same underlying pattern — see signatureFor. */
  id: string
  userId: string
  source: RecommendationSource
  /** The thing the evidence points at: a RoundType for placement-derived ones. */
  sourceId: string
  recommendationType: RecommendationType
  practiceType: PracticeType
  /** The stage this came from, so the UI can name it in the user's own terms. */
  roundType: RoundType
  roundLabel: string
  title: string
  description: string
  priority: RecommendationPriority
  confidence: RecommendationConfidence
  status: RecommendationStatus
  /** Evidence, kept so the copy can cite it and a human can audit the call. */
  evidence: {
    eliminated: number
    reached: number
    eliminationRate: number
    practiceSessionsCompleted: number
  }
}

/**
 * Identifies a recommendation for dismissal purposes. Deliberately includes
 * the priority: dismissing a MEDIUM "practise GDs" suppresses that, but if
 * the pattern later hardens into HIGH the signature changes and the
 * recommendation surfaces again — which is exactly §17's "if the same
 * weakness becomes materially stronger, the system may generate a new
 * recommendation", with no manual re-arming.
 */
export function signatureFor(practiceType: PracticeType, priority: RecommendationPriority): string {
  return `${practiceType}:${priority}`
}
