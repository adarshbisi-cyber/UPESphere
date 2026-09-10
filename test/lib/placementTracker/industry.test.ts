import { describe, expect, it } from 'vitest'
import {
  INDUSTRY_OPTIONS, INDUSTRY_SELECT_OPTIONS, OTHER_INDUSTRY,
  canAddCustomIndustry, filterIndustries, resolveIndustry, splitIndustry,
} from '@/lib/placementTracker/industry'

describe('INDUSTRY_SELECT_OPTIONS', () => {
  it('offers every listed industry plus the custom escape hatch, last', () => {
    expect(INDUSTRY_SELECT_OPTIONS).toHaveLength(INDUSTRY_OPTIONS.length + 1)
    expect(INDUSTRY_SELECT_OPTIONS[INDUSTRY_SELECT_OPTIONS.length - 1]).toBe(OTHER_INDUSTRY)
  })

  it('has no duplicates', () => {
    expect(new Set(INDUSTRY_SELECT_OPTIONS).size).toBe(INDUSTRY_SELECT_OPTIONS.length)
  })
})

describe('resolveIndustry', () => {
  it('uses the chosen preset directly', () => {
    expect(resolveIndustry('Consulting', '')).toBe('Consulting')
    expect(resolveIndustry('Consulting', 'ignored')).toBe('Consulting')
  })

  it('uses the trimmed custom value when Other is chosen', () => {
    expect(resolveIndustry(OTHER_INDUSTRY, '  Fintech  ')).toBe('Fintech')
  })

  it('is empty when nothing has been chosen', () => {
    expect(resolveIndustry('', '')).toBe('')
  })
})

describe('splitIndustry', () => {
  it('recovers every preset from a stored value', () => {
    for (const option of INDUSTRY_OPTIONS) {
      expect(splitIndustry(option)).toEqual({ choice: option, custom: '' })
    }
  })

  it('treats an unrecognised industry as a custom one', () => {
    expect(splitIndustry('Fintech')).toEqual({ choice: OTHER_INDUSTRY, custom: 'Fintech' })
  })

  it('normalises case and padding back onto the matching preset', () => {
    expect(splitIndustry('  consulting ')).toEqual({ choice: 'Consulting', custom: '' })
  })

  it('leaves an unset industry unset rather than defaulting to Other', () => {
    expect(splitIndustry('')).toEqual({ choice: '', custom: '' })
    expect(splitIndustry('   ')).toEqual({ choice: '', custom: '' })
  })

  it('round-trips every preset and a custom value unchanged', () => {
    for (const industry of [...INDUSTRY_OPTIONS, 'Fintech', 'Space Technology']) {
      const { choice, custom } = splitIndustry(industry)
      expect(resolveIndustry(choice, custom)).toBe(industry)
    }
  })

  // The reason there is no separate customIndustry column: analytics group
  // by this string, and 'Other' would collapse every custom entry together.
  it('stores the real industry name, never the literal "Other"', () => {
    expect(resolveIndustry(...Object.values(splitIndustry('Fintech')) as [string, string])).toBe('Fintech')
  })
})

describe('filterIndustries', () => {
  it('returns everything for an empty query', () => {
    expect(filterIndustries('')).toEqual(INDUSTRY_SELECT_OPTIONS)
    expect(filterIndustries('   ')).toEqual(INDUSTRY_SELECT_OPTIONS)
  })

  it('matches case-insensitively on any part of the name', () => {
    expect(filterIndustries('bank')).toContain('Banking')
    expect(filterIndustries('bank')).toContain('Investment Banking')
    expect(filterIndustries('SOFTWARE')).toContain('Information Technology / Software')
  })

  it('returns nothing when there is no match', () => {
    expect(filterIndustries('zzzzz')).toEqual([])
  })
})

describe('canAddCustomIndustry', () => {
  it('offers to add a genuinely new value', () => {
    expect(canAddCustomIndustry('Fintech')).toBe(true)
  })

  it('does not offer to add something the list already has', () => {
    expect(canAddCustomIndustry('Consulting')).toBe(false)
    expect(canAddCustomIndustry('  consulting  ')).toBe(false)
    expect(canAddCustomIndustry(OTHER_INDUSTRY)).toBe(false)
  })

  it('does not offer to add nothing', () => {
    expect(canAddCustomIndustry('')).toBe(false)
    expect(canAddCustomIndustry('   ')).toBe(false)
  })
})
