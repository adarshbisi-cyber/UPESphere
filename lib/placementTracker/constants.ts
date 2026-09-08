import type { ExitReason, OpportunityType, ReflectionType, RoundInput, RoundType } from './types'

// Every recruitment round is standardised into one of these for analytics —
// display names stay free text (see types.ts), but insights group-by
// exclusively on this type, so "Aptitude Test" and "Online Assessment" both
// roll into "Online Test / Assessment" without losing either company's own
// wording.
export const ROUND_TYPES: { value: RoundType; label: string }[] = [
  { value: 'resume', label: 'Resume / Profile' },
  { value: 'assessment', label: 'Online Test / Assessment' },
  { value: 'group_discussion', label: 'Group Discussion' },
  { value: 'video', label: 'Video Round' },
  { value: 'case_interview', label: 'Case Interview' },
  { value: 'hr_fit', label: 'HR / Fit Interview' },
  { value: 'final_interview', label: 'Final Interview' },
  { value: 'other', label: 'Other' },
]

/** @deprecated Legacy alias — use ROUND_TYPES. */
export const ANALYTICS_CATEGORIES = ROUND_TYPES

// The order stages are shown in throughout the funnel. 'other' is absent by
// design: an unclassifiable round has no defensible position in a sequence,
// so it's counted in round performance but never given a funnel slot that
// would imply one.
export const FUNNEL_ORDER: RoundType[] = [
  'resume',
  'assessment',
  'group_discussion',
  'video',
  'case_interview',
  'hr_fit',
  'final_interview',
]

export function roundTypeLabel(type: RoundType): string {
  return ROUND_TYPES.find(t => t.value === type)?.label ?? 'Other'
}

// Why a journey ended, recorded on the round the student exited at.
// 'WITHDREW' is the one reason that means the student stopped rather than
// the company did, which is why it maps the application to withdrawn rather
// than rejected (see deriveApplicationStatus).
export const EXIT_REASONS: { value: ExitReason; label: string }[] = [
  { value: 'RESUME_PROFILE', label: 'Resume / Profile' },
  { value: 'TEST_ASSESSMENT', label: 'Test / Assessment' },
  { value: 'GROUP_DISCUSSION', label: 'Group Discussion' },
  { value: 'CASE_STRUCTURE', label: 'Case Structure' },
  { value: 'CASE_MATH', label: 'Case Math / Quantitative Analysis' },
  { value: 'COMMUNICATION', label: 'Communication' },
  { value: 'HR_FIT', label: 'HR / Cultural Fit' },
  { value: 'TECHNICAL_DOMAIN', label: 'Technical / Domain Knowledge' },
  { value: 'FIRM_SIDE', label: 'Firm-Side Decision' },
  { value: 'WITHDREW', label: 'I withdrew' },
  { value: 'OTHER', label: 'Other' },
]

export function exitReasonLabel(reason: ExitReason): string {
  return EXIT_REASONS.find(r => r.value === reason)?.label ?? 'Other'
}

// Quick-pick options for the Add Application form's Role dropdown —
// "Other" always stays last as the free-text escape hatch for any title
// not in this list (see AddApplicationModal's RoleChoice handling).
export const ROLE_CHOICES = [
  'Associate',
  'Analyst',
  'Consultant',
  'Business Analyst',
  'Management Trainee',
  'Software Engineer',
  'Product Intern',
] as const

export const OPPORTUNITY_TYPES: { value: OpportunityType; label: string }[] = [
  { value: 'placement', label: 'Placement' },
  { value: 'internship', label: 'Internship' },
  { value: 'ppo', label: 'PPO' },
  { value: 'other', label: 'Other' },
]

export const REFLECTION_TYPES: { value: ReflectionType; label: string }[] = [
  { value: 'resume_quality', label: 'Resume quality' },
  { value: 'lack_of_preparation', label: 'Lack of preparation' },
  { value: 'aptitude_technical', label: 'Aptitude / technical skills' },
  { value: 'communication', label: 'Communication' },
  { value: 'time_management', label: 'Time management' },
  { value: 'interview_performance', label: 'Interview performance' },
  { value: 'case_performance', label: 'Case performance' },
  { value: 'unknown', label: "I'm not sure" },
  { value: 'other', label: 'Other' },
]

// Prefills a new application's recruitment-journey editor — purely a
// starting point, every round can be renamed, reordered, added, or removed.
// Not every company follows this exact sequence, which is exactly why the
// editor is fully editable rather than this being hardcoded. Categories
// aren't user-facing (see categoryInference.ts) but are included here too
// so a template round that's never touched still analyses correctly.
//
// Deliberately starts at Resume Shortlisting, not "Application" — applying
// isn't a selection round (nobody gets eliminated at it), so Round 1 is
// always the company's first actual evaluation stage. It also stops at the
// last real interview: "Final Result" is the journey's outcome, recorded on
// the application's status, not a round the student can be eliminated at.
export const DEFAULT_ROUND_TEMPLATE: RoundInput[] = [
  { displayName: 'Resume Shortlisting', analyticsCategory: 'resume' },
  { displayName: 'Aptitude Test', analyticsCategory: 'assessment' },
  { displayName: 'Group Discussion', analyticsCategory: 'group_discussion' },
  { displayName: 'Interview', analyticsCategory: 'final_interview' },
]
