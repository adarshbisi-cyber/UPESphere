// Shared types for the Placement Tracker feature. camelCase public types,
// mirroring lib/teamup/api.ts's convention — the snake_case DB row shapes
// stay private to api.ts and get mapped at the boundary.

export type OpportunityType = 'placement' | 'internship' | 'ppo' | 'other'
export type ApplicationStatus = 'active' | 'offer' | 'rejected' | 'withdrawn' | 'closed'
// "Applying" isn't an evaluation stage — nobody gets eliminated at it, so it
// deliberately isn't one of these. The recruitment journey starts at the
// first *selection* round (Resume Screening onward); see constants.ts.
export type AnalyticsCategory =
  | 'resume_screening' | 'assessment' | 'group_exercise' | 'interview' | 'final_outcome' | 'other'
export type RoundOutcome = 'cleared' | 'eliminated' | 'pending' | 'upcoming' | 'withdrawn'
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
  displayName: string
  analyticsCategory: AnalyticsCategory
  outcome: RoundOutcome
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
  analyticsCategory: AnalyticsCategory
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
