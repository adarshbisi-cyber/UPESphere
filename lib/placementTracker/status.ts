// Derives an application's high-level state from its recruitment rounds,
// rather than letting `status` be hand-maintained alongside the rounds
// themselves — two independently-editable fields recording the same fact
// inevitably drift out of sync.
//
// The same principle applies one level down: a round stores a single
// `outcome`, and its RoundStatus/RoundResult are derived from it. Storing
// status and result as their own writable columns would make "UPCOMING but
// ELIMINATED" representable, which is precisely the contradiction the model
// is meant to rule out.

import type {
  ApplicationStatus, ExitReason, PlacementRound, RoundResult, RoundStatus,
} from './types'

export function roundStatus(round: PlacementRound): RoundStatus {
  switch (round.outcome) {
    case 'eliminated': return 'ELIMINATED'
    case 'cleared': return 'COMPLETED'
    case 'withdrawn': return 'COMPLETED'
    case 'pending': return 'UPCOMING' // sat, awaiting the result
    case 'upcoming': return 'UPCOMING'
  }
}

export function roundResult(round: PlacementRound): RoundResult {
  switch (round.outcome) {
    case 'eliminated': return 'ELIMINATED'
    case 'cleared': return 'PROGRESSED'
    case 'withdrawn': return 'COMPLETED'
    case 'pending': return 'PENDING'
    case 'upcoming': return 'PENDING'
  }
}

export function isRoundResolved(round: PlacementRound): boolean {
  return round.outcome === 'cleared' || round.outcome === 'eliminated' || round.outcome === 'withdrawn'
}

// The round the student exited the process at, if any.
export function exitRound(rounds: PlacementRound[]): PlacementRound | null {
  return [...rounds].sort((a, b) => a.roundOrder - b.roundOrder).find(r => r.outcome === 'eliminated') ?? null
}

// An elimination whose reason is "I withdrew" means the student stopped,
// not the company — the same round data therefore closes the application
// as withdrawn rather than rejected.
export function deriveApplicationStatus(
  rounds: PlacementRound[],
  manualOverride?: 'withdrawn' | 'offer' | null,
): ApplicationStatus {
  if (manualOverride === 'withdrawn') return 'withdrawn'
  if (manualOverride === 'offer') return 'offer'

  const exit = exitRound(rounds)
  if (exit) return exit.exitReason === 'WITHDREW' ? 'withdrawn' : 'rejected'

  // An offer is an outcome, not a round: there is no "Final Result" stage to
  // read it off, so it is only ever set explicitly on the application.
  return 'active'
}

export function isApplicationClosed(status: ApplicationStatus): boolean {
  return status === 'rejected' || status === 'withdrawn' || status === 'closed' || status === 'offer'
}

// The round the student is currently waiting on: the earliest unresolved
// round. Only meaningful while the journey is still running — see
// getApplicationJourneyState, which is what the UI should use, since a
// closed application must never advertise a "current" round.
export function currentRound(rounds: PlacementRound[]): PlacementRound | null {
  const unresolved = rounds
    .filter(r => r.outcome === 'pending' || r.outcome === 'upcoming')
    .sort((a, b) => a.roundOrder - b.roundOrder)
  return unresolved[0] ?? null
}

export function exitReasonOf(rounds: PlacementRound[]): ExitReason | null {
  return exitRound(rounds)?.exitReason ?? null
}
