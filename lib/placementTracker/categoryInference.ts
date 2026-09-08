// Maps a round's real-world name to its standardised RoundType automatically,
// so the student only ever has to answer "what are this company's actual
// recruitment stages?" — never "which internal analytics bucket does this
// belong to?". The type still gets stored (Insights needs it), it's just
// never surfaced as a decision the user has to make, except in the genuine
// last resort where a custom name can't be classified at all.
//
// This is also the compatibility layer for rounds created before the round
// taxonomy was split (see normaliseLegacyRoundType) — existing wording is
// always preserved as the display label, whatever it maps to.

import type { RoundType } from './types'

// Common exact round names, lowercased. Checked before the keyword rules so
// names that would otherwise collide on a shared keyword — "Final Interview"
// vs "Final Result", "Case Interview" vs "HR Interview" — each resolve to
// their own correct type.
const EXACT_MATCHES: Record<string, RoundType> = {
  'resume screening': 'resume',
  'resume shortlisting': 'resume',
  'resume shortlist': 'resume',
  'cv screening': 'resume',
  'profile screening': 'resume',
  'shortlisting': 'resume',

  'aptitude test': 'assessment',
  'online assessment': 'assessment',
  'online test': 'assessment',
  'assessment': 'assessment',
  'cognitive test': 'assessment',
  'psychometric test': 'assessment',
  'coding assessment': 'assessment',
  'coding test': 'assessment',

  'group discussion': 'group_discussion',
  'group exercise': 'group_discussion',
  'group activity': 'group_discussion',
  'gd': 'group_discussion',

  'video upload': 'video',
  'video interview': 'video',
  'video round': 'video',
  'video submission': 'video',
  'one way video': 'video',
  'one-way video': 'video',

  'case interview': 'case_interview',
  'case round': 'case_interview',
  'case study': 'case_interview',
  'case discussion': 'case_interview',

  'hr interview': 'hr_fit',
  'hr round': 'hr_fit',
  'fit interview': 'hr_fit',
  'cultural fit': 'hr_fit',
  'behavioural interview': 'hr_fit',
  'behavioral interview': 'hr_fit',

  'final interview': 'final_interview',
  'partner interview': 'final_interview',
  'technical interview': 'final_interview',
  'personal interview': 'final_interview',
  'interview': 'final_interview',
}

// Fallback for custom names that don't match exactly — ordered so more
// specific patterns are tried before broader ones that could otherwise
// false-match (e.g. "Group Aptitude Exercise" must not become an assessment,
// and "Case Interview" must not be swallowed by the generic /interview/ rule).
const KEYWORD_RULES: { pattern: RegExp; type: RoundType }[] = [
  { pattern: /\bcase\b/i, type: 'case_interview' },
  { pattern: /(\bhr\b|cultural fit|\bfit\b|behaviou?ral)/i, type: 'hr_fit' },
  { pattern: /video/i, type: 'video' },
  { pattern: /group/i, type: 'group_discussion' },
  { pattern: /interview/i, type: 'final_interview' },
  { pattern: /(assessment|aptitude|psychometric|cognitive|coding test|written test|\btest\b|quiz|exam)/i, type: 'assessment' },
  { pattern: /(resume|cv\b|screening|shortlist|profile)/i, type: 'resume' },
]

// Returns null when the name is genuinely ambiguous — the one case where the
// UI should ask "What type of round is this?" instead of guessing silently.
// A round named "Application" or "Final Result" also lands here: neither is
// an evaluation stage (see RoundType in types.ts), so there's no type to map
// them to, and asking is the honest response rather than a silent
// mis-categorisation.
export function inferRoundType(displayName: string): RoundType | null {
  const normalized = displayName.trim().toLowerCase()
  if (!normalized) return null
  if (EXACT_MATCHES[normalized]) return EXACT_MATCHES[normalized]
  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(normalized)) return rule.type
  }
  return null
}

/** @deprecated Legacy alias — use inferRoundType. */
export const inferAnalyticsCategory = inferRoundType

// Compatibility layer for rounds stored under the pre-split taxonomy.
// The coarse legacy 'interview' bucket can't be resolved from the category
// alone, so the round's own label is re-inferred; anything still ambiguous
// becomes 'other' rather than being dropped, and the label is never touched.
const LEGACY_TYPE_MAP: Record<string, RoundType> = {
  resume_screening: 'resume',
  assessment: 'assessment',
  group_exercise: 'group_discussion',
  other: 'other',
  // Deliberately absent: 'interview' and 'final_outcome' — both need the
  // label to resolve, and 'final_outcome' is no longer a round at all.
}

export function normaliseLegacyRoundType(storedType: string, displayName: string): RoundType {
  const known = LEGACY_TYPE_MAP[storedType]
  if (known) return known
  return inferRoundType(displayName) ?? 'other'
}
