import { describe, expect, it } from 'vitest'
import { deriveCategories, filterResources } from '@/lib/careerResources/filter'
import { RESOURCE_TYPE_META } from '@/lib/careerResources/constants'
import type { CareerResource } from '@/lib/careerResources/types'

// The exact values the migration stores.
const JOB_DESCRIPTIONS: CareerResource = {
  id: '9',
  title: 'Job Descriptions',
  description: 'A curated collection of job descriptions to help students understand role requirements, responsibilities, qualifications, skills, and expectations across different career opportunities. Use these descriptions to research target roles and align resumes and applications accordingly.',
  category: 'Resume & Applications',
  resourceType: 'folder',
  externalUrl: 'https://drive.google.com/drive/folders/1hA_IT7TkWcXps32TMt1yXJS_CrrnVI1z?usp=sharing',
  actionLabel: 'Explore Job Descriptions',
  thumbnailUrl: null,
  tags: ['Job Descriptions', 'JD', 'Careers', 'Roles', 'Resume', 'Applications', 'Job Research', 'Career Preparation'],
  sortOrder: 9,
}
const CASE_BOOKS: CareerResource = {
  id: '3', title: 'Case Books', description: 'A curated collection of case books.',
  category: 'Consulting', resourceType: 'folder', externalUrl: 'x',
  actionLabel: 'Explore Case Books', thumbnailUrl: null, tags: ['Consulting'], sortOrder: 3,
}
const IIM: CareerResource = {
  id: '1', title: 'IIM Resume Template', description: 'A professional resume template.',
  category: 'Resume & Applications', resourceType: 'google_doc', externalUrl: 'x',
  actionLabel: 'Open Template', thumbnailUrl: null, tags: ['Resume'], sortOrder: 1,
}
const ALL = [IIM, CASE_BOOKS, JOB_DESCRIPTIONS]
const titles = (r: CareerResource[]) => r.map(x => x.title)

describe('Job Descriptions resource', () => {
  it('renders as a collection, like the other Drive folders', () => {
    const meta = RESOURCE_TYPE_META[JOB_DESCRIPTIONS.resourceType]
    expect(meta.label).toBe('Collection')
    // Same type as Case Books, so the same folder icon.
    expect(JOB_DESCRIPTIONS.resourceType).toBe(CASE_BOOKS.resourceType)
    expect(meta.icon).toBe(RESOURCE_TYPE_META[CASE_BOOKS.resourceType].icon)
  })

  it('opens the exact Drive folder', () => {
    expect(JOB_DESCRIPTIONS.externalUrl)
      .toBe('https://drive.google.com/drive/folders/1hA_IT7TkWcXps32TMt1yXJS_CrrnVI1z?usp=sharing')
  })

  it('appears under the Resume & Applications filter, not Consulting', () => {
    const shown = filterResources(ALL, { search: '', category: 'Resume & Applications' })
    expect(titles(shown)).toContain('Job Descriptions')
    expect(titles(shown)).toContain('IIM Resume Template')
    expect(titles(shown)).not.toContain('Case Books')
  })

  it('adds no new category chip — Resume & Applications already exists', () => {
    expect(deriveCategories(ALL)).toEqual(['All', 'Consulting', 'Resume & Applications'])
  })

  it('is found by the search terms the spec lists', () => {
    for (const term of ['Job Descriptions', 'JD', 'jd', 'job descriptions', 'Job Research', 'Roles']) {
      expect(titles(filterResources(ALL, { search: term, category: 'All' })), term)
        .toContain('Job Descriptions')
    }
  })

  it('leaves the existing resources reachable exactly as before', () => {
    expect(titles(filterResources(ALL, { search: 'case books', category: 'All' }))).toEqual(['Case Books'])
    expect(titles(filterResources(ALL, { search: 'IIM', category: 'All' }))).toEqual(['IIM Resume Template'])
  })
})
