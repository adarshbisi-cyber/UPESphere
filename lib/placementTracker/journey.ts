// The single source of truth for "where is this application right now" and
// "what is coming up".
//
// Both questions used to be answered independently in several places, and
// the answers disagreed:
//   - My Applications called currentRound() first, so a REJECTED application
//     whose later rounds were still marked upcoming advertised
//     "Current: Group Discussion" — a stage the student can never reach.
//   - The Upcoming Rounds metric counted applications with a future
//     scheduled date, while Upcoming Actions counted earliest-unresolved
//     rounds. An active round with no date set appeared in one and not the
//     other, and a closed application's leftover rounds counted in the metric.
// Everything now derives from the two functions here.

import { currentRound, exitRound, isApplicationClosed } from './status'
import type { PlacementApplication, PlacementRound } from './types'

export type JourneyPhase = 'active' | 'rejected' | 'withdrawn' | 'offer'

export interface ApplicationJourneyState {
  phase: JourneyPhase
  // The round the state refers to: the next one while active, or the one the
  // student exited at once closed. Null when there's nothing to point at.
  round: PlacementRound | null
  // Ready-to-render summary, e.g. "Current: Group Discussion",
  // "Rejected at: Assessment", "Offer Received".
  label: string
}

export function getApplicationJourneyState(application: PlacementApplication): ApplicationJourneyState {
  const { status, rounds } = application

  if (status === 'offer') {
    return { phase: 'offer', round: null, label: 'Offer Received' }
  }

  if (status === 'rejected' || status === 'withdrawn' || status === 'closed') {
    const exit = exitRound(rounds)
    const phase: JourneyPhase = status === 'withdrawn' ? 'withdrawn' : 'rejected'
    const verb = phase === 'withdrawn' ? 'Withdrawn at' : 'Rejected at'
    // A closed application never reports a *current* round, even though its
    // later rounds may still sit at 'upcoming' — those stages are unreachable.
    if (exit) return { phase, round: exit, label: `${verb}: ${exit.displayName}` }
    const last = [...rounds].sort((a, b) => b.roundOrder - a.roundOrder)[0] ?? null
    return { phase, round: last, label: last ? `${verb}: ${last.displayName}` : (phase === 'withdrawn' ? 'Withdrawn' : 'Closed') }
  }

  const next = currentRound(rounds)
  if (next) return { phase: 'active', round: next, label: `Current: ${next.displayName}` }
  if (rounds.length === 0) return { phase: 'active', round: null, label: 'No rounds yet' }
  // Active with every round resolved and no elimination: the journey has run
  // out of stages, so the honest prompt is to record what happened.
  return { phase: 'active', round: null, label: 'Awaiting your update' }
}

export interface UpcomingRound {
  application: PlacementApplication
  round: PlacementRound
}

// A round is upcoming only when the application is still live AND the round
// itself is unresolved. A scheduled date is extra information, never a
// precondition — most students add the round before the company gives them
// a slot, and those rounds are exactly the ones worth surfacing.
export function getUpcomingRounds(applications: PlacementApplication[]): UpcomingRound[] {
  const upcoming: UpcomingRound[] = []
  for (const application of applications) {
    if (application.status !== 'active' || isApplicationClosed(application.status)) continue
    const round = currentRound(application.rounds)
    if (!round) continue
    upcoming.push({ application, round })
  }

  // Dated rounds first, soonest first; undated ones after.
  return upcoming.sort((a, b) => {
    const aDate = a.round.scheduledDate
    const bDate = b.round.scheduledDate
    if (aDate && bDate) return aDate.localeCompare(bDate)
    if (aDate) return -1
    if (bDate) return 1
    return a.application.companyName.localeCompare(b.application.companyName)
  })
}

// Active applications whose journey has run out of rounds — they can't
// appear in getUpcomingRounds (there is no next round), but they're the
// other thing the student needs to act on.
export function getApplicationsNeedingUpdate(applications: PlacementApplication[]): PlacementApplication[] {
  return applications.filter(a => a.status === 'active' && a.rounds.length > 0 && currentRound(a.rounds) === null)
}
