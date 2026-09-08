import { describe, expect, it } from 'vitest'
import { inferRoundType, normaliseLegacyRoundType } from '@/lib/placementTracker/categoryInference'

describe('inferRoundType', () => {
  it('maps each canonical stage name to its own type', () => {
    expect(inferRoundType('Resume Shortlisting')).toBe('resume')
    expect(inferRoundType('Aptitude Test')).toBe('assessment')
    expect(inferRoundType('Group Discussion')).toBe('group_discussion')
    expect(inferRoundType('Video Upload')).toBe('video')
    expect(inferRoundType('Case Interview')).toBe('case_interview')
    expect(inferRoundType('HR Interview')).toBe('hr_fit')
    expect(inferRoundType('Final Interview')).toBe('final_interview')
  })

  // Scenario 3 from the spec: three companies, three names, one bucket.
  it('aggregates differently-named assessment rounds under one type', () => {
    for (const name of ['Online Assessment', 'Aptitude Test', 'Cognitive Test', 'Online Test']) {
      expect(inferRoundType(name)).toBe('assessment')
    }
  })

  it('separates interview kinds that used to collapse into one bucket', () => {
    expect(inferRoundType('Case Interview')).not.toBe(inferRoundType('HR Interview'))
    expect(inferRoundType('Case Round')).toBe('case_interview')
    expect(inferRoundType('Fit Interview')).toBe('hr_fit')
  })

  it('is case- and whitespace-insensitive', () => {
    expect(inferRoundType('  GROUP DISCUSSION  ')).toBe('group_discussion')
  })

  it('infers a custom name via keyword when there is no exact match', () => {
    expect(inferRoundType('Second Case Round')).toBe('case_interview')
    expect(inferRoundType('Written Test')).toBe('assessment')
    expect(inferRoundType('CV Screening Stage')).toBe('resume')
    expect(inferRoundType('Asynchronous Video Task')).toBe('video')
  })

  it('does not let a specific interview kind be swallowed by the generic rule', () => {
    // /interview/ would match all three; the more specific rules run first.
    expect(inferRoundType('Case Interview Round 2')).toBe('case_interview')
    expect(inferRoundType('HR Interview Round')).toBe('hr_fit')
  })

  it('returns null for stages that are not evaluation rounds at all', () => {
    // Neither applying nor the final outcome is a round someone is
    // eliminated at, so there is no type to map them to.
    expect(inferRoundType('Application')).toBeNull()
    expect(inferRoundType('Final Result')).toBeNull()
    expect(inferRoundType('')).toBeNull()
  })
})

describe('normaliseLegacyRoundType', () => {
  it('renames the pre-split types that map one-to-one', () => {
    expect(normaliseLegacyRoundType('resume_screening', 'Resume Shortlisting')).toBe('resume')
    expect(normaliseLegacyRoundType('group_exercise', 'Group Discussion')).toBe('group_discussion')
    expect(normaliseLegacyRoundType('assessment', 'Aptitude Test')).toBe('assessment')
  })

  it("resolves the old coarse 'interview' bucket from the round's own label", () => {
    expect(normaliseLegacyRoundType('interview', 'Case Interview')).toBe('case_interview')
    expect(normaliseLegacyRoundType('interview', 'HR Interview')).toBe('hr_fit')
    expect(normaliseLegacyRoundType('interview', 'Final Interview')).toBe('final_interview')
  })

  it('falls back to other rather than dropping a round it cannot classify', () => {
    expect(normaliseLegacyRoundType('interview', 'Mystery Stage')).toBe('other')
    expect(normaliseLegacyRoundType('final_outcome', 'Final Result')).toBe('other')
  })

  it('passes through a value already on the new taxonomy', () => {
    expect(normaliseLegacyRoundType('assessment', 'Aptitude Test')).toBe('assessment')
    expect(normaliseLegacyRoundType('other', 'Something Custom')).toBe('other')
  })
})
