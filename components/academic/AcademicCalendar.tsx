'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, CalendarDays, Dot, Sparkles } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { cn, EASE_OUT } from '@/lib/utils'
import {
  ACADEMIC_EVENTS, CATEGORY_STYLE, CALENDAR_MIN, CALENDAR_MAX, currentCalendarMonth,
  toISO, eventsOnDay, eventsInMonth, type AcademicEvent, type EventCategory,
} from '@/lib/data/academicCalendar'

const EASE = EASE_OUT
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const CATEGORIES: EventCategory[] = ['academic', 'exam', 'fest', 'holiday']

const monthIndex = (y: number, m: number) => y * 12 + m
const MIN_IDX = monthIndex(CALENDAR_MIN.year, CALENDAR_MIN.month)
const MAX_IDX = monthIndex(CALENDAR_MAX.year, CALENDAR_MAX.month)

const prettyRange = (e: AcademicEvent) => {
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number)
    return `${d} ${MONTH_NAMES[m - 1].slice(0, 3)} ${y}`
  }
  return e.start === e.end ? fmt(e.start) : `${fmt(e.start)} – ${fmt(e.end)}`
}

export function AcademicCalendar() {
  // Opens on the visitor's actual current month (see currentCalendarMonth's
  // own comment for why it's clamped) — computed once at mount via the
  // lazy-initializer form so it's a single consistent snapshot rather than
  // two separate `new Date()` reads for year vs. month.
  const [initialMonth] = useState(() => currentCalendarMonth())
  const [year, setYear] = useState(initialMonth.year)
  const [month, setMonth] = useState(initialMonth.month) // 0-indexed
  const [selected, setSelected] = useState<string | null>(null)
  const [activeCats, setActiveCats] = useState<Set<EventCategory>>(new Set(CATEGORIES))
  const todayIso = useMemo(() => {
    const now = new Date()
    return toISO(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  const idx = monthIndex(year, month)
  const canPrev = idx > MIN_IDX
  const canNext = idx < MAX_IDX

  const go = (delta: number) => {
    const next = idx + delta
    if (next < MIN_IDX || next > MAX_IDX) return
    setYear(Math.floor(next / 12))
    setMonth(next % 12)
    setSelected(null)
  }

  const toggleCat = (c: EventCategory) => {
    setActiveCats(prev => {
      const n = new Set(prev)
      n.has(c) ? n.delete(c) : n.add(c)
      return n
    })
  }

  // Build the 6-week grid (Sun-start).
  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const out: { iso: string; day: number; inMonth: boolean }[] = []
    // leading days from previous month
    const prevDays = new Date(year, month, 0).getDate()
    for (let i = firstWeekday - 1; i >= 0; i--) {
      const d = prevDays - i
      const pm = month === 0 ? 11 : month - 1
      const py = month === 0 ? year - 1 : year
      out.push({ iso: toISO(py, pm, d), day: d, inMonth: false })
    }
    for (let d = 1; d <= daysInMonth; d++) out.push({ iso: toISO(year, month, d), day: d, inMonth: true })
    // trailing to fill 42 cells
    let nd = 1
    while (out.length < 42) {
      const nm = month === 11 ? 0 : month + 1
      const ny = month === 11 ? year + 1 : year
      out.push({ iso: toISO(ny, nm, nd), day: nd, inMonth: false })
      nd++
    }
    return out
  }, [year, month])

  const monthEvents = useMemo(
    () => eventsInMonth(year, month).filter(e => activeCats.has(e.category)),
    [year, month, activeCats]
  )

  const selectedEvents = selected ? eventsOnDay(selected).filter(e => activeCats.has(e.category)) : []

  const counts = useMemo(() => {
    const inMonth = eventsInMonth(year, month)
    return CATEGORIES.reduce((acc, c) => { acc[c] = inMonth.filter(e => e.category === c).length; return acc }, {} as Record<EventCategory, number>)
  }, [year, month])

  return (
    <div className="pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="max-w-6xl mx-auto text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-5">
          <Sparkles className="w-3.5 h-3.5" /> UPES · 2026–27
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight">
          Academic{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">Calendar</span>
        </h1>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
          Every class start, exam window, result date and holiday for the 2026–27 session — mapped to the day. Always cross-check with official notices.
        </p>
      </motion.div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Calendar */}
        <GlassCard className="p-4 sm:p-6 border border-white/10 bg-white/[0.02]">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => go(-1)}
                disabled={!canPrev}
                aria-label="Previous month"
                className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-xl font-bold font-display min-w-[168px] text-center">{MONTH_NAMES[month]} {year}</h2>
              <button
                onClick={() => go(1)}
                disabled={!canNext}
                aria-label="Next month"
                className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => {
                // Recomputed fresh at click time, not the value from mount —
                // if this tab's been open across a date change, "Today"
                // should reflect the actual current date, not a stale one.
                const current = currentCalendarMonth()
                setYear(current.year)
                setMonth(current.month)
                setSelected(null)
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              Today
            </button>
          </div>

          {/* Legend / category filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map(c => {
              const s = CATEGORY_STYLE[c]
              const on = activeCats.has(c)
              return (
                <button
                  key={c}
                  onClick={() => toggleCat(c)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all',
                    on ? 'border-white/15 text-foreground' : 'border-white/5 text-muted-foreground/50 line-through'
                  )}
                >
                  <span className={cn('w-2.5 h-2.5 rounded-sm', s.legend, !on && 'opacity-40')} />
                  {s.label}
                  <span className="text-muted-foreground/60">{counts[c]}</span>
                </button>
              )
            })}
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map(w => (
              <div key={w} className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-1">{w}</div>
            ))}
          </div>

          {/* Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${year}-${month}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="grid grid-cols-7 gap-1"
            >
              {cells.map(cell => {
                const evs = eventsOnDay(cell.iso).filter(e => activeCats.has(e.category))
                const isSelected = selected === cell.iso
                const isWeekend = new Date(cell.iso).getDay() % 6 === 0
                const isToday = cell.inMonth && cell.iso === todayIso
                return (
                  <button
                    key={cell.iso}
                    onClick={() => setSelected(isSelected ? null : cell.iso)}
                    aria-current={isToday ? 'date' : undefined}
                    className={cn(
                      'min-h-[74px] sm:min-h-[92px] rounded-lg border p-1.5 text-left flex flex-col gap-1 transition-colors',
                      cell.inMonth ? 'bg-white/[0.02] border-white/8 hover:border-indigo-500/40 hover:bg-indigo-500/[0.05]' : 'bg-transparent border-transparent',
                      isToday && !isSelected && 'border-indigo-500/50 bg-indigo-500/[0.06]',
                      isSelected && 'ring-2 ring-indigo-500/60 border-indigo-500/40'
                    )}
                  >
                    <span className={cn(
                      'text-xs font-medium inline-flex items-center gap-1',
                      isToday ? 'text-indigo-400 font-bold' : cell.inMonth ? (isWeekend ? 'text-muted-foreground' : 'text-foreground/80') : 'text-muted-foreground/30'
                    )}>
                      {cell.day}
                      {isToday && <span className="w-1 h-1 rounded-full bg-indigo-400" aria-hidden="true" />}
                    </span>
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {evs.slice(0, 3).map(e => {
                        const s = CATEGORY_STYLE[e.category]
                        return (
                          <span
                            key={e.id}
                            title={e.title}
                            className={cn('text-[9px] leading-tight px-1 py-0.5 rounded border truncate', s.pill, !cell.inMonth && 'opacity-50')}
                          >
                            {e.title}
                          </span>
                        )
                      })}
                      {evs.length > 3 && (
                        <span className="text-[9px] text-muted-foreground/70 px-1">+{evs.length - 3} more</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </motion.div>
          </AnimatePresence>
        </GlassCard>

        {/* Detail / agenda panel */}
        <GlassCard className="p-5 border border-white/10 bg-white/[0.02] h-fit lg:sticky lg:top-24">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold font-display">
              {selected ? prettyRange({ start: selected, end: selected } as AcademicEvent) : `${MONTH_NAMES[month]} at a glance`}
            </h3>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selected ?? `${year}-${month}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="space-y-2"
            >
              {(selected ? selectedEvents : monthEvents).length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  {selected ? 'Nothing scheduled this day.' : 'No events match the current filters.'}
                </p>
              ) : (
                (selected ? selectedEvents : monthEvents).map(e => {
                  const s = CATEGORY_STYLE[e.category]
                  return (
                    <div key={e.id + (selected ?? '')} className="flex items-start gap-2.5 rounded-lg border border-white/8 bg-white/[0.02] p-2.5">
                      <span className={cn('mt-1 w-2 h-2 rounded-full flex-shrink-0', s.dot)} />
                      <div className="min-w-0">
                        <div className="text-sm leading-snug">{e.title}</div>
                        <div className={cn('text-[11px] mt-0.5 flex items-center gap-1.5', 'text-muted-foreground')}>
                          <span className={cn('font-medium', s.barText)}>{s.label}</span>
                          <Dot className="w-3 h-3 -mx-1" />
                          {prettyRange(e)}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </motion.div>
          </AnimatePresence>

          {selected && (
            <button
              onClick={() => setSelected(null)}
              className="mt-4 w-full text-xs py-2 rounded-lg border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              Back to {MONTH_NAMES[month]}
            </button>
          )}
        </GlassCard>
      </div>

      <p className="max-w-6xl mx-auto text-xs text-muted-foreground/60 mt-8 text-center">
        Showing all {ACADEMIC_EVENTS.length} calendar entries across the 2026–27 session. Dates can shift — confirm on official UPES notices.
      </p>
    </div>
  )
}
