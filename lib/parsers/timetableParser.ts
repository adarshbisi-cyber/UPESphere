// Parses a text-based weekly scheduler/timetable PDF (day columns × time
// grid) into structured class slots.
//
// Two export shapes are supported:
//  1. The common case — each cell renders three stacked text runs at the
//     same x: "HH:MM - HH:MM", subject name, room. The parser clusters
//     items into day columns by x-position, then walks each column
//     top-to-bottom grouping runs into (time, subject, room) triples.
//  2. Some calendar-app exports (e.g. a printed weekly view) draw a
//     coloured box per class but never print its time range as text at
//     all — the cell is just (subject, room), and the box's height on the
//     page is the only record of how long the class runs. For a column
//     where no "HH:MM - HH:MM" text turns up at all, this parser instead
//     asks the caller's `TimetableRenderSampler` (see
//     `pdfText.createTimetableRenderSampler`, which renders the page to a
//     canvas) for that column's box extents, then converts those back to
//     times using the hour-of-day axis printed down the left margin.
//
//     That axis label's own y-position can't be trusted directly, though:
//     different export tools position the label differently relative to
//     the ruling line it names — flush with it, centred in the hour cell,
//     etc — and guessing wrong silently shifts every recovered time by the
//     same amount. So this parser also asks the sampler for the grid's own
//     ruling-line positions and works out, from *this specific PDF*, which
//     line each label actually points to, before trusting any of it.
//
//  3. Some exports are an agenda/list view rather than a weekly grid: no day
//     columns at all — just one column of "HH:MM-HH:MM" slots per day,
//     under a heading like "Monday / 07 / Sept 2026", every day stacked
//     vertically down the page. Time, subject, room etc. all share the same
//     x regardless of which day they belong to, so a slot's day is decided
//     by which day-heading's vertical band its y falls into, not by x at
//     all. Detail lines under a time range (subject, "Room : X", instructor,
//     course code, …) are recognised structurally — only "Room" is treated
//     specially, everything else not spoken for becomes the subject.
//
//     A close cousin of this shape prints the day/date/time heading and
//     ranges but never writes a class name or room into the file at all —
//     not hidden in an image, not in a colour code, nothing; the export
//     tool simply never wrote it. No amount of layout or pixel analysis
//     recovers data that was never in the document, so this parser doesn't
//     try — `looksLikeTimetableMissingClassNames` recognises that shape
//     (structurally, not by matching one specific file) so the calling UI
//     can tell the person *why* nothing came back instead of a generic
//     failure.

import type { ColumnRun, TextItem, TimetableRenderSampler } from './types'

export interface TimetableSlot {
  day: string       // 'Monday' … 'Sunday'
  date: string | null // 'DD/MM' if present in the header, else null
  startTime: string  // 'HH:MM'
  endTime: string    // 'HH:MM'
  subject: string
  room: string | null
  // Not extracted by this parser (no source data for it yet) — optional so
  // display components can show it "when available" without every call site
  // needing to set it.
  faculty?: string | null
}

export interface ParseTimetableOptions {
  // Supplies the rendered page for columns whose export has no per-slot
  // time text (see file header, shape 2). Omit to skip that fallback —
  // those columns then yield no slots, same as before it existed.
  sampler?: TimetableRenderSampler
}

const DAY_NAMES: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}
const DAY_HEADER_RE = /^(MON|TUE|WED|THU|FRI|SAT|SUN),?\s*(\d{1,2}\/\d{1,2})?$/i
const FULL_DAY_NAME_RE = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i
const TIME_RANGE_RE = /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/
const HOUR_AXIS_RE = /^(\d{1,2}):00$/ // bare hour-of-day gridline label, not a class slot
const DATE_OF_MONTH_RE = /^\d{1,2}$/ // bare "07" day-of-month, split onto its own line
const MONTH_YEAR_RE = /^([A-Za-z]{3,9})\.?\s+\d{4}$/ // "Sept 2026"
const ROOM_LABEL_RE = /^room\s*:?\s*(.+)$/i // "Room : K1409" (however many text runs it was split across)
const MONTH_ABBR_TO_NUM: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}
const COLUMN_GAP = 60 // pt — min x-gap between distinct day columns
const MARGIN_MAX_X = 50 // pt — everything left of this is the hour-axis/label margin, not a day column
// Text runs within this many points of each other's y count as the same
// visual line (a label and its value can arrive as separate runs at
// virtually — not always exactly — the same y).
const LINE_GROUP_TOLERANCE_PT = 2

// A day column's items sit within this many points of its computed anchor —
// wide enough to catch a subject line wrapped slightly wider than the room
// line below it, narrow enough not to bleed into the next day column.
const COLUMN_ITEM_TOLERANCE = 20
// Coloured boxes have inner padding, so a slot's text baselines sit a bit
// inside the box's top/bottom edges rather than flush with them.
const RUN_TEXT_PAD_PT = 10
// When matching hour-axis labels to detected ruling lines, a candidate shift
// has to land within this many points of a real line to count as a match —
// small enough to reject coincidental alignment, big enough for render
// anti-aliasing / line-centre rounding.
const GRIDLINE_MATCH_TOLERANCE_PT = 3

type PageItem = TextItem & { page: number }

function clusterColumns(xs: number[]): number[] {
  const sorted = Array.from(new Set(xs)).sort((a, b) => a - b)
  const clusters: number[] = []
  for (const x of sorted) {
    if (clusters.length === 0 || x - clusters[clusters.length - 1] > COLUMN_GAP) clusters.push(x)
  }
  return clusters
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

// Real timetables use 5-minute-granular start/end times — snapping to the
// nearest 5 absorbs the sub-minute noise in the pixel->time conversion.
function minutesToHHMM(minutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, minutes))
  const snapped = Math.round(clamped / 5) * 5
  return `${pad2(Math.floor(snapped / 60))}:${pad2(snapped % 60)}`
}

function linearFit(points: { y: number; minutes: number }[]): ((y: number) => number) | null {
  if (points.length < 2) return null
  const sorted = [...points].sort((a, b) => a.y - b.y)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  if (first.y === last.y) return null
  const slope = (last.minutes - first.minutes) / (last.y - first.y)
  return (y: number) => first.minutes + (y - first.y) * slope
}

// Works out where the hour-axis labels' ruling lines *actually* are on this
// specific PDF, rather than trusting the label text's own y-position (see
// file header). Tries every plausible constant vertical shift between a
// label and a detected gridline, and keeps whichever shift makes the most
// OTHER labels also land on a gridline — a wrong guess only explains a
// couple of labels by coincidence, the real shift explains (nearly) all of
// them, since the axis is evenly spaced.
function calibrateAxisFromGridlines(
  axisPoints: { y: number; minutes: number }[],
  gridlineYs: number[],
): ((y: number) => number) | null {
  if (axisPoints.length < 2 || gridlineYs.length < 2) return null

  const sortedByY = [...axisPoints].sort((a, b) => a.y - b.y)
  const first = sortedByY[0]
  const last = sortedByY[sortedByY.length - 1]
  const hoursApart = (last.minutes - first.minutes) / 60
  if (hoursApart === 0) return null
  const ptPerHour = Math.abs((last.y - first.y) / hoursApart)
  // A label should never sit more than half an hour-cell from the line it
  // names — bounding the search this way avoids the grid's own periodicity
  // (evenly-spaced lines) producing multiple equally-"valid" wraparound
  // shifts a whole cycle apart.
  const maxShift = ptPerHour / 2

  const reference = axisPoints[0]
  const candidateShifts = Array.from(new Set(gridlineYs.map(g => g - reference.y)))
    .filter(shift => Math.abs(shift) <= maxShift)

  const countMatches = (shift: number) =>
    axisPoints.filter(p => gridlineYs.some(g => Math.abs(g - (p.y + shift)) <= GRIDLINE_MATCH_TOLERANCE_PT)).length

  let bestShift = 0
  let bestScore = -1
  for (const shift of candidateShifts) {
    const score = countMatches(shift)
    if (score > bestScore) { bestScore = score; bestShift = shift }
  }

  // Require most labels to agree — otherwise this page's grid doesn't look
  // like the template we expect, and guessing would silently ship wrong
  // times. Better to skip the fallback for this column than that.
  if (bestScore < Math.ceil(axisPoints.length / 2)) return null

  return linearFit(axisPoints.map(p => ({ y: p.y + bestShift, minutes: p.minutes })))
}

// Shape-2 fallback: a column has no "HH:MM - HH:MM" text at all, so each
// class is just stacked (subject, [room]) text sitting inside a coloured
// box that `sampleColumnRuns` reported separately. Groups the column's text
// items by which box they physically fall inside, and reads times off the
// box's own extents instead of the text.
function slotsFromColorRuns(
  colItems: TextItem[], // this column's non-header items, sorted top-to-bottom
  runs: ColumnRun[],    // this column's coloured boxes, any order
  minutesAt: (y: number) => number,
  day: string,
  date: string | null,
): TimetableSlot[] {
  const orderedRuns = [...runs].sort((a, b) => b.topY - a.topY)
  const slots: TimetableSlot[] = []

  for (const run of orderedRuns) {
    const inside = colItems.filter(i => i.y <= run.topY + RUN_TEXT_PAD_PT && i.y >= run.bottomY - RUN_TEXT_PAD_PT)
    if (inside.length === 0) continue
    const room = inside.length >= 2 ? inside[inside.length - 1].str.trim() : null
    const subjectLines = room ? inside.slice(0, -1) : inside
    const subject = subjectLines.map(i => i.str.trim()).join(' ').trim()
    if (!subject) continue

    slots.push({
      day,
      date,
      startTime: minutesToHHMM(minutesAt(run.topY)),
      endTime: minutesToHHMM(minutesAt(run.bottomY)),
      subject,
      room,
    })
  }
  return slots
}

// Groups items into logical lines the way a reading person would: same y
// (within tolerance), ordered left-to-right. Needed because a single visual
// line sometimes arrives as more than one text run — e.g. a "Room :" label
// and its value are separate items that just happen to share a y.
function groupIntoLines(items: TextItem[]): TextItem[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x)
  const lines: TextItem[][] = []
  for (const item of sorted) {
    const last = lines[lines.length - 1]
    if (last && Math.abs(last[0].y - item.y) <= LINE_GROUP_TOLERANCE_PT) last.push(item)
    else lines.push([item])
  }
  return lines
}

function lineText(line: TextItem[]): string {
  return line.map(i => i.str.trim()).join(' ').replace(/\s+/g, ' ').trim()
}

// "07" + "Sept 2026" -> "07/09". Built from a generic month-name lookup, not
// any specific date — returns null rather than guess if either piece is
// missing or the month name doesn't resolve.
function buildDdMm(dayOfMonth: string | undefined, monthYear: string | undefined): string | null {
  if (!dayOfMonth || !monthYear) return null
  const monthMatch = monthYear.match(MONTH_YEAR_RE)
  if (!monthMatch) return null
  const monthNum = MONTH_ABBR_TO_NUM[monthMatch[1].slice(0, 3).toLowerCase()]
  const dayNum = parseInt(dayOfMonth, 10)
  if (!monthNum || !Number.isFinite(dayNum)) return null
  return `${pad2(dayNum)}/${pad2(monthNum)}`
}

// Shape 3 (see file header): a single-column agenda/list export. There's no
// day-column grid to anchor on by x — a day is just a heading ("Monday" /
// "07" / "Sept 2026") followed by that day's "HH:MM-HH:MM" slots stacked
// underneath it, so a slot's day is whichever heading's vertical band on the
// page its y falls into.
function parseAgendaListItems(items: PageItem[]): TimetableSlot[] {
  const dayHeaders = items
    .map(i => ({ item: i, m: i.str.trim().match(FULL_DAY_NAME_RE) }))
    .filter((h): h is { item: PageItem; m: RegExpMatchArray } => !!h.m)
    .sort((a, b) => a.item.page - b.item.page || b.item.y - a.item.y)

  const slots: TimetableSlot[] = []

  for (let i = 0; i < dayHeaders.length; i++) {
    const header = dayHeaders[i].item
    const next = dayHeaders[i + 1]?.item
    const dayKey = header.str.trim().slice(0, 3).toLowerCase()
    const day = DAY_NAMES[dayKey]
    if (!day) continue

    // This day's section: from its heading down to (but excluding) the next
    // heading, bounded to the same page — a new page restarts the "bottom
    // of page" boundary rather than bleeding into whatever's on it.
    const sectionItems = items.filter(it =>
      it.page === header.page &&
      it !== header &&
      it.y <= header.y &&
      (!next || next.page !== header.page || it.y > next.y)
    )

    const dayOfMonth = sectionItems.find(it => DATE_OF_MONTH_RE.test(it.str.trim()))?.str.trim()
    const monthYear = sectionItems.find(it => MONTH_YEAR_RE.test(it.str.trim()))?.str.trim()
    const date = buildDdMm(dayOfMonth, monthYear)

    const timeMarkers = sectionItems
      .map(it => ({ item: it, m: it.str.trim().match(TIME_RANGE_RE) }))
      .filter((t): t is { item: PageItem; m: RegExpMatchArray } => !!t.m)
      .sort((a, b) => b.item.y - a.item.y)

    for (let k = 0; k < timeMarkers.length; k++) {
      const marker = timeMarkers[k]
      const nextMarker = timeMarkers[k + 1]
      const detailItems = sectionItems.filter(it =>
        it !== marker.item &&
        !DATE_OF_MONTH_RE.test(it.str.trim()) &&
        !MONTH_YEAR_RE.test(it.str.trim()) &&
        it.y < marker.item.y &&
        (!nextMarker || it.y > nextMarker.item.y)
      )
      const lines = groupIntoLines(detailItems).map(lineText).filter(Boolean)
      if (lines.length === 0) continue

      const subject = lines[0]
      const roomLine = lines.slice(1).find(l => ROOM_LABEL_RE.test(l))
      const room = roomLine
        ? roomLine.match(ROOM_LABEL_RE)![1].trim() || null
        // No explicit "Room" label — fall back to the plain (subject, room)
        // convention the day-column shape uses, so a differently-worded
        // export still gets a room instead of nothing.
        : (lines.length >= 2 ? lines[1] : null)

      slots.push({ day, date, startTime: marker.m[1], endTime: marker.m[2], subject, room })
    }
  }

  return slots
}

// True if this looks like a timetable export (has day names and "HH:MM-HH:MM"
// ranges) where literally every piece of text on every page is structural —
// a day, a date, a time range, an axis label, or a column heading — meaning
// no class name or room was ever written into the file. This is a shape
// check, not a match against one specific export: any file whose only text
// is "day/date/time scaffolding" trips it, regardless of which tool made it.
export function looksLikeTimetableMissingClassNames(pages: TextItem[][]): boolean {
  const values = pages.flat().map(i => i.str.trim()).filter(Boolean)
  if (values.length === 0) return false

  const hasTimeRange = values.some(v => TIME_RANGE_RE.test(v))
  const hasDayIndicator = values.some(v => DAY_HEADER_RE.test(v) || FULL_DAY_NAME_RE.test(v))
  if (!hasTimeRange || !hasDayIndicator) return false

  const isStructural = (v: string) =>
    DAY_HEADER_RE.test(v) || FULL_DAY_NAME_RE.test(v) || TIME_RANGE_RE.test(v) ||
    HOUR_AXIS_RE.test(v) || DATE_OF_MONTH_RE.test(v) || MONTH_YEAR_RE.test(v) ||
    /^(DATE|TIME|ALL DAY)$/i.test(v)

  return values.every(isStructural)
}

export async function parseTimetableItems(
  pages: TextItem[][],
  options: ParseTimetableOptions = {},
): Promise<TimetableSlot[]> {
  const items: PageItem[] = pages.flatMap((page, pageIndex) =>
    page.filter(i => i.str.trim().length > 0).map(i => ({ ...i, page: pageIndex + 1 })),
  )

  const headers = items
    .map(i => ({ item: i, m: i.str.trim().match(DAY_HEADER_RE) }))
    .filter((h): h is { item: PageItem; m: RegExpMatchArray } => !!h.m)

  if (headers.length === 0) {
    // Not a day-column grid — try the single-column agenda/list shape (3)
    // instead of assuming there's nothing here.
    return parseAgendaListItems(items)
  }

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

  // Per-page hour-axis labels, for the shape-2 fallback — collected lazily
  // (most timetables never need this — this stays a no-op cost otherwise).
  const axisPointsByPage = new Map<number, { y: number; minutes: number }[]>()
  for (const i of items) {
    if (i.x > MARGIN_MAX_X) continue
    const m = i.str.trim().match(HOUR_AXIS_RE)
    if (!m) continue
    const arr = axisPointsByPage.get(i.page) ?? []
    arr.push({ y: i.y, minutes: parseInt(m[1], 10) * 60 })
    axisPointsByPage.set(i.page, arr)
  }
  // Calibration requires rendering the page (via the sampler), so it's built
  // at most once per page and reused across that page's columns.
  const calibrationByPage = new Map<number, Promise<((y: number) => number) | null>>()
  function getCalibration(page: number, sampler: TimetableRenderSampler) {
    let promise = calibrationByPage.get(page)
    if (!promise) {
      promise = (async () => {
        const axisPoints = axisPointsByPage.get(page) ?? []
        if (axisPoints.length < 2) return null
        const gridlineYs = await sampler.detectGridlineYs(page)
        return calibrateAxisFromGridlines(axisPoints, gridlineYs)
      })()
      calibrationByPage.set(page, promise)
    }
    return promise
  }

  const slots: TimetableSlot[] = []

  for (const h of headers) {
    const anchor = columnForHeader.get(h.item.x)
    if (anchor === undefined) continue
    const dayKey = h.m[1].toLowerCase()
    const day = DAY_NAMES[dayKey]
    const date = h.m[2] ?? null

    const colItems = nonHeaderItems
      .filter(i => Math.abs(i.x - anchor) <= COLUMN_ITEM_TOLERANCE && i.page === h.item.page)
      .sort((a, b) => b.y - a.y)

    const slotsBefore = slots.length
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

    // Shape-2 fallback: this column has content but none of it matched the
    // "HH:MM - HH:MM" pattern above — try recovering times from the
    // rendered page instead of silently dropping the whole day.
    const foundExplicitTimes = slots.length > slotsBefore
    if (!foundExplicitTimes && colItems.length > 0 && options.sampler) {
      const minutesAt = await getCalibration(h.item.page, options.sampler)
      if (minutesAt) {
        const runs = await options.sampler.sampleColumnRuns(h.item.page, anchor)
        if (runs.length > 0) slots.push(...slotsFromColorRuns(colItems, runs, minutesAt, day, date))
      }
    }
  }

  return slots
}
