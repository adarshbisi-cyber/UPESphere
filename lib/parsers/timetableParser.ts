// Parses a text-based weekly scheduler/timetable PDF (day columns × time
// grid) into structured class slots. Each cell in the source renders as three
// stacked text runs at the same x — "HH:MM - HH:MM", subject name, room — so
// the parser clusters items into day columns by x-position, then walks each
// column top-to-bottom grouping runs into (time, subject, room) triples.

import type { TextItem } from './types'

export interface TimetableSlot {
  day: string       // 'Monday' … 'Sunday'
  date: string | null // 'DD/MM' if present in the header, else null
  startTime: string  // 'HH:MM'
  endTime: string    // 'HH:MM'
  subject: string
  room: string | null
}

const DAY_NAMES: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}
const DAY_HEADER_RE = /^(MON|TUE|WED|THU|FRI|SAT|SUN),?\s*(\d{1,2}\/\d{1,2})?$/i
const TIME_RANGE_RE = /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/
const HOUR_AXIS_RE = /^\d{1,2}:00$/ // bare hour-of-day gridline label, not a class slot
const COLUMN_GAP = 60 // pt — min x-gap between distinct day columns
const MARGIN_MAX_X = 50 // pt — everything left of this is the hour-axis/label margin, not a day column

function clusterColumns(xs: number[]): number[] {
  const sorted = Array.from(new Set(xs)).sort((a, b) => a - b)
  const clusters: number[] = []
  for (const x of sorted) {
    if (clusters.length === 0 || x - clusters[clusters.length - 1] > COLUMN_GAP) clusters.push(x)
  }
  return clusters
}

export function parseTimetableItems(pages: TextItem[][]): TimetableSlot[] {
  const items = pages.flat().filter(i => i.str.trim().length > 0)

  const headers = items
    .map(i => ({ item: i, m: i.str.trim().match(DAY_HEADER_RE) }))
    .filter((h): h is { item: TextItem; m: RegExpMatchArray } => !!h.m)

  if (headers.length === 0) return []

  // Body items sit to the LEFT of their header by a roughly constant offset
  // in this template; instead of hardcoding it, cluster all remaining items'
  // x-positions and match each cluster to its nearest header. Exclude the
  // hour-of-day axis labels (bare "08:00") — they sit close enough to the
  // first day column to merge into its cluster and hijack the anchor.
  const nonHeaderItems = items.filter(i =>
    !headers.some(h => h.item === i) &&
    !HOUR_AXIS_RE.test(i.str.trim()) &&
    i.x > MARGIN_MAX_X
  )
  const bodyAnchors = clusterColumns(nonHeaderItems.map(i => i.x))

  const columnForHeader = new Map<number, number>() // header x -> body anchor x
  for (const h of headers) {
    let best = bodyAnchors[0]
    let bestDist = Infinity
    for (const a of bodyAnchors) {
      const d = Math.abs(h.item.x - a)
      if (d < bestDist && a <= h.item.x + 10) { bestDist = d; best = a }
    }
    if (bestDist < 80) columnForHeader.set(h.item.x, best)
  }

  const slots: TimetableSlot[] = []

  for (const h of headers) {
    const anchor = columnForHeader.get(h.item.x)
    if (anchor === undefined) continue
    const dayKey = h.m[1].toLowerCase()
    const day = DAY_NAMES[dayKey]
    const date = h.m[2] ?? null

    const colItems = nonHeaderItems
      .filter(i => Math.abs(i.x - anchor) <= 20)
      .sort((a, b) => b.y - a.y)

    let k = 0
    while (k < colItems.length) {
      const timeMatch = colItems[k].str.trim().match(TIME_RANGE_RE)
      if (!timeMatch) { k++; continue }
      const startTime = timeMatch[1]
      const endTime = timeMatch[2]
      const subject = colItems[k + 1]?.str.trim() ?? null
      const nextIsTime = subject ? TIME_RANGE_RE.test(subject) : true
      if (!subject || nextIsTime) { k++; continue }
      const roomCandidate = colItems[k + 2]?.str.trim() ?? null
      const roomIsTime = roomCandidate ? TIME_RANGE_RE.test(roomCandidate) : true
      const room = roomCandidate && !roomIsTime ? roomCandidate : null

      slots.push({ day, date, startTime, endTime, subject, room })
      k += room ? 3 : 2
    }
  }

  return slots
}
