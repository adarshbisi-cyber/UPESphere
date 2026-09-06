import { describe, expect, it } from 'vitest'
import { deriveCategories, filterResources } from '@/lib/careerResources/filter'
import type { CareerResource } from '@/lib/careerResources/types'

function resource(overrides: Partial<CareerResource> = {}): CareerResource {
  return {
    id: 'r1', title: 'Consulting Companies Database',
    description: 'A curated database of consulting companies.',
    category: 'Consulting', resourceType: 'google_sheet',
    externalUrl: 'https://example.com', actionLabel: 'Open Database',
    thumbnailUrl: null, tags: ['Consulting', 'Companies', 'Research', 'Career'], sortOrder: 0,
    ...overrides,
  }
}

describe('deriveCategories', () => {
  it('derives categories from whatever is actually published, not a hardcoded list', () => {
    const resources = [
      resource({ category: 'Consulting' }),
      resource({ category: 'Templates & Tools' }),
      resource({ category: 'Consulting' }), // duplicate — should collapse
    ]
    expect(deriveCategories(resources)).toEqual(['All', 'Consulting', 'Templates & Tools'])
  })

  it('is just "All" when there are no resources yet', () => {
    expect(deriveCategories([])).toEqual(['All'])
  })

  it('sorts categories alphabetically for a stable order', () => {
    const resources = [resource({ category: 'Zeta' }), resource({ category: 'Alpha' })]
    expect(deriveCategories(resources)).toEqual(['All', 'Alpha', 'Zeta'])
  })
})

describe('filterResources', () => {
  const library = [
    resource({ id: 'a', title: 'Consulting Companies Database', category: 'Consulting', tags: ['Consulting', 'Research'] }),
    resource({ id: 'b', title: 'Resume Template Pack', description: 'ATS-friendly resume templates.', category: 'Templates & Tools', tags: ['Resume'] }),
    resource({ id: 'c', title: 'Interview Prep Guide', description: 'Common questions and structured answers.', category: 'Interview Preparation', tags: ['Interview', 'Guide'] }),
  ]

  it('with no search and "All" selected, returns everything', () => {
    expect(filterResources(library, { search: '', category: 'All' })).toHaveLength(3)
  })

  it('filters by category', () => {
    const result = filterResources(library, { search: '', category: 'Templates & Tools' })
    expect(result.map(r => r.id)).toEqual(['b'])
  })

  it('searches title, description, category, and tags — case-insensitively', () => {
    expect(filterResources(library, { search: 'consulting', category: 'All' }).map(r => r.id)).toEqual(['a'])
    expect(filterResources(library, { search: 'ATS-friendly', category: 'All' }).map(r => r.id)).toEqual(['b'])
    expect(filterResources(library, { search: 'INTERVIEW PREPARATION', category: 'All' }).map(r => r.id)).toEqual(['c'])
    expect(filterResources(library, { search: 'guide', category: 'All' }).map(r => r.id)).toEqual(['c'])
  })

  it('combines search and category filtering', () => {
    expect(filterResources(library, { search: 'template', category: 'Consulting' })).toEqual([])
    expect(filterResources(library, { search: 'template', category: 'Templates & Tools' }).map(r => r.id)).toEqual(['b'])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterResources(library, { search: 'nonexistent keyword', category: 'All' })).toEqual([])
  })
})
