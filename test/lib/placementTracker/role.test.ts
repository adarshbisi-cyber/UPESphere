import { describe, expect, it } from 'vitest'
import { resolveRole, splitRole } from '@/lib/placementTracker/role'
import { ROLE_CHOICES } from '@/lib/placementTracker/constants'

describe('resolveRole', () => {
  it('uses the chosen preset directly', () => {
    expect(resolveRole('Analyst', '')).toBe('Analyst')
    expect(resolveRole('Analyst', 'ignored')).toBe('Analyst')
  })

  it('uses the trimmed custom role when "Other" is chosen', () => {
    expect(resolveRole('Other', '  Growth Associate  ')).toBe('Growth Associate')
  })
})

describe('splitRole', () => {
  it('recovers a preset choice from a saved role', () => {
    for (const choice of ROLE_CHOICES) {
      expect(splitRole(choice)).toEqual({ choice, customRole: '' })
    }
  })

  it('treats an unrecognised role as a custom "Other" role', () => {
    expect(splitRole('Growth Associate')).toEqual({ choice: 'Other', customRole: 'Growth Associate' })
  })

  it('normalises case and padding back onto the matching preset', () => {
    expect(splitRole('  analyst ')).toEqual({ choice: 'Analyst', customRole: '' })
  })

  it('round-trips every preset and a custom role unchanged', () => {
    for (const role of [...ROLE_CHOICES, 'Growth Associate']) {
      const { choice, customRole } = splitRole(role)
      expect(resolveRole(choice, customRole)).toBe(role)
    }
  })
})
