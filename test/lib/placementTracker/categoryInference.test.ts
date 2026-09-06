import { describe, expect, it } from 'vitest'
import { inferAnalyticsCategory } from '@/lib/placementTracker/categoryInference'

describe('inferAnalyticsCategory', () => {
  it('maps every example from the spec to its documented category', () => {
    const cases: [string, string][] = [
      ['Resume Screening', 'resume_screening'],
      ['Resume Shortlisting', 'resume_screening'],
      ['CV Screening', 'resume_screening'],
      ['Aptitude Test', 'assessment'],
      ['Online Assessment', 'assessment'],
      ['Assessment', 'assessment'],
      ['Psychometric Test', 'assessment'],
      ['Coding Assessment', 'assessment'],
      ['Group Discussion', 'group_exercise'],
      ['Group Exercise', 'group_exercise'],
      ['Group Activity', 'group_exercise'],
      ['Technical Interview', 'interview'],
      ['HR Interview', 'interview'],
      ['Case Interview', 'interview'],
      ['Final Interview', 'interview'],
      ['Personal Interview', 'interview'],
      ['Offer', 'final_outcome'],
      ['Final Result', 'final_outcome'],
    ]
    for (const [name, category] of cases) {
      expect(inferAnalyticsCategory(name), `"${name}"`).toBe(category)
    }
  })

  it('is case-insensitive and trims whitespace', () => {
    expect(inferAnalyticsCategory('  aptitude test  ')).toBe('assessment')
    expect(inferAnalyticsCategory('TECHNICAL INTERVIEW')).toBe('interview')
  })

  it('does not let "Final Interview" and "Final Result" collide on the word "final"', () => {
    expect(inferAnalyticsCategory('Final Interview')).toBe('interview')
    expect(inferAnalyticsCategory('Final Result')).toBe('final_outcome')
  })

  it('infers a custom name via keyword when there is no exact match', () => {
    expect(inferAnalyticsCategory('Panel Interview Round 2')).toBe('interview')
    expect(inferAnalyticsCategory('Case Study Group Round')).toBe('group_exercise')
    expect(inferAnalyticsCategory('Written Test')).toBe('assessment')
    expect(inferAnalyticsCategory('Resume Review')).toBe('resume_screening')
  })

  it('returns null for a genuinely ambiguous custom name — the only case the UI should ask about', () => {
    expect(inferAnalyticsCategory('Founder Chat')).toBeNull()
    expect(inferAnalyticsCategory('Round X')).toBeNull()
    expect(inferAnalyticsCategory('')).toBeNull()
    expect(inferAnalyticsCategory('   ')).toBeNull()
  })

  // Regression: "Application" used to map to its own analytics category.
  // Applying isn't a selection round — nobody gets eliminated at it — so
  // there's no category left to silently assign it to; a round a user
  // insists on calling "Application" now falls into the ambiguous case
  // instead of being mis-categorised.
  it('no longer has an "application" category — a round named that is ambiguous, not auto-classified', () => {
    expect(inferAnalyticsCategory('Application')).toBeNull()
  })
})
