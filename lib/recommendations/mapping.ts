// Round -> practice mapping. One table, deliberately data rather than
// branching, so adding a stage or a new practice format is an entry here
// and nothing else changes (§15).
//
// A null mapping is a real answer, not a gap to fill later: §3 is explicit
// that a stage which can't be confidently mapped must produce no
// recommendation rather than a forced, irrelevant one.

import type { PracticeType } from '@/lib/practiceTogether/types'
import type { RoundType } from '@/lib/placementTracker/types'

export const ROUND_TO_PRACTICE: Record<RoundType, PracticeType | null> = {
  // Assessment covers aptitude tests, online assessments, cognitive tests —
  // all of which the aptitude practice format addresses.
  assessment: 'aptitude',
  group_discussion: 'group_discussion',
  case_interview: 'case_prep',
  hr_fit: 'hr_interview',
  // A generic final/technical interview is best served by a mock interview.
  final_interview: 'mock_interview',
  // A recorded round is still interview practice: rehearsing answers to time
  // is what a mock interview session gives you.
  video: 'mock_interview',

  // Deliberately unmapped:
  // - resume: Practice Together has no resume-review format. Recommending a
  //   live practice session for a resume problem would send the student
  //   somewhere that cannot help. When a resume format exists, map it here.
  resume: null,
  // - other: an unclassifiable custom round tells us nothing about what to
  //   practise, so it must not generate a recommendation (§3).
  other: null,
}

export function practiceTypeForRound(roundType: RoundType): PracticeType | null {
  return ROUND_TO_PRACTICE[roundType] ?? null
}

export function isRecommendableRound(roundType: RoundType): boolean {
  return practiceTypeForRound(roundType) !== null
}
