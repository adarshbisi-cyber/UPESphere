// Practice Activity — how consistently, and what kind.
//
// The counterpart to the Placement Tracker's Application Activity, but the
// question is different: applications ask "how many", practice asks "how
// many, of what". So a day carries a per-type breakdown rather than a
// single count, and colour means practice type while the cell's segments
// show the mix.
//
// Only completed sessions count. A session someone merely scheduled says
// nothing about whether they practised, and counting those would make the
// streak measure calendar optimism rather than effort.

import {
  DAYS_IN_LONGEST_MONTH, MONTH_NAMES, addDays, endOfMonth, monthIndex,
  parseIsoDay, startOfMonth, startOfWeek, toIsoDay,
  type DateRange,
} from '@/lib/shared/calendarGrid'
import { practiceTypeLabel } from './constants'
import type { PracticeSession, PracticeType } from './types'

// ============================================================
// Periods
// ============================================================

export type PracticePeriod = 'this_week' | 'this_month' | 'last_3_months' | 'last_6_months' | 'last_12_months'

export const PRACTICE_PERIODS: { value: PracticePeriod; label: string }[] = [
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'last_12_months', label: 'Last 12 Months' },
]

export const DEFAULT_PRACTICE_PERIOD: PracticePeriod = 'this_month'

export function resolvePracticeRange(period: PracticePeriod, now: Date = new Date()): DateRange {
  if (period === 'this_week') {
    const start = startOfWeek(now)
    return { start, end: addDays(start, 6) }
  }
  const monthsBack = period === 'this_month' ? 0 : period === 'last_3_months' ? 2 : period === 'last_6_months' ? 5 : 11
  return {
    start: new Date(now.getFullYear(), now.getMonth() - monthsBack, 1),
    end: endOfMonth(now),
  }
}

// A week or a single month is shown as calendar rows; longer ranges use the
// week-column contribution grid, same rule as Application Activity.
export function practiceHeatmapModeFor(period: PracticePeriod): 'month_rows' | 'contribution' {
  return period === 'this_week' || period === 'this_month' ? 'month_rows' : 'contribution'
}

// ============================================================
// Per-day breakdown
// ============================================================

export type TypeCounts = Partial<Record<PracticeType, number>>

export interface PracticeDay {
  iso: string
  date: Date
  total: number
  byType: TypeCounts
  /** Descending by count, then by type order — drives the cell's segments. */
  segments: { type: PracticeType; count: number }[]
  inRange: boolean
}

/** A session counts for a user only if they were actually in it. */
export function completedSessionsFor(sessions: PracticeSession[], userId: string): PracticeSession[] {
  return sessions.filter(s =>
    s.status === 'completed' && s.participants.some(p => p.userId === userId))
}

export function groupPracticeByDay(sessions: PracticeSession[]): Map<string, TypeCounts> {
  const byDay = new Map<string, TypeCounts>()
  for (const session of sessions) {
    const existing = byDay.get(session.scheduledDate) ?? {}
    existing[session.practiceType] = (existing[session.practiceType] ?? 0) + 1
    byDay.set(session.scheduledDate, existing)
  }
  return byDay
}

function toSegments(byType: TypeCounts): { type: PracticeType; count: number }[] {
  return (Object.entries(byType) as [PracticeType, number][])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([type, count]) => ({ type, count }))
}

function dayFrom(date: Date, byDay: Map<string, TypeCounts>, inRange: boolean, keySuffix = ''): PracticeDay {
  const iso = toIsoDay(date)
  const byType = inRange ? byDay.get(iso) ?? {} : {}
  const segments = toSegments(byType)
  return {
    iso: keySuffix ? `${iso}${keySuffix}` : iso,
    date,
    total: segments.reduce((n, s) => n + s.count, 0),
    byType,
    segments,
    inRange,
  }
}

export interface PracticeWeek { key: string; days: PracticeDay[] }
export interface PracticeMonthRow { key: string; label: string; days: PracticeDay[] }

/** Weeks as columns, weekdays as rows — the long-range view. */
export function buildPracticeWeeks(range: DateRange, byDay: Map<string, TypeCounts>): {
  weeks: PracticeWeek[]
  monthLabels: { key: string; label: string; columnIndex: number }[]
} {
  const weeks: PracticeWeek[] = []
  const monthLabels: { key: string; label: string; columnIndex: number }[] = []
  let cursor = startOfWeek(range.start)
  let lastLabelled = -1

  while (cursor <= range.end) {
    const days: PracticeDay[] = []
    for (let i = 0; i < 7; i++) {
      const date = addDays(cursor, i)
      days.push(dayFrom(date, byDay, date >= range.start && date <= range.end))
    }
    const labelDay = days.find(d => d.inRange) ?? days[0]
    if (monthIndex(labelDay.date) !== lastLabelled) {
      lastLabelled = monthIndex(labelDay.date)
      monthLabels.push({
        key: `${labelDay.date.getFullYear()}-${labelDay.date.getMonth()}`,
        label: MONTH_NAMES[labelDay.date.getMonth()],
        columnIndex: weeks.length,
      })
    }
    weeks.push({ key: toIsoDay(cursor), days })
    cursor = addDays(cursor, 7)
  }
  return { weeks, monthLabels }
}

/** One compact row per month, days running 1st -> 31st. */
export function buildPracticeMonthRows(range: DateRange, byDay: Map<string, TypeCounts>): PracticeMonthRow[] {
  const rows: PracticeMonthRow[] = []
  const spansYears = range.start.getFullYear() !== range.end.getFullYear()
  const cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1)
  const last = new Date(range.end.getFullYear(), range.end.getMonth(), 1)

  while (cursor <= last) {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: PracticeDay[] = []

    for (let d = 1; d <= DAYS_IN_LONGEST_MONTH; d++) {
      const date = new Date(year, month, d)
      const withinMonth = d <= daysInMonth
      const inRange = withinMonth && date >= range.start && date <= range.end
      days.push(dayFrom(date, byDay, inRange, withinMonth ? '' : `-pad${d}`))
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

// ============================================================
// Summary
// ============================================================

export interface PracticeSummary {
  thisMonth: number
  thisWeek: number
  mostPractised: { type: PracticeType; label: string; count: number } | null
  streakDays: number
}

function countIn(sessions: PracticeSession[], from: Date, to: Date): number {
  return sessions.filter(s => {
    const d = parseIsoDay(s.scheduledDate)
    return d >= from && d <= to
  }).length
}

// Consecutive days ending today, or ending yesterday — a streak shouldn't
// look broken first thing in the morning before that day's practice.
export function computeStreak(byDay: Map<string, TypeCounts>, now: Date = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const practisedOn = (d: Date) => Object.keys(byDay.get(toIsoDay(d)) ?? {}).length > 0

  let cursor = practisedOn(today) ? today : addDays(today, -1)
  if (!practisedOn(cursor)) return 0

  let streak = 0
  while (practisedOn(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

export function computePracticeSummary(
  sessions: PracticeSession[],
  byDay: Map<string, TypeCounts>,
  now: Date = new Date(),
): PracticeSummary {
  const totals = new Map<PracticeType, number>()
  for (const s of sessions) totals.set(s.practiceType, (totals.get(s.practiceType) ?? 0) + 1)
  const top = Array.from(totals.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]

  const weekStart = startOfWeek(now)

  return {
    thisMonth: countIn(sessions, startOfMonth(now), endOfMonth(now)),
    thisWeek: countIn(sessions, weekStart, addDays(weekStart, 6)),
    mostPractised: top ? { type: top[0], label: practiceTypeLabel(top[0]), count: top[1] } : null,
    streakDays: computeStreak(byDay, now),
  }
}

// ============================================================
// Practice mix
// ============================================================

export interface PracticeMixRow {
  type: PracticeType
  label: string
  count: number
  share: number // 0..1
}

export function computePracticeMix(sessions: PracticeSession[]): PracticeMixRow[] {
  const totals = new Map<PracticeType, number>()
  for (const s of sessions) totals.set(s.practiceType, (totals.get(s.practiceType) ?? 0) + 1)
  const total = sessions.length
  return Array.from(totals.entries())
    .map(([type, count]) => ({ type, label: practiceTypeLabel(type), count, share: total > 0 ? count / total : 0 }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

// A balance nudge only when one type genuinely dominates a sample big
// enough to mean something — below that it would be telling someone their
// preparation is lopsided on the evidence of three sessions.
const MIN_SESSIONS_FOR_BALANCE = 5
const DOMINANT_SHARE = 0.6

export function computeBalanceInsight(mix: PracticeMixRow[]): string | null {
  const total = mix.reduce((n, m) => n + m.count, 0)
  if (total < MIN_SESSIONS_FOR_BALANCE || mix.length === 0) return null

  const top = mix[0]
  if (top.share < DOMINANT_SHARE) return null

  const missing = mix.length === 1
    ? 'other formats'
    : `formats like ${mix[mix.length - 1].label.toLowerCase()}`
  return `Your preparation is heavily focused on ${top.label.toLowerCase()} (${Math.round(top.share * 100)}% of sessions). Consider scheduling ${missing} too.`
}
