import { describe, expect, it } from 'vitest'
import {
  LOCATION_OPTIONS, LOCATION_SELECT_OPTIONS, OTHER_LOCATION,
  canAddCustomLocation, filterLocations, resolveLocation, splitLocation,
} from '@/lib/placementTracker/location'

describe('LOCATION_SELECT_OPTIONS', () => {
  it('offers every hub plus the custom escape hatch, last', () => {
    expect(LOCATION_SELECT_OPTIONS).toHaveLength(LOCATION_OPTIONS.length + 1)
    expect(LOCATION_SELECT_OPTIONS[LOCATION_SELECT_OPTIONS.length - 1]).toBe(OTHER_LOCATION)
  })

  it('includes the hubs the spec asked for, and Remote', () => {
    for (const hub of ['Bengaluru', 'Mumbai', 'Delhi', 'Gurgaon', 'Noida', 'Remote']) {
      expect(LOCATION_SELECT_OPTIONS).toContain(hub)
    }
  })

  it('has no duplicates', () => {
    expect(new Set(LOCATION_SELECT_OPTIONS).size).toBe(LOCATION_SELECT_OPTIONS.length)
  })
})

describe('resolveLocation', () => {
  it('uses the chosen preset directly', () => {
    expect(resolveLocation('Bengaluru', '')).toBe('Bengaluru')
    expect(resolveLocation('Bengaluru', 'ignored')).toBe('Bengaluru')
  })

  it('uses the trimmed custom value when Other is chosen', () => {
    expect(resolveLocation(OTHER_LOCATION, '  Coimbatore  ')).toBe('Coimbatore')
  })

  it('is empty when nothing has been chosen', () => {
    expect(resolveLocation('', '')).toBe('')
  })
})

describe('splitLocation', () => {
  it('recovers every preset from a stored value', () => {
    for (const option of LOCATION_OPTIONS) {
      expect(splitLocation(option)).toEqual({ choice: option, custom: '' })
    }
  })

  it('treats an unrecognised location as a custom one', () => {
    expect(splitLocation('Coimbatore')).toEqual({ choice: OTHER_LOCATION, custom: 'Coimbatore' })
  })

  it('normalises case and padding back onto the matching preset', () => {
    expect(splitLocation('  bengaluru ')).toEqual({ choice: 'Bengaluru', custom: '' })
  })

  it('leaves an unset location unset rather than defaulting to Other', () => {
    expect(splitLocation('')).toEqual({ choice: '', custom: '' })
    expect(splitLocation('   ')).toEqual({ choice: '', custom: '' })
  })

  it('round-trips every preset and a custom value unchanged', () => {
    for (const location of [...LOCATION_OPTIONS, 'Coimbatore', 'Singapore']) {
      const { choice, custom } = splitLocation(location)
      expect(resolveLocation(choice, custom)).toBe(location)
    }
  })

  // The applications list renders this column directly, so it must never
  // hold the literal "Other".
  it('stores the real location name, never the literal "Other"', () => {
    const { choice, custom } = splitLocation('Coimbatore')
    expect(resolveLocation(choice, custom)).toBe('Coimbatore')
  })
})

describe('filterLocations', () => {
  it('returns everything for an empty query', () => {
    expect(filterLocations('')).toEqual(LOCATION_SELECT_OPTIONS)
    expect(filterLocations('   ')).toEqual(LOCATION_SELECT_OPTIONS)
  })

  it('matches case-insensitively on any part of the name', () => {
    expect(filterLocations('del')).toContain('Delhi')
    expect(filterLocations('BENGAL')).toContain('Bengaluru')
  })

  it('returns nothing when there is no match', () => {
    expect(filterLocations('zzzzz')).toEqual([])
  })
})

describe('canAddCustomLocation', () => {
  it('offers to add a genuinely new value', () => {
    expect(canAddCustomLocation('Coimbatore')).toBe(true)
  })

  it('does not offer to add something the list already has', () => {
    expect(canAddCustomLocation('Mumbai')).toBe(false)
    expect(canAddCustomLocation('  mumbai  ')).toBe(false)
    expect(canAddCustomLocation(OTHER_LOCATION)).toBe(false)
  })

  it('does not offer to add nothing', () => {
    expect(canAddCustomLocation('')).toBe(false)
    expect(canAddCustomLocation('   ')).toBe(false)
  })
})
