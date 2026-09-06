// Derives an application's high-level status from its recruitment rounds,
// rather than letting `status` be hand-maintained alongside the rounds
// themselves — two independently-editable fields recording the same fact
// inevitably drift out of sync. The one state a rounds-derivation genuinely
// can't represent is an explicit withdrawal, which is why that's the only
// manual override this function accepts.

import type { PlacementRound, ApplicationStatus } from './types'

export function deriveApplicationStatus(
  rounds: PlacementRound[],
  manualOverride?: 'withdrawn' | null,
): ApplicationStatus {
  if (manualOverride === 'withdrawn') return 'withdrawn'

  if (rounds.some(r => r.outcome === 'eliminated')) return 'rejected'

  const finalOutcomeRound = rounds.find(r => r.analyticsCategory === 'final_outcome')
  if (finalOutcomeRound?.outcome === 'cleared') return 'offer'

  return 'active'
}

// True once an application is no longer progressing — used to lock further
// round edits (see the data-integrity rules in the implementation plan:
// a round can't be cleared after an earlier one eliminated the candidate,
// and an application can't receive an offer after being rejected).
export function isApplicationClosed(status: ApplicationStatus): boolean {
  return status === 'rejected' || status === 'withdrawn' || status === 'closed'
}

// The round the student is currently waiting on: the earliest (by order)
// round not yet resolved. Derived, never manually flagged — so there's no
// way for two rounds to simultaneously claim to be "current".
export function currentRound(rounds: PlacementRound[]): PlacementRound | null {
  const unresolved = rounds
    .filter(r => r.outcome === 'pending' || r.outcome === 'upcoming')
    .sort((a, b) => a.roundOrder - b.roundOrder)
  return unresolved[0] ?? null
}
