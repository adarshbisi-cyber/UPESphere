// Application Activity — the data behind the dashboard's contribution-style
// heatmap. Pure and date-injectable so every calendar edge case (year
// boundaries, partial months, retrospective and future-dated entries) is
// testable without a DOM or a frozen clock.
//
// Everything here keys off `applicationDate`, never createdAt/updatedAt: an
// application entered today for an interview you applied to in March must
// show up in March. That distinction is the whole point of the feature, so
// no function in this file takes a record timestamp at all.

import {
  DAYS_IN_LONGEST_MONTH, MONTH_NAMES, addDays, endOfMonth, monthIndex,
  parseIsoDay, startOfMonth, startOfWeek, toIsoDay,
  type DateRange, type HeatmapLayout, type HeatmapMode,
} from '@/lib/shared/calendarGrid'
import type { PlacementApplication } from './types'

// ============================================================
// Local-date helpers
//
// Now shared with Practice Together's calendar — see
// lib/shared/calendarGrid.ts. Re-exported here because this module's public
// API already promised them.
// ============================================================

export { toIsoDay, parseIsoDay } from '@/lib/shared/calendarGrid'

// ============================================================
// Activity sources
//
// The heatmap counts applications today, but the grid itself only needs
// "which days did something happen on". Keeping that behind an extractor
// means interviews, offers or assessments can be layered in later without
// touching the grid, the levels, or the summary maths.
// ============================================================

export type ActivitySource = (application: PlacementApplication) => string[]

export const applicationDates: ActivitySource = app => [app.applicationDate]

// Days map to the application ids that landed on them, not just to a count.
// The count is derived from the ids, so the two can't disagree, and a future
// "click a day to see which companies you applied to" affordance already has
// its data without another pass over the applications. Nothing renders these
// ids today.
export function groupByDay(
  applications: PlacementApplication[],
  source: ActivitySource = applicationDates,
): Map<string, string[]> {
  const byDay = new Map<string, string[]>()
  for (const app of applications) {
    for (const iso of source(app)) {
      if (!iso) continue
      byDay.set(iso, [...(byDay.get(iso) ?? []), app.id])
    }
  }
  return byDay
}

export function countByDay(
  applications: PlacementApplication[],
  source: ActivitySource = applicationDates,
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const [iso, ids] of Array.from(groupByDay(applications, source).entries())) {
    counts.set(iso, ids.length)
  }
  return counts
}

// ============================================================
// Periods
// ============================================================

export type ActivityPeriod = 'this_month' | 'last_3_months' | 'last_6_months' | 'last_12_months' | 'placement_season'

export const ACTIVITY_PERIODS: { value: ActivityPeriod; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'last_12_months', label: 'Last 12 Months' },
  { value: 'placement_season', label: 'Placement Season' },
]

export const DEFAULT_ACTIVITY_PERIOD: ActivityPeriod = 'last_12_months'

// The placement season is treated as the academic year that runs July to
// June, picking whichever one contains today. Kept as a named constant
// because it's a convention rather than a fact — change this one number if
// the university's season is defined differently.
const SEASON_START_MONTH = 6 // July (0-indexed)

export function resolvePeriodRange(
  period: ActivityPeriod,
  applications: PlacementApplication[],
  now: Date = new Date(),
): DateRange {
  let start: Date
  if (period === 'placement_season') {
    const seasonYear = now.getMonth() >= SEASON_START_MONTH ? now.getFullYear() : now.getFullYear() - 1
    start = new Date(seasonYear, SEASON_START_MONTH, 1)
  } else {
    const monthsBack = period === 'this_month' ? 0 : period === 'last_3_months' ? 2 : period === 'last_6_months' ? 5 : 11
    start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
  }

  // The window normally ends with the current month. It's stretched to cover
  // a future-dated application rather than silently hiding one — a student
  // who has already scheduled next month's application should still see it.
  let end = endOfMonth(now)
  for (const app of applications) {
    const date = parseIsoDay(app.applicationDate)
    if (date > end && date >= start) end = endOfMonth(date)
  }

  return { start, end }
}

// ============================================================
// Heatmap grid
// ============================================================

export interface ActivityDay {
  iso: string
  date: Date
  count: number
  level: 0 | 1 | 2 | 3 | 4
  inRange: boolean // padding days completing the first/last week
  // The applications that landed on this day. Carried so a day cell can
  // later become a filter into My Applications without reshaping the grid;
  // unused by the current UI.
  applicationIds: string[]
}

export interface ActivityWeek {
  key: string
  days: ActivityDay[]
}

export interface MonthLabel {
  key: string
  label: string
  columnIndex: number
}

export interface ActivityGrid {
  weeks: ActivityWeek[]
  monthLabels: MonthLabel[]
  totalInRange: number
}

export function intensityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0
  if (count >= 4) return 4
  return count as 1 | 2 | 3
}

export function buildActivityGrid(range: DateRange, byDay: Map<string, string[]>): ActivityGrid {
  const weeks: ActivityWeek[] = []
  const monthLabels: MonthLabel[] = []
  let totalInRange = 0

  // Pad out to whole weeks so every column has 7 rows; the padding days are
  // marked so the UI can render them as gaps rather than as empty activity.
  const gridStart = startOfWeek(range.start)
  let cursor = gridStart
  let lastLabelledMonth = -1

  while (cursor <= range.end) {
    const days: ActivityDay[] = []
    for (let i = 0; i < 7; i++) {
      const date = addDays(cursor, i)
      const iso = toIsoDay(date)
      const inRange = date >= range.start && date <= range.end
      const applicationIds = inRange ? byDay.get(iso) ?? [] : []
      const count = applicationIds.length
      if (inRange) totalInRange += count
      days.push({ iso, date, count, level: intensityLevel(count), inRange, applicationIds })
    }

    // Label a column when it introduces a new month, so labels line up with
    // where that month actually starts in the grid.
    const labelDay = days.find(d => d.inRange) ?? days[0]
    if (monthIndex(labelDay.date) !== lastLabelledMonth) {
      lastLabelledMonth = monthIndex(labelDay.date)
      monthLabels.push({
        key: `${labelDay.date.getFullYear()}-${labelDay.date.getMonth()}`,
        label: MONTH_NAMES[labelDay.date.getMonth()],
        columnIndex: weeks.length,
      })
    }

    weeks.push({ key: toIsoDay(cursor), days })
    cursor = addDays(cursor, 7)
  }

  return { weeks, monthLabels, totalInRange }
}

// ============================================================
// Summary metrics
// ============================================================

export interface ActivitySummary {
  thisMonth: number
  lastMonth: number
  bestMonth: { label: string; count: number } | null
  activeWeeks: { active: number; total: number }
}

function countInMonth(applications: PlacementApplication[], year: number, month: number): number {
  return applications.filter(a => {
    const d = parseIsoDay(a.applicationDate)
    return d.getFullYear() === year && d.getMonth() === month
  }).length
}

// Distinct calendar weeks of the current month containing at least one
// application, over the number of calendar weeks the month spans.
function activeWeeksThisMonth(applications: PlacementApplication[], now: Date): { active: number; total: number } {
  const first = startOfMonth(now)
  const last = endOfMonth(now)

  const allWeeks = new Set<string>()
  for (let d = new Date(first); d <= last; d = addDays(d, 1)) {
    allWeeks.add(toIsoDay(startOfWeek(d)))
  }

  const activeWeeks = new Set<string>()
  for (const app of applications) {
    const d = parseIsoDay(app.applicationDate)
    if (d < first || d > last) continue
    activeWeeks.add(toIsoDay(startOfWeek(d)))
  }

  return { active: activeWeeks.size, total: allWeeks.size }
}

export function computeActivitySummary(
  applications: PlacementApplication[],
  range: DateRange,
  now: Date = new Date(),
): ActivitySummary {
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // Best month is scoped to the selected range, not to all time.
  const monthCounts = new Map<number, number>()
  for (const app of applications) {
    const d = parseIsoDay(app.applicationDate)
    if (d < range.start || d > range.end) continue
    const idx = monthIndex(d)
    monthCounts.set(idx, (monthCounts.get(idx) ?? 0) + 1)
  }
  const best = Array.from(monthCounts.entries()).sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]

  return {
    thisMonth: countInMonth(applications, now.getFullYear(), now.getMonth()),
    lastMonth: countInMonth(applications, previous.getFullYear(), previous.getMonth()),
    bestMonth: best
      ? { label: `${MONTH_NAMES[best[0] % 12]} ${Math.floor(best[0] / 12)}`, count: best[1] }
      : null,
    activeWeeks: activeWeeksThisMonth(applications, now),
  }
}

// ============================================================
// Activity insight
// ============================================================

const RECENT_ACTIVITY_WINDOW_DAYS = 14

export function computeActivityInsight(
  applications: PlacementApplication[],
  summary: ActivitySummary,
  now: Date = new Date(),
): string {
  // Nothing tracked, or a single application with no history to compare it
  // against — say so rather than describing a trend that doesn't exist.
  if (applications.length <= 1) {
    return 'Keep building your application history to unlock more meaningful activity insights.'
  }

  const cutoff = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), -RECENT_ACTIVITY_WINDOW_DAYS)
  const hasRecent = applications.some(a => {
    const d = parseIsoDay(a.applicationDate)
    return d >= cutoff && d <= now
  })
  if (!hasRecent) {
    return `Time to explore new opportunities. You haven't submitted a tracked application in the last ${RECENT_ACTIVITY_WINDOW_DAYS} days.`
  }

  const { thisMonth, lastMonth, activeWeeks } = summary
  if (thisMonth > lastMonth) {
    return `You're building momentum. You applied to ${thisMonth} ${thisMonth === 1 ? 'company' : 'companies'} this month, compared with ${lastMonth} last month.`
  }
  if (thisMonth < lastMonth) {
    return `Your application activity has slowed down. You have applied to ${thisMonth} ${thisMonth === 1 ? 'company' : 'companies'} this month compared with ${lastMonth} last month.`
  }
  // Level with last month: consistency is only worth praising when the
  // applications are actually spread across the month.
  if (activeWeeks.active >= 2) {
    return `Great consistency. You've submitted applications across ${activeWeeks.active} different weeks this month.`
  }
  return 'Keep building your application history to unlock more meaningful activity insights.'
}


// ============================================================
// Layout
//
// A fixed cell size can't serve every period: 53 weeks of 11px squares fill
// the card, but the same squares over a five-week month leave the container
// almost entirely empty. Cell size and gap are therefore derived from how
// many columns actually have to fit and how much width there is to fit them
// into. Kept pure so the sizing rules are testable without a layout engine.
// ============================================================

export function heatmapModeFor(period: ActivityPeriod): HeatmapMode {
  return period === 'this_month' || period === 'last_3_months' ? 'month_rows' : 'contribution'
}

// The widest a month gets. Every month row is laid out on the same 31
// columns so the day axis lines up across rows regardless of month length.
export interface MonthRow {
  key: string
  label: string
  days: ActivityDay[] // always DAYS_IN_LONGEST_MONTH long; short months are padded
}

// Rows of days grouped by calendar month, oldest month first, each row
// running 1st -> 31st. Days past the end of a short month are emitted as
// out-of-range padding so every row stays column-aligned.
export function buildMonthRows(range: DateRange, byDay: Map<string, string[]>): MonthRow[] {
  const rows: MonthRow[] = []
  const spansYears = range.start.getFullYear() !== range.end.getFullYear()

  const cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1)
  const last = new Date(range.end.getFullYear(), range.end.getMonth(), 1)

  while (cursor <= last) {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days: ActivityDay[] = []
    for (let d = 1; d <= DAYS_IN_LONGEST_MONTH; d++) {
      const date = new Date(year, month, d)
      const iso = toIsoDay(date)
      const withinMonth = d <= daysInMonth
      const inRange = withinMonth && date >= range.start && date <= range.end
      const applicationIds = inRange ? byDay.get(iso) ?? [] : []
      days.push({
        iso: withinMonth ? iso : `${year}-${month}-pad${d}`,
        date, count: applicationIds.length, level: intensityLevel(applicationIds.length),
        inRange, applicationIds,
      })
    }

    rows.push({
      key: `${year}-${month}`,
      label: spansYears ? `${MONTH_NAMES[month]} ${String(year).slice(2)}` : MONTH_NAMES[month],
      days,
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return rows
}

export { computeHeatmapLayout, type HeatmapLayout, type HeatmapMode, DAYS_IN_LONGEST_MONTH } from '@/lib/shared/calendarGrid'
