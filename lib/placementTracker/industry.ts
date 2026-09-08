// The Industry field is a searchable dropdown of common industries plus a
// custom escape hatch. See customChoice.ts for why only the resolved value
// is stored rather than a preset plus a separate custom column.

import { createChoiceHelpers } from './customChoice'

export const INDUSTRY_OPTIONS = [
  'Consulting',
  'Information Technology / Software',
  'Banking',
  'Financial Services',
  'Investment Banking',
  'Private Equity',
  'Venture Capital',
  'Asset Management',
  'Accounting & Audit',
  'FMCG',
  'E-commerce',
  'Retail',
  'Marketing & Advertising',
  'Media & Entertainment',
  'Manufacturing',
  'Automobile',
  'Energy',
  'Healthcare & Pharmaceuticals',
  'Biotechnology',
  'Telecommunications',
  'Real Estate',
  'Logistics & Supply Chain',
  'Aviation',
  'Hospitality & Tourism',
  'Education',
  'Government / Public Sector',
  'Non-profit / Social Impact',
  'Legal Services',
  'Insurance',
] as const

export const OTHER_INDUSTRY = 'Other'

const helpers = createChoiceHelpers(INDUSTRY_OPTIONS, OTHER_INDUSTRY)

// 'Other' sits last, after the domain list, because it's an escape hatch
// rather than a peer of the real categories.
export const INDUSTRY_SELECT_OPTIONS = helpers.selectOptions
export const resolveIndustry = helpers.resolve
export const splitIndustry = helpers.split
export const filterIndustries = helpers.filter
export const canAddCustomIndustry = helpers.canAddCustom
