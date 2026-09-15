import { describe, expect, it } from 'vitest'
import { deriveCategories, filterResources } from '@/lib/careerResources/filter'
import type { CareerResource } from '@/lib/careerResources/types'

const NEW: CareerResource = {
  id: '8', title: 'Action Verbs – CV 101 Edition',
  description: 'A practical guide to using stronger, more specific action verbs in resumes. Helps students replace vague task statements with precise language that communicates ownership, contribution, improvement, and results while keeping the wording accurate and credible.',
  category: 'Resume & Applications', resourceType: 'website',
  externalUrl: 'https://drive.google.com/file/d/1bYO_Lg_kRlTgDzJy0gfJ2zCLB3TTEYL2/view?usp=sharing',
  actionLabel: 'View Guide', thumbnailUrl: null,
  tags: ['Resume','CV','Action Verbs','Resume Writing','Applications','Career','Consulting','MBA'], sortOrder: 8,
}
const IIM: CareerResource = { id:'1', title:'IIM Resume Template', description:'A professional resume template.', category:'Resume & Applications', resourceType:'google_doc', externalUrl:'x', actionLabel:'Open Template', thumbnailUrl:null, tags:['Resume'], sortOrder:1 }
const CONSULT: CareerResource = { id:'2', title:'Consulting Companies Database', description:'A curated database.', category:'Consulting', resourceType:'google_sheet', externalUrl:'x', actionLabel:'Open Database', thumbnailUrl:null, tags:['Consulting'], sortOrder:0 }
const ALL = [IIM, CONSULT, NEW]
const titles = (r: CareerResource[]) => r.map(x => x.title)

describe('Action Verbs resource', () => {
  it('is listed under the Resume & Applications category filter', () => {
    const shown = filterResources(ALL, { search: '', category: 'Resume & Applications' })
    expect(titles(shown)).toContain('Action Verbs – CV 101 Edition')
    expect(titles(shown)).toContain('IIM Resume Template')
    expect(titles(shown)).not.toContain('Consulting Companies Database')
  })

  it('needs no new category chip — Resume & Applications already exists', () => {
    expect(deriveCategories(ALL)).toEqual(['All', 'Consulting', 'Resume & Applications'])
  })

  it('is found by every search term the spec lists', () => {
    for (const term of ['Action Verbs', 'CV 101', 'action verbs', 'cv 101', 'Resume Writing', 'MBA']) {
      expect(titles(filterResources(ALL, { search: term, category: 'All' })), term)
        .toContain('Action Verbs – CV 101 Edition')
    }
  })

  it('leaves the existing resources reachable exactly as before', () => {
    expect(titles(filterResources(ALL, { search: 'consulting companies', category: 'All' })))
      .toEqual(['Consulting Companies Database'])
    expect(titles(filterResources(ALL, { search: 'IIM', category: 'All' })))
      .toEqual(['IIM Resume Template'])
  })
})
