// Shared behaviour for the "pick from a list, or type your own" fields
// (Industry, Location). Both need the same four operations, and both store
// only the *resolved* value in their single existing column rather than a
// preset plus a separate custom field.
//
// That choice matters: analytics and the applications list read these
// columns directly, so storing the literal 'Other' would collapse every
// custom entry into one meaningless bucket — the industry concentration
// observation would report "9 of your 12 applications are in other-related
// roles". Keeping the real name means "Fintech" groups and displays as
// Fintech, and `split` recovers the form state when the record is reopened
// for editing.

export interface ChoiceHelpers {
  /** Every preset, with the custom escape hatch last. */
  selectOptions: string[]
  /** Collapses form state into the single value that gets stored. */
  resolve: (choice: string, custom: string) => string
  /** Recovers form state from a stored value. */
  split: (stored: string) => { choice: string; custom: string }
  filter: (query: string) => string[]
  /** Whether a typed query is worth offering as a brand-new option. */
  canAddCustom: (query: string) => boolean
}

export function createChoiceHelpers(options: readonly string[], otherLabel: string): ChoiceHelpers {
  const selectOptions = [...options, otherLabel]

  return {
    selectOptions,

    resolve: (choice, custom) => (choice === otherLabel ? custom.trim() : choice),

    // Anything that isn't a preset must have come from the custom path —
    // including values differing only by case or padding, which are
    // normalised back onto the preset so editing one doesn't silently turn
    // it into a custom value.
    split: stored => {
      const trimmed = stored.trim()
      if (!trimmed) return { choice: '', custom: '' }
      const preset = options.find(o => o.toLowerCase() === trimmed.toLowerCase())
      if (preset) return { choice: preset, custom: '' }
      return { choice: otherLabel, custom: trimmed }
    },

    filter: query => {
      const q = query.trim().toLowerCase()
      return q ? selectOptions.filter(o => o.toLowerCase().includes(q)) : selectOptions
    },

    // An empty query has nothing to add, and one that already matches an
    // option would make the "add" row duplicate the list.
    canAddCustom: query => {
      const q = query.trim()
      if (!q) return false
      return !selectOptions.some(o => o.toLowerCase() === q.toLowerCase())
    },
  }
}
