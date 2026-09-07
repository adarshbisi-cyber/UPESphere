// The Role field is a dropdown of common titles plus an "Other" escape
// hatch, but the database stores only the single resolved string (the
// `role` text column). These two functions are the round trip between those
// representations: `resolveRole` collapses the form state into what gets
// saved, and `splitRole` recovers the form state from a saved value so the
// edit flow reopens on the same option the user originally picked.

import { ROLE_CHOICES } from './constants'

export type RoleChoice = typeof ROLE_CHOICES[number] | 'Other'

export const ROLE_SELECT_OPTIONS: RoleChoice[] = [...ROLE_CHOICES, 'Other']

export function resolveRole(choice: RoleChoice, customRole: string): string {
  return choice === 'Other' ? customRole.trim() : choice
}

// A saved role that isn't one of the presets must have come from "Other" —
// including roles that only differ by case or padding, which are normalised
// back onto the preset so editing one doesn't silently turn it into a
// custom role.
export function splitRole(role: string): { choice: RoleChoice; customRole: string } {
  const trimmed = role.trim()
  const preset = ROLE_CHOICES.find(c => c.toLowerCase() === trimmed.toLowerCase())
  if (preset) return { choice: preset, customRole: '' }
  return { choice: 'Other', customRole: trimmed }
}
