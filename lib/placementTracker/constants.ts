import type { AnalyticsCategory, OpportunityType, ReflectionType, RoundInput } from './types'

// Every recruitment round is standardised into one of these for analytics —
// display names stay free text (see types.ts), but insights group-by
// exclusively on this category, so "Aptitude Test" and "Online Assessment"
// both roll into "Assessment" without losing either company's own wording.
export const ANALYTICS_CATEGORIES: { value: AnalyticsCategory; label: string }[] = [
  { value: 'resume_screening', label: 'Resume Screening' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'group_exercise', label: 'Group Exercise' },
  { value: 'interview', label: 'Interview' },
  { value: 'final_outcome', label: 'Final Outcome' },
  { value: 'other', label: 'Other' },
]

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
// always the company's first actual evaluation stage.
export const DEFAULT_ROUND_TEMPLATE: RoundInput[] = [
  { displayName: 'Resume Shortlisting', analyticsCategory: 'resume_screening' },
  { displayName: 'Aptitude Test', analyticsCategory: 'assessment' },
  { displayName: 'Group Discussion', analyticsCategory: 'group_exercise' },
  { displayName: 'Interview', analyticsCategory: 'interview' },
  { displayName: 'Final Result', analyticsCategory: 'final_outcome' },
]
