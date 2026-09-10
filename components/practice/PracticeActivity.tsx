'use client'

// Practice Activity — consistency and mix, from completed sessions only.
//
// Deliberately not called a heatmap: a heatmap uses one colour's intensity
// to mean volume, whereas colour here means *practice type*. A day with
// three formats is drawn as three segments rather than one darker square,
// so the calendar answers "what am I practising" as well as "how often".

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Flame } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { PRACTICE_EMPTY_FILL, PRACTICE_TYPE_COLOR, practiceTypeLabel } from '@/lib/practiceTogether/constants'
import {
  DEFAULT_PRACTICE_PERIOD, PRACTICE_PERIODS, buildPracticeMonthRows, buildPracticeWeeks,
  completedSessionsFor, computeBalanceInsight, computePracticeMix, computePracticeSummary,
  groupPracticeByDay, practiceHeatmapModeFor, resolvePracticeRange,
  type PracticeDay, type PracticePeriod,
} from '@/lib/practiceTogether/practiceActivity'
import { computeHeatmapLayout, parseIsoDay, DAYS_IN_LONGEST_MONTH } from '@/lib/shared/calendarGrid'
import type { PracticeSession, PracticeType } from '@/lib/practiceTogether/types'

const ROW_LABEL_WIDTH = 34
const DAY_AXIS_MARKS = [1, 5, 10, 15, 20, 25, 30]
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const TOOLTIP_HEIGHT = 64

function formatFullDate(iso: string): string {
  return parseIsoDay(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

function Metric({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: 'var(--muted-surface)' }}>
      <div className="text-[11px] text-muted-foreground mb-0.5">{label}</div>
      <div className="text-lg font-bold font-display leading-tight inline-flex items-center gap-1.5">
        {icon}{value}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  )
}

// A day is drawn as vertical bands, one per type, sized by that type's share
// of the day. One format fills the cell; three split it.
function DayCell({
  day, size, onEnter, onLeave,
}: {
  day: PracticeDay
  size: number
  onEnter: (day: PracticeDay, e: React.MouseEvent<HTMLDivElement>) => void
  onLeave: () => void
}) {
  if (!day.inRange) {
    return <div style={{ width: size, height: size }} className="rounded-[2px] opacity-0" aria-hidden="true" />
  }
  const label = day.total === 0
    ? `${formatFullDate(day.iso)}: no practice`
    : `${formatFullDate(day.iso)}: ${day.total} practice session${day.total === 1 ? '' : 's'}`

  return (
    <div
      role="gridcell"
      aria-label={label}
      onMouseEnter={e => onEnter(day, e)}
      onMouseLeave={onLeave}
      style={{ width: size, height: size, borderRadius: size >= 16 ? 4 : 2, background: PRACTICE_EMPTY_FILL }}
      className="overflow-hidden flex transition-all duration-150 hover:ring-2 hover:ring-indigo-400/60 border border-white/[0.04]"
    >
      {day.segments.map(seg => (
        <div
          key={seg.type}
          style={{ background: PRACTICE_TYPE_COLOR[seg.type].fill, width: `${(seg.count / day.total) * 100}%` }}
        />
      ))}
    </div>
  )
}

export function PracticeActivity({ sessions, userId }: { sessions: PracticeSession[]; userId: string }) {
  const [period, setPeriod] = useState<PracticePeriod>(DEFAULT_PRACTICE_PERIOD)
  const [hovered, setHovered] = useState<{ day: PracticeDay; x: number; y: number; below: boolean } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [availableWidth, setAvailableWidth] = useState(0)

  useEffect(() => {
    const node = containerRef.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(entries => setAvailableWidth(entries[0].contentRect.width))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const mode = practiceHeatmapModeFor(period)

  const { rows, weeks, monthLabels, summary, mix, balance, completedCount } = useMemo(() => {
    const now = new Date()
    const completed = completedSessionsFor(sessions, userId)
    const range = resolvePracticeRange(period, now)
    const byDay = groupPracticeByDay(completed)
    // The calendar, the mix and the balance nudge describe the selected
    // window. The summary cards deliberately do NOT: "This Month" and "This
    // Week" name their own absolute windows, so filtering them by the
    // period selector made a card labelled This Month report this
    // month ∩ this week. Same reasoning as the streak below.
    const inRange = completed.filter(s => {
      const d = parseIsoDay(s.scheduledDate)
      return d >= range.start && d <= range.end
    })
    const built = buildPracticeWeeks(range, byDay)
    const mixRows = computePracticeMix(inRange)
    return {
      rows: buildPracticeMonthRows(range, byDay),
      weeks: built.weeks,
      monthLabels: built.monthLabels,
      // Always computed from everything completed, never the window — a
      // streak or a month total that changed when you looked at a different
      // period would be measuring the filter rather than the habit.
      summary: computePracticeSummary(completed, byDay, now),
      mix: mixRows,
      balance: computeBalanceInsight(mixRows),
      completedCount: inRange.length,
    }
  }, [sessions, userId, period])

  const columns = mode === 'month_rows' ? DAYS_IN_LONGEST_MONTH : weeks.length
  const layout = computeHeatmapLayout(columns, Math.max(0, (availableWidth || 720) - ROW_LABEL_WIDTH), mode)
  const column = layout.cellSize + layout.gap

  const onCellEnter = (day: PracticeDay, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const halfWidth = 100
    const x = Math.min(Math.max(rect.left + rect.width / 2, halfWidth + 4), window.innerWidth - halfWidth - 4)
    const below = rect.top < TOOLTIP_HEIGHT + 12
    setHovered({ day, x, y: below ? rect.bottom : rect.top, below })
  }

  const typesPresent = mix.map(m => m.type)

  return (
    <GlassCard className="p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold font-display">Practice Activity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            See how consistently you&rsquo;re preparing &mdash; and where you&rsquo;re spending your practice time.
          </p>
        </div>
        <Select value={period} onValueChange={v => setPeriod(v as PracticePeriod)}>
          <SelectTrigger className="h-9 text-xs sm:w-44 shrink-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PRACTICE_PERIODS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-5">
        <Metric label="This Month" value={String(summary.thisMonth)} hint="sessions completed" />
        <Metric label="This Week" value={String(summary.thisWeek)} hint="practice sessions" />
        <Metric
          label="Most Practised"
          value={summary.mostPractised ? summary.mostPractised.label : '—'}
          hint={summary.mostPractised ? `${summary.mostPractised.count} session${summary.mostPractised.count === 1 ? '' : 's'}` : 'nothing yet'}
        />
        <Metric
          label="Current Streak"
          value={`${summary.streakDays} ${summary.streakDays === 1 ? 'day' : 'days'}`}
          hint={summary.streakDays > 0 ? 'keep it going' : 'practise to start one'}
          icon={summary.streakDays > 0 ? <Flame className="w-4 h-4 text-orange-400" /> : undefined}
        />
      </div>

      {completedCount === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No completed practice sessions in this period yet.</p>
          <p className="text-xs text-muted-foreground/80 mt-1">
            Once a host marks a session as completed, it shows up here.
          </p>
        </div>
      ) : (
        <>
          <div ref={containerRef} className="overflow-x-auto pb-1 -mx-1 px-1">
            <div className="flex justify-center min-w-max">
              {mode === 'month_rows' ? (
                <div className="inline-flex gap-2">
                  <div className="flex flex-col shrink-0 pt-[16px]" style={{ gap: layout.gap, width: ROW_LABEL_WIDTH }}>
                    {rows.map(row => (
                      <div key={row.key} className="text-[10px] text-muted-foreground/80 text-right pr-1.5 flex items-center justify-end"
                        style={{ height: layout.cellSize }}>{row.label}</div>
                    ))}
                  </div>
                  <div>
                    <div className="relative h-[16px]" style={{ width: layout.gridWidth }}>
                      {DAY_AXIS_MARKS.map(d => (
                        <span key={d} className="absolute text-[9px] text-muted-foreground/70 text-center"
                          style={{ left: (d - 1) * column, width: layout.cellSize }}>{d}</span>
                      ))}
                    </div>
                    <div className="flex flex-col" style={{ gap: layout.gap }} role="grid" aria-label="Practice activity by day">
                      {rows.map(row => (
                        <div key={row.key} className="flex" style={{ gap: layout.gap }} role="row">
                          {row.days.map(day => (
                            <DayCell key={day.iso} day={day} size={layout.cellSize} onEnter={onCellEnter} onLeave={() => setHovered(null)} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="inline-flex gap-2">
                  <div className="flex flex-col shrink-0 pt-[18px]" style={{ gap: layout.gap, width: ROW_LABEL_WIDTH }}>
                    {DAY_LABELS.map((l, i) => (
                      <div key={i} className="text-[9px] text-muted-foreground/70 text-right pr-1.5 flex items-center justify-end"
                        style={{ height: layout.cellSize }}>{l}</div>
                    ))}
                  </div>
                  <div>
                    <div className="relative h-[18px]" style={{ width: layout.gridWidth }}>
                      {monthLabels.map(m => (
                        <span key={m.key} className="absolute text-[10px] text-muted-foreground/80"
                          style={{ left: m.columnIndex * column }}>{m.label}</span>
                      ))}
                    </div>
                    <div className="flex" style={{ gap: layout.gap }} role="grid" aria-label="Practice activity by day">
                      {weeks.map(week => (
                        <div key={week.key} className="flex flex-col" style={{ gap: layout.gap }} role="row">
                          {week.days.map(day => (
                            <DayCell key={day.iso} day={day} size={layout.cellSize} onEnter={onCellEnter} onLeave={() => setHovered(null)} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Legend lists only what the student actually did — a full colour
              key for formats they've never practised is noise. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3">
            {typesPresent.map(type => (
              <span key={type} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: PRACTICE_TYPE_COLOR[type].fill }} />
                {practiceTypeLabel(type)}
              </span>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--divider)' }}>
            <h4 className="text-sm font-semibold font-display mb-3">Your Practice Mix</h4>
            <div className="space-y-2">
              {mix.map(row => (
                <div key={row.type} className="flex items-center gap-3">
                  <span className="text-xs text-foreground w-32 sm:w-40 shrink-0 truncate">{row.label}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                    <div className="h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${row.share * 100}%`, background: PRACTICE_TYPE_COLOR[row.type].fill }} />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-6 text-right shrink-0">{row.count}</span>
                </div>
              ))}
            </div>
            {balance && <p className="text-xs text-muted-foreground mt-3">{balance}</p>}
          </div>
        </>
      )}

      {hovered && typeof document !== 'undefined' && createPortal(
        // Portalled for the same reason the Application Activity tooltip is:
        // GlassCard sets backdrop-blur, which makes it the containing block
        // for fixed-position children.
        <div
          className={`fixed z-50 pointer-events-none whitespace-nowrap px-2.5 py-2 rounded-lg text-[11px] shadow-2xl -translate-x-1/2 ${hovered.below ? '' : '-translate-y-full'}`}
          style={{
            left: hovered.x, top: hovered.y + (hovered.below ? 8 : -8),
            background: 'hsl(var(--card))', border: '1px solid var(--divider)',
          }}
          role="status"
        >
          <div className="font-medium text-foreground mb-0.5">{formatFullDate(hovered.day.iso)}</div>
          {hovered.day.total === 0 ? (
            <div className="text-muted-foreground">No practice</div>
          ) : (
            <>
              {hovered.day.segments.map(seg => (
                <div key={seg.type} className="text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: PRACTICE_TYPE_COLOR[seg.type].fill }} />
                  {practiceTypeLabel(seg.type)} &mdash; {seg.count} session{seg.count === 1 ? '' : 's'}
                </div>
              ))}
              <div className="text-foreground font-medium mt-1 pt-1 border-t" style={{ borderColor: 'var(--divider)' }}>
                Total: {hovered.day.total} practice session{hovered.day.total === 1 ? '' : 's'}
              </div>
            </>
          )}
        </div>,
        document.body,
      )}
    </GlassCard>
  )
}
