// The Location field is a searchable dropdown of common placement hubs plus
// a custom escape hatch. Same shape as Industry — see customChoice.ts for
// why only the resolved value is stored.

import { createChoiceHelpers } from './customChoice'

export const LOCATION_OPTIONS = [
  'Bengaluru',
  'Mumbai',
  'Delhi',
  'Gurgaon',
  'Noida',
  'Hyderabad',
  'Chennai',
  'Pune',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Chandigarh',
  'Dehradun',
  'Kochi',
  'Remote',
] as const

export const OTHER_LOCATION = 'Other'

const helpers = createChoiceHelpers(LOCATION_OPTIONS, OTHER_LOCATION)

export const LOCATION_SELECT_OPTIONS = helpers.selectOptions
export const resolveLocation = helpers.resolve
export const splitLocation = helpers.split
export const filterLocations = helpers.filter
export const canAddCustomLocation = helpers.canAddCustom
