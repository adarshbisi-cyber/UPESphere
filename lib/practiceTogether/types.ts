// Shared types for Practice Together. camelCase public types; the snake_case
// DB rows stay private to api.ts and are mapped at the boundary — same
// convention as lib/teamup/api.ts and lib/placementTracker.

export type PracticeType =
  | 'case_prep' | 'guesstimate' | 'group_discussion'
  | 'mock_interview' | 'hr_interview' | 'aptitude' | 'other'

export type SessionMode = 'online' | 'offline'
export type ExperienceLevel = 'any' | 'beginner' | 'intermediate' | 'advanced'
export type CollegePreference = 'any' | 'my_college'

// 'draft' from the spec's lifecycle is deliberately absent: nothing in this
// MVP can create a session without publishing it, so a state no code path
// can reach would be dead weight in every switch. It can be added when a
// save-as-draft flow exists to produce it.
export type SessionStatus = 'open' | 'full' | 'completed' | 'cancelled'

export type ParticipantRole = 'host' | 'participant'
export type JoinRequestStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn'

export interface PublicProfile {
  id: string
  fullName: string | null
  avatarUrl: string | null
  universityId: string | null
}

export interface PracticeParticipant {
  id: string
  sessionId: string
  userId: string
  role: ParticipantRole
  joinedAt: string
  profile: PublicProfile | null
}

export interface PracticeJoinRequest {
  id: string
  sessionId: string
  requesterId: string
  message: string | null
  status: JoinRequestStatus
  createdAt: string
  profile: PublicProfile | null
}

export interface PracticeSession {
  id: string
  creatorId: string
  practiceType: PracticeType
  customPracticeType: string | null
  title: string
  description: string | null

  scheduledDate: string // 'YYYY-MM-DD'
  startTime: string     // 'HH:MM'
  durationMinutes: number

  mode: SessionMode
  location: string | null
  meetingLink: string | null

  experienceLevel: ExperienceLevel
  collegePreference: CollegePreference

  minParticipants: number
  maxParticipants: number
  currentParticipants: number

  status: SessionStatus
  // Per-type answers (case type, GD format, ...). Free-form by design; see
  // the type_specific column comment in the migration.
  typeSpecific: Record<string, string>

  createdAt: string
  updatedAt: string

  creator: PublicProfile | null
  participants: PracticeParticipant[]
}

export interface CreateSessionInput {
  practiceType: PracticeType
  customPracticeType: string | null
  title: string
  description: string | null
  scheduledDate: string
  startTime: string
  durationMinutes: number
  mode: SessionMode
  location: string | null
  /** Required when mode is 'online'; ignored otherwise. */
  meetingLink: string | null
  experienceLevel: ExperienceLevel
  collegePreference: CollegePreference
  minParticipants: number
  maxParticipants: number
  typeSpecific: Record<string, string>
}
