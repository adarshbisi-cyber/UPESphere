// Maps a round's real-world name to its analytics category automatically,
// so the student only ever has to answer "what are this company's actual
// recruitment stages?" — never "which internal analytics bucket does this
// belong to?". The category still gets stored (Insights needs it), it's
// just never surfaced as a decision the user has to make, except in the
// genuine last resort where a custom name can't be classified at all.

import type { AnalyticsCategory } from './types'

// Common exact round names, lowercased. Checked before the keyword rules so
// "Final Interview" and "Final Result" — which would otherwise both match a
// bare "final" keyword — resolve to their correct, different categories.
const EXACT_MATCHES: Record<string, AnalyticsCategory> = {
  'resume screening': 'resume_screening',
  'resume shortlisting': 'resume_screening',
  'cv screening': 'resume_screening',
  'aptitude test': 'assessment',
  'online assessment': 'assessment',
  'assessment': 'assessment',
  'psychometric test': 'assessment',
  'coding assessment': 'assessment',
  'group discussion': 'group_exercise',
  'group exercise': 'group_exercise',
  'group activity': 'group_exercise',
  'technical interview': 'interview',
  'hr interview': 'interview',
  'case interview': 'interview',
  'final interview': 'interview',
  'personal interview': 'interview',
  'interview': 'interview',
  'offer': 'final_outcome',
  'final result': 'final_outcome',
  'final offer': 'final_outcome',
}

// Fallback for custom names that don't match exactly — ordered so more
// specific patterns (interview, group) are tried before broader ones
// (assessment) that could otherwise false-match a name like "Group Aptitude
// Exercise".
const KEYWORD_RULES: { pattern: RegExp; category: AnalyticsCategory }[] = [
  { pattern: /interview/i, category: 'interview' },
  { pattern: /group/i, category: 'group_exercise' },
  { pattern: /(assessment|aptitude|psychometric|coding test|written test|\btest\b|quiz|exam)/i, category: 'assessment' },
  { pattern: /(resume|cv\b|screening|shortlist)/i, category: 'resume_screening' },
  { pattern: /(offer|final result|selected|selection)/i, category: 'final_outcome' },
]

// Returns null when the name is genuinely ambiguous — the one case where the
// UI should ask "What type of round is this?" instead of guessing silently.
// A round named "Application" also falls into this case now: applying isn't
// an evaluation stage, so there's no category left to map it to (see
// AnalyticsCategory in types.ts) — asking is the honest response, not a
// silent mis-categorisation.
export function inferAnalyticsCategory(displayName: string): AnalyticsCategory | null {
  const normalized = displayName.trim().toLowerCase()
  if (!normalized) return null
  if (EXACT_MATCHES[normalized]) return EXACT_MATCHES[normalized]
  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(normalized)) return rule.category
  }
  return null
}
