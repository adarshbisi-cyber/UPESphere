// Pure search/filter logic for the Resources library — the catalogue is
// fetched once and filtered in memory (same pattern as
// lib/teamup/api.ts's filterTeams/filterStudents and Placement Tracker's
// ApplicationsTab), since re-querying Supabase per keystroke or filter
// click is unnecessary for a dataset this size.

import { ALL_CATEGORIES_FILTER } from './constants'
import type { CareerResource } from './types'

// Categories aren't a fixed enum (see the migration's comment) — the list
// of filter chips is derived from whatever's actually published, so a
// brand-new category typed into Supabase shows up with zero frontend
// changes. Sorted alphabetically for a stable, scannable order; "All"
// always leads.
export function deriveCategories(resources: CareerResource[]): string[] {
  const unique = Array.from(new Set(resources.map(r => r.category))).sort((a, b) => a.localeCompare(b))
  return [ALL_CATEGORIES_FILTER, ...unique]
}

export function filterResources(
  resources: CareerResource[],
  { search, category }: { search: string; category: string },
): CareerResource[] {
  const query = search.trim().toLowerCase()
  return resources.filter(r => {
    if (category !== ALL_CATEGORIES_FILTER && r.category !== category) return false
    if (!query) return true
    return (
      r.title.toLowerCase().includes(query) ||
      (r.description ?? '').toLowerCase().includes(query) ||
      r.category.toLowerCase().includes(query) ||
      r.tags.some(tag => tag.toLowerCase().includes(query))
    )
  })
}
