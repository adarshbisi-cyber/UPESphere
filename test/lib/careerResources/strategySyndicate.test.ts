import { describe, expect, it } from 'vitest'
import { deriveCategories, filterResources } from '@/lib/careerResources/filter'
import { RESOURCE_TYPE_META } from '@/lib/careerResources/constants'
import type { CareerResource } from '@/lib/careerResources/types'

// The exact values the migration stores.
const DECKS: CareerResource = {
  id: '10',
  title: 'The Strategy Syndicate – Session Decks',
  description: 'A collection of presentation decks and learning materials from the sessions conducted as part of The Strategy Syndicate cohort. Use these resources to revisit session concepts, frameworks, examples, and preparation material covered during the cohort.',
  category: 'Consulting',
  resourceType: 'folder',
  externalUrl: 'https://drive.google.com/drive/folders/1zAbcIr4BEABFMcUp_0C4QCmAz5K5-qCE?usp=sharing',
  actionLabel: 'Explore Session Decks',
  thumbnailUrl: null,
  tags: ['The Strategy Syndicate', 'Strategy Syndicate', 'Consulting', 'Session Decks',
    'Consulting Preparation', 'Case Preparation', 'Career', 'Learning Resources'],
  sortOrder: 10,
}
const CASE_BOOKS: CareerResource = {
  id: '3', title: 'Case Books', description: 'A curated collection of case books.',
  category: 'Consulting', resourceType: 'folder', externalUrl: 'x',
  actionLabel: 'Explore Case Books', thumbnailUrl: null, tags: ['Case Interview'], sortOrder: 3,
}
const IIM: CareerResource = {
  id: '1', title: 'IIM Resume Template', description: 'A professional resume template.',
  category: 'Resume & Applications', resourceType: 'google_doc', externalUrl: 'x',
  actionLabel: 'Open Template', thumbnailUrl: null, tags: ['Resume'], sortOrder: 1,
}
const ALL = [IIM, CASE_BOOKS, DECKS]
const titles = (r: CareerResource[]) => r.map(x => x.title)

describe('The Strategy Syndicate – Session Decks', () => {
  it('renders as a collection, with the same folder icon as the other Drive folders', () => {
    const meta = RESOURCE_TYPE_META[DECKS.resourceType]
    expect(meta.label).toBe('Collection')
    expect(meta.icon).toBe(RESOURCE_TYPE_META[CASE_BOOKS.resourceType].icon)
  })

  it('points at the exact Drive folder, and stores only the folder', () => {
    expect(DECKS.externalUrl)
      .toBe('https://drive.google.com/drive/folders/1zAbcIr4BEABFMcUp_0C4QCmAz5K5-qCE?usp=sharing')
    // The folder gains new decks over time; nothing here mirrors its contents.
    expect(DECKS.externalUrl).toContain('/drive/folders/')
  })

  it('appears under Consulting, not Resume & Applications', () => {
    const consulting = filterResources(ALL, { search: '', category: 'Consulting' })
    expect(titles(consulting)).toContain('The Strategy Syndicate – Session Decks')
    expect(titles(consulting)).toContain('Case Books')
    expect(titles(consulting)).not.toContain('IIM Resume Template')
  })

  it('adds no new category chip — Consulting already exists', () => {
    expect(deriveCategories(ALL)).toEqual(['All', 'Consulting', 'Resume & Applications'])
  })

  it('is found by the search terms the spec lists', () => {
    for (const term of ['Strategy Syndicate', 'Session Decks', 'strategy syndicate',
      'session decks', 'The Strategy Syndicate', 'Case Preparation']) {
      expect(titles(filterResources(ALL, { search: term, category: 'All' })), term)
        .toContain('The Strategy Syndicate – Session Decks')
    }
  })

  it('leaves the existing resources reachable exactly as before', () => {
    expect(titles(filterResources(ALL, { search: 'case books', category: 'All' }))).toEqual(['Case Books'])
    expect(titles(filterResources(ALL, { search: 'IIM', category: 'All' }))).toEqual(['IIM Resume Template'])
  })
})
