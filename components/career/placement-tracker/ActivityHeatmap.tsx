'use client'

// Contribution-style activity heatmap for the Placement Tracker dashboard.
// Reads the same `applications` array every other tab derives from, so
// adding, editing, or deleting an application updates it with no extra
// fetching or cache of its own.

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { GlassCard } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  ACTIVITY_PERIODS, DEFAULT_ACTIVITY_PERIOD, buildActivityGrid, computeActivityInsight,
  computeActivitySummary, computeHeatmapLayout, groupByDay, heatmapModeFor,
  buildMonthRows, parseIsoDay, resolvePeriodRange, DAYS_IN_LONGEST_MONTH,
  type ActivityDay, type ActivityGrid, type ActivityPeriod, type HeatmapLayout, type MonthRow,
} from '@/lib/placementTracker/activity'
import type { PlacementApplication } from '@/lib/placementTracker/types'

// Progressively stronger indigo, matching the tracker's accent. Level 0 uses
// the same neutral surface as every other empty slot in the app so a quiet
// day reads as background rather than as data.
const LEVEL_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-[var(--muted-surface)] border border-white/[0.04]',
  1: 'bg-indigo-500/25',
  2: 'bg-indigo-500/45',
  3: 'bg-indigo-500/70',
  4: 'bg-indigo-500',
}

// Sunday-first, matching the Academic Calendar's grid elsewhere in the app.
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

// Width the row labels need — weekdays in the contribution view, month names
// in the month-row view.
const ROW_LABEL_WIDTH = 34

// Day-of-month markers on the month-row axis. Every day would be unreadable
// at this cell size, and these are enough to locate a column.
const DAY_AXIS_MARKS = [1, 5, 10, 15, 20, 25, 30]

// Approximate rendered height, used only to decide whether the tooltip has
// room above the cell or must flip below it.
const TOOLTIP_HEIGHT = 46

function formatFullDate(iso: string): string {
  return parseIsoDay(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

function describeDay(day: ActivityDay): string {
  if (day.count === 0) return 'No applications submitted'
  return `${day.count} application${day.count === 1 ? '' : 's'} submitted`
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: 'var(--muted-surface)' }}>
      <div className="text-[11px] text-muted-foreground mb-0.5">{label}</div>
      <div className="text-lg font-bold font-display leading-tight">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  )
}

export function ActivityHeatmap({ applications }: { applications: PlacementApplication[] }) {
  const [period, setPeriod] = useState<ActivityPeriod>(DEFAULT_ACTIVITY_PERIOD)
  // One shared tooltip driven by hover state rather than a tooltip instance
  // per cell — a year's grid is ~370 cells, and mounting a popover for each
  // would cost far more than this feature is worth.
  const [hovered, setHovered] = useState<{ day: ActivityDay; x: number; y: number; below: boolean } | null>(null)
  // Cell sizing depends on how much room there actually is, so the width is
  // measured rather than assumed — the card is a different size on a phone,
  // a tablet and a desktop, and the period selector changes how many columns
  // have to fit into it.
  const containerRef = useRef<HTMLDivElement>(null)
  const [availableWidth, setAvailableWidth] = useState(0)

  useEffect(() => {
    const node = containerRef.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(entries => {
      setAvailableWidth(entries[0].contentRect.width)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const mode = heatmapModeFor(period)

  const { grid, monthRows, summary, insight } = useMemo(() => {
    const now = new Date()
    const range = resolvePeriodRange(period, applications, now)
    const byDay = groupByDay(applications)
    const summary = computeActivitySummary(applications, range, now)
    return {
      grid: buildActivityGrid(range, byDay),
      monthRows: buildMonthRows(range, byDay),
      summary,
      insight: computeActivityInsight(applications, summary, now),
    }
  }, [applications, period])

  // Contribution view columns are weeks; the calendar view's are weekdays.
  // Until the first measurement lands, fall back to a width that produces the
  // original density rather than briefly rendering something enormous.
  const columns = mode === 'month_rows' ? DAYS_IN_LONGEST_MONTH : grid.weeks.length
  const measuredWidth = availableWidth || 720
  const layout = computeHeatmapLayout(columns, Math.max(0, measuredWidth - ROW_LABEL_WIDTH), mode)

  const onCellEnter = (day: ActivityDay, e: React.MouseEvent<HTMLDivElement>) => {
    if (!day.inRange) return
    const rect = e.currentTarget.getBoundingClientRect()
    // Clamped horizontally so a cell near either edge doesn't push its
    // tooltip off-screen, and flipped below the cell when there isn't room
    // above — same behaviour as the GitHub graph.
    const halfWidth = 90
    const x = Math.min(Math.max(rect.left + rect.width / 2, halfWidth + 4), window.innerWidth - halfWidth - 4)
    const below = rect.top < TOOLTIP_HEIGHT + 12
    setHovered({ day, x, y: below ? rect.bottom : rect.top, below })
  }

  return (
    <GlassCard className="p-5 relative">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold font-display">Application Activity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track how consistently you are applying to opportunities.
          </p>
        </div>
        <Select value={period} onValueChange={v => setPeriod(v as ActivityPeriod)}>
          <SelectTrigger className="h-9 text-xs sm:w-44 shrink-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACTIVITY_PERIODS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-5">
        <Metric label="This Month" value={String(summary.thisMonth)} />
        <Metric label="Last Month" value={String(summary.lastMonth)} />
        <Metric
          label="Best Month"
          value={summary.bestMonth ? summary.bestMonth.label : '—'}
          hint={summary.bestMonth ? `${summary.bestMonth.count} application${summary.bestMonth.count === 1 ? '' : 's'}` : 'No activity yet'}
        />
        <Metric
          label="Active Weeks"
          value={`${summary.activeWeeks.active} of ${summary.activeWeeks.total}`}
          hint="active weeks"
        />
      </div>

      {/* Measured so cell size can adapt; horizontal scroll only kicks in
          when the grid genuinely can't fit, rather than by default. */}
      <div ref={containerRef} className="overflow-x-auto pb-1 -mx-1 px-1">
        {/* Centred when the grid is narrower than the card: a short range
            leaves space either way, and splitting it reads as deliberate
            rather than as a chart stranded on the left. */}
        <div className="flex justify-center min-w-max">
          {mode === 'month_rows'
            ? <MonthRowsGrid rows={monthRows} layout={layout} onCellEnter={onCellEnter} onCellLeave={() => setHovered(null)} />
            : <ContributionGrid grid={grid} layout={layout} onCellEnter={onCellEnter} onCellLeave={() => setHovered(null)} />}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[10px] text-muted-foreground/80">Less</span>
        {([0, 1, 2, 3, 4] as const).map(level => (
          <div
            key={level}
            className={`rounded-[2px] ${LEVEL_CLASS[level]}`}
            style={{ width: Math.min(14, layout.cellSize), height: Math.min(14, layout.cellSize) }}
          />
        ))}
        <span className="text-[10px] text-muted-foreground/80">More</span>
      </div>

      <p className="text-xs text-muted-foreground mt-4 pt-4 border-t" style={{ borderColor: 'var(--divider)' }}>
        {insight}
      </p>

      {hovered && typeof document !== 'undefined' && createPortal(
        // Portalled to the body on purpose. GlassCard sets `backdrop-blur`,
        // and any backdrop-filter/transform/filter ancestor becomes the
        // containing block for `position: fixed` children — so rendering
        // this inline made the tooltip land offset by the card's own
        // position instead of at the cursor. Same trap, and same fix, as
        // UploadModalShell documents.
        <div
          className={`fixed z-50 pointer-events-none whitespace-nowrap px-2.5 py-1.5 rounded-lg text-[11px] shadow-2xl -translate-x-1/2 ${hovered.below ? '' : '-translate-y-full'}`}
          style={{
            left: hovered.x,
            top: hovered.y + (hovered.below ? 8 : -8),
            background: 'hsl(var(--card))',
            border: '1px solid var(--divider)',
          }}
          role="status"
        >
          <div className="font-medium text-foreground">{formatFullDate(hovered.day.iso)}</div>
          <div className="text-muted-foreground">{describeDay(hovered.day)}</div>
        </div>,
        document.body,
      )}
    </GlassCard>
  )
}

// Weeks as columns, weekdays as rows — the dense year-at-a-glance view.
function ContributionGrid({
  grid, layout, onCellEnter, onCellLeave,
}: {
  grid: ActivityGrid
  layout: HeatmapLayout
  onCellEnter: (day: ActivityDay, e: React.MouseEvent<HTMLDivElement>) => void
  onCellLeave: () => void
}) {
  const column = layout.cellSize + layout.gap
  return (
    <div className="inline-flex gap-2 min-w-max">
      <div className="flex flex-col shrink-0 pt-[18px]" style={{ gap: layout.gap, width: ROW_LABEL_WIDTH }}>
        {DAY_LABELS.map((label, i) => (
          <div
            key={i}
            className="text-[9px] text-muted-foreground/70 text-right pr-1.5 flex items-center justify-end"
            style={{ height: layout.cellSize }}
          >
            {label}
          </div>
        ))}
      </div>

      <div>
        <div className="relative h-[18px]" style={{ width: layout.gridWidth }}>
          {grid.monthLabels.map(m => (
            <span key={m.key} className="absolute text-[10px] text-muted-foreground/80" style={{ left: m.columnIndex * column }}>
              {m.label}
            </span>
          ))}
        </div>
        <div className="flex" style={{ gap: layout.gap }} role="grid" aria-label="Application activity by day">
          {grid.weeks.map(week => (
            <div key={week.key} className="flex flex-col" style={{ gap: layout.gap }} role="row">
              {week.days.map(day => (
                <ActivityCell key={day.iso} day={day} size={layout.cellSize} onEnter={onCellEnter} onLeave={onCellLeave} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// One compact row per month, days running 1st -> 31st left to right. A month
// is only ~31 cells: a week-column grid would use a fifth of the card's
// width, and a calendar grid would spend the height on oversized cells. This
// keeps the day cell the same compact object it is in the year view while
// still filling the row.
function MonthRowsGrid({
  rows, layout, onCellEnter, onCellLeave,
}: {
  rows: MonthRow[]
  layout: HeatmapLayout
  onCellEnter: (day: ActivityDay, e: React.MouseEvent<HTMLDivElement>) => void
  onCellLeave: () => void
}) {
  const column = layout.cellSize + layout.gap
  return (
    <div className="inline-flex gap-2">
      <div className="flex flex-col shrink-0 pt-[16px]" style={{ gap: layout.gap, width: ROW_LABEL_WIDTH }}>
        {rows.map(row => (
          <div
            key={row.key}
            className="text-[10px] text-muted-foreground/80 text-right pr-1.5 flex items-center justify-end"
            style={{ height: layout.cellSize }}
          >
            {row.label}
          </div>
        ))}
      </div>

      <div>
        {/* Day-of-month axis, so a cell can be located without hovering. */}
        <div className="relative h-[16px]" style={{ width: layout.gridWidth }}>
          {DAY_AXIS_MARKS.map(day => (
            <span
              key={day}
              className="absolute text-[9px] text-muted-foreground/70 text-center"
              style={{ left: (day - 1) * column, width: layout.cellSize }}
            >
              {day}
            </span>
          ))}
        </div>
        <div className="flex flex-col" style={{ gap: layout.gap }} role="grid" aria-label="Application activity by day">
          {rows.map(row => (
            <div key={row.key} className="flex" style={{ gap: layout.gap }} role="row">
              {row.days.map(day => (
                <ActivityCell key={day.iso} day={day} size={layout.cellSize} onEnter={onCellEnter} onLeave={onCellLeave} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ActivityCell({
  day, size, onEnter, onLeave,
}: {
  day: ActivityDay
  size: number
  onEnter: (day: ActivityDay, e: React.MouseEvent<HTMLDivElement>) => void
  onLeave: () => void
}) {
  if (!day.inRange) {
    return <div style={{ width: size, height: size }} className="rounded-[2px] opacity-0" aria-hidden="true" />
  }
  return (
    <div
      role="gridcell"
      aria-label={`${formatFullDate(day.iso)}: ${describeDay(day)}`}
      onMouseEnter={e => onEnter(day, e)}
      onMouseLeave={onLeave}
      style={{ width: size, height: size, borderRadius: size >= 16 ? 4 : 2 }}
      className={`transition-all duration-150 hover:ring-2 hover:ring-indigo-400/60 ${LEVEL_CLASS[day.level]}`}
    />
  )
}
