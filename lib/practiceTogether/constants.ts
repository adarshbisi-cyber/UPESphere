import { Briefcase, Calculator, Lightbulb, MessageSquare, Users, UserCheck, Sparkles, type LucideIcon } from 'lucide-react'
import type { CollegePreference, ExperienceLevel, PracticeType, SessionMode } from './types'

export const PRACTICE_TYPES: { value: PracticeType; label: string; icon: LucideIcon }[] = [
  { value: 'case_prep', label: 'Case Prep', icon: Briefcase },
  { value: 'guesstimate', label: 'Guesstimate', icon: Lightbulb },
  { value: 'group_discussion', label: 'Group Discussion', icon: Users },
  { value: 'mock_interview', label: 'Mock Interview', icon: MessageSquare },
  { value: 'hr_interview', label: 'HR Interview', icon: UserCheck },
  { value: 'aptitude', label: 'Aptitude', icon: Calculator },
  { value: 'other', label: 'Other', icon: Sparkles },
]

export function practiceTypeLabel(type: PracticeType, custom?: string | null): string {
  if (type === 'other') return custom?.trim() || 'Other'
  return PRACTICE_TYPES.find(t => t.value === type)?.label ?? 'Practice'
}

export function practiceTypeIcon(type: PracticeType): LucideIcon {
  return PRACTICE_TYPES.find(t => t.value === type)?.icon ?? Sparkles
}

// Discover's quick filters. 'other' isn't offered as a chip — a bucket of
// unrelated custom types isn't a useful thing to filter by.
export const DISCOVER_FILTERS: { value: PracticeType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'case_prep', label: 'Case Prep' },
  { value: 'guesstimate', label: 'Guesstimates' },
  { value: 'group_discussion', label: 'Group Discussion' },
  { value: 'mock_interview', label: 'Mock Interview' },
  { value: 'hr_interview', label: 'HR Interview' },
  { value: 'aptitude', label: 'Aptitude' },
]

export const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'any', label: 'Any Level' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export const COLLEGE_PREFERENCES: { value: CollegePreference; label: string }[] = [
  { value: 'any', label: 'Any College' },
  { value: 'my_college', label: 'My College Only' },
]

export const SESSION_MODES: { value: SessionMode; label: string }[] = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
]

export const DURATION_OPTIONS = [30, 45, 60, 90, 120]

// ============================================================
// Per-type fields
//
// Every practice type asks for a different handful of details. Declaring
// them as data rather than branching in JSX means the create form is one
// component that renders whatever the selected type declares, and adding a
// type is an entry here rather than another branch in the form.
// ============================================================

export interface TypeSpecificField {
  key: string
  label: string
  options: string[]
}

export interface PracticeTypeConfig {
  fields: TypeSpecificField[]
  defaultMin: number
  defaultMax: number
  /** Whether the host chooses the capacity, or the format fixes it at 2. */
  capacityEditable: boolean
}

const PAIR_DEFAULTS = { defaultMin: 2, defaultMax: 2, capacityEditable: false }

export const PRACTICE_TYPE_CONFIG: Record<PracticeType, PracticeTypeConfig> = {
  case_prep: {
    ...PAIR_DEFAULTS,
    fields: [
      { key: 'format', label: 'Practice Format', options: ['I want to be the Candidate', 'I want to be the Interviewer', 'Alternate Roles', 'Any Format'] },
      { key: 'caseType', label: 'Case Type', options: ['Profitability', 'Market Entry', 'Growth Strategy', 'M&A', 'Operations', 'Any Case Type'] },
    ],
  },
  guesstimate: {
    ...PAIR_DEFAULTS,
    fields: [
      { key: 'format', label: 'Practice Format', options: ['Peer Practice', 'Mock Interview', 'Alternate Roles'] },
    ],
  },
  group_discussion: {
    // A GD needs a group: the spec's floor of 4 is enforced here and again
    // by validateCapacity, so it can't be dodged by editing the form state.
    defaultMin: 4, defaultMax: 6, capacityEditable: true,
    fields: [
      { key: 'format', label: 'GD Format', options: ['Abstract Topic', 'Current Affairs', 'Business Topic', 'Placement GD', 'Any'] },
    ],
  },
  mock_interview: {
    ...PAIR_DEFAULTS,
    fields: [
      { key: 'interviewType', label: 'Interview Type', options: ['Consulting', 'HR', 'Technical', 'General'] },
      { key: 'format', label: 'Practice Format', options: ['One-way Mock Interview', 'Alternate Roles'] },
    ],
  },
  hr_interview: {
    ...PAIR_DEFAULTS,
    fields: [
      { key: 'format', label: 'Practice Format', options: ['Candidate Practice', 'Mock Interview', 'Alternate Roles'] },
    ],
  },
  aptitude: {
    defaultMin: 2, defaultMax: 4, capacityEditable: true,
    fields: [
      { key: 'format', label: 'Practice Format', options: ['Individual Practice Together', 'Peer Discussion', 'Group Practice'] },
    ],
  },
  other: {
    defaultMin: 2, defaultMax: 4, capacityEditable: true,
    fields: [],
  },
}

// The GD floor, applied wherever capacity is validated.
export const MIN_PARTICIPANTS_FOR_TYPE: Partial<Record<PracticeType, number>> = {
  group_discussion: 4,
}

export const MAX_PARTICIPANTS_CEILING = 12


// ============================================================
// Practice Activity colours
//
// Colour means *type* here, not volume — which is why this isn't called a
// heatmap. Each entry carries a solid fill for calendar segments and a
// Tailwind text class for legends and bars, so the two can't drift apart.
// ============================================================

export const PRACTICE_TYPE_COLOR: Record<PracticeType, { fill: string; text: string; label: string }> = {
  case_prep:        { fill: '#8b5cf6', text: 'text-violet-400',  label: 'Case Prep' },
  guesstimate:      { fill: '#3b82f6', text: 'text-blue-400',    label: 'Guesstimates' },
  group_discussion: { fill: '#22c55e', text: 'text-green-400',   label: 'Group Discussion' },
  mock_interview:   { fill: '#f97316', text: 'text-orange-400',  label: 'Mock Interview' },
  hr_interview:     { fill: '#ef4444', text: 'text-red-400',     label: 'HR Interview' },
  aptitude:         { fill: '#eab308', text: 'text-yellow-400',  label: 'Aptitude' },
  other:            { fill: '#64748b', text: 'text-slate-400',   label: 'Other' },
}

/** An empty day: the same neutral surface every other empty slot uses. */
export const PRACTICE_EMPTY_FILL = 'var(--muted-surface)'
