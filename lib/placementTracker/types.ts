// Shared types for the Placement Tracker feature. camelCase public types,
// mirroring lib/teamup/api.ts's convention — the snake_case DB row shapes
// stay private to api.ts and get mapped at the boundary.

export type OpportunityType = 'placement' | 'internship' | 'ppo' | 'other'
export type ApplicationStatus = 'active' | 'offer' | 'rejected' | 'withdrawn' | 'closed'
// The standardised stage every round is aggregated by. Company wording lives
// in the round's own `displayName`; analytics never group by that, so
// "Aptitude Test", "Online Assessment" and "Cognitive Test" roll into one
// bucket while each application's timeline keeps its real names.
//
// Two things are deliberately absent:
//  - "Application" — applying isn't an evaluation stage; nobody is
//    eliminated at it, so a journey starts at the first real selection round.
//  - "Final Result" — an offer is an *outcome* of the journey, not a round
//    within it. It lives on the application's `status` instead.
export type RoundType =
  | 'resume'
  | 'assessment'
  | 'group_discussion'
  | 'video'
  | 'case_interview'
  | 'hr_fit'
  | 'final_interview'
  | 'other'

/** @deprecated Legacy alias kept so older imports keep compiling. */
export type AnalyticsCategory = RoundType

export type RoundOutcome = 'cleared' | 'eliminated' | 'pending' | 'upcoming' | 'withdrawn'

// Status and result are DERIVED from `outcome` (see status.ts), never stored
// alongside it. Storing all three would mean three independently-writable
// fields recording one fact, which is exactly how a round ends up marked
// UPCOMING and ELIMINATED at the same time — the contradiction this model is
// supposed to make impossible.
export type RoundStatus = 'NOT_STARTED' | 'UPCOMING' | 'COMPLETED' | 'ELIMINATED'
export type RoundResult = 'PENDING' | 'PROGRESSED' | 'ELIMINATED' | 'COMPLETED'

// Why a journey ended. Recorded on the round the student exited at, which is
// what turns "you keep getting rejected" into "you keep losing case rounds
// on structure".
export type ExitReason =
  | 'RESUME_PROFILE'
  | 'TEST_ASSESSMENT'
  | 'GROUP_DISCUSSION'
  | 'CASE_STRUCTURE'
  | 'CASE_MATH'
  | 'COMMUNICATION'
  | 'HR_FIT'
  | 'TECHNICAL_DOMAIN'
  | 'FIRM_SIDE'
  | 'WITHDREW'
  | 'OTHER'
export type ReflectionType =
  | 'resume_quality' | 'lack_of_preparation' | 'aptitude_technical' | 'communication'
  | 'time_management' | 'interview_performance' | 'case_performance' | 'unknown' | 'other'

export interface RoundReflection {
  id: string
  roundId: string
  reflectionType: ReflectionType
  notes: string | null
  createdAt: string
}

export interface PlacementRound {
  id: string
  applicationId: string
  roundOrder: number
  displayName: string // the company's own wording — never used for aggregation
  analyticsCategory: RoundType // the standardised bucket analytics group by
  outcome: RoundOutcome
  exitReason: ExitReason | null // required once outcome is 'eliminated' 
  scheduledDate: string | null // ISO timestamp — has a time component
  completedDate: string | null // 'YYYY-MM-DD'
  outcomeNotes: string | null
  reflection: RoundReflection | null
}

export interface PlacementApplication {
  id: string
  userId: string
  companyName: string
  role: string
  opportunityType: OpportunityType
  industry: string | null
  location: string | null
  package: string | null
  stipend: string | null
  applicationDate: string // 'YYYY-MM-DD'
  status: ApplicationStatus
  notes: string | null
  rounds: PlacementRound[]
  createdAt: string
  updatedAt: string
}

// Inputs for writes — no id/timestamps, those are server-generated.
export interface RoundInput {
  displayName: string
  analyticsCategory: RoundType
}

export interface ApplicationInput {
  companyName: string
  role: string
  opportunityType: OpportunityType
  industry: string | null
  location: string | null
  package: string | null
  stipend: string | null
  applicationDate: string // 'YYYY-MM-DD'
  notes: string | null
}
