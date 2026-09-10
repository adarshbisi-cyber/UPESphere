// Domain-free calendar-grid primitives, shared by the Placement Tracker's
// Application Activity heatmap and Practice Together's Practice Activity
// calendar. Both need the same date arithmetic and the same responsive cell
// sizing; only what they *count* differs, and that stays with each feature.
//
// Extracted rather than copied because the sizing rules in particular were
// tuned against real layouts (see the caps below) — two copies would drift
// the moment one was adjusted.

const pad = (n: number) => String(n).padStart(2, '0')

// applicationDate/scheduled_date are plain 'YYYY-MM-DD' calendar days with
// no timezone. new Date('2026-09-07') parses that as UTC midnight, which
// lands on the 6th for anyone west of Greenwich — so dates are always built
// explicitly from their parts and compared as strings.
export function toIsoDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseIsoDay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/** Sunday-start, matching the academic calendar's grid elsewhere in the app. */
export function startOfWeek(date: Date): Date {
  return addDays(date, -date.getDay())
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function monthIndex(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth()
}

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export interface DateRange {
  start: Date
  end: Date
}

export function isWithin(date: Date, range: DateRange): boolean {
  return date >= range.start && date <= range.end
}

// The widest a month gets. Month rows are laid out on the same 31 columns so
// the day axis lines up across rows regardless of month length.
export const DAYS_IN_LONGEST_MONTH = 31

// ============================================================
// Responsive sizing
//
// A fixed cell size can't serve every period: 53 weeks of 11px squares fill
// a card, but the same squares over a five-week month leave it almost
// empty. Cell size and gap are derived from how many columns must fit and
// how much width there is.
// ============================================================

export type HeatmapMode = 'month_rows' | 'contribution'

export interface HeatmapLayout {
  cellSize: number
  gap: number
  /** Total width the grid occupies, so the caller can centre it. */
  gridWidth: number
}

// Floors, below which a cell stops being readable and horizontal scrolling
// is the better trade. A month strip is only ~31 cells, so it can afford a
// higher floor and scroll on a phone; a year has to compress much further
// before scrolling becomes worse than shrinking.
const MIN_CELL: Record<HeatmapMode, number> = { month_rows: 14, contribution: 9 }

// Deliberately tight. Filling the width matters less than a day cell
// staying recognisably the same object across every period — it should not
// look four times bigger just because a shorter range was selected.
function maxCellFor(columns: number, mode: HeatmapMode): number {
  if (mode === 'month_rows') return 22 // ~31 days spread across the card
  if (columns <= 30) return 18 // ~6 months of week columns
  return 13 // a full year — the original density, which already worked
}

function gapFor(cellSize: number): number {
  if (cellSize >= 18) return 4
  if (cellSize >= 13) return 3
  return 2
}

export function computeHeatmapLayout(
  columns: number,
  availableWidth: number,
  mode: HeatmapMode = 'contribution',
): HeatmapLayout {
  if (columns <= 0) return { cellSize: MIN_CELL[mode], gap: 3, gridWidth: 0 }

  const maxCell = maxCellFor(columns, mode)
  // Solved against the gap the resulting size would itself imply: pick the
  // size first using a provisional gap, then settle on the matching gap.
  const provisionalGap = gapFor(maxCell)
  const fitted = Math.floor((availableWidth - (columns - 1) * provisionalGap) / columns)
  const cellSize = Math.max(MIN_CELL[mode], Math.min(maxCell, fitted))
  const gap = gapFor(cellSize)

  return { cellSize, gap, gridWidth: columns * cellSize + (columns - 1) * gap }
}
