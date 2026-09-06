'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarClock, Upload } from 'lucide-react'
import { getActiveTimetable, type TimetableVersion } from '@/lib/onboarding/api'
import type { TimetableSlot } from '@/lib/parsers/timetableParser'
import { colorForSubject, formatTimeRange12h, formatDuration, formatRoom, toMinutes } from '@/lib/timetable/display'
import { TimetableUploadModal } from '@/components/workspace/TimetableUploadModal'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
}
const JS_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const PX_PER_MINUTE = 1.8
const SCROLL_HEIGHT = 420
const POPOVER_WIDTH = 224
const POPOVER_MARGIN = 8

interface ActiveState {
  key: string
  slot: TimetableSlot
  rect: DOMRect
}

// Positions the popover with fixed viewport coordinates computed from the
// hovered block's own bounding rect, rather than CSS percentages relative to
// an ancestor. That ancestor is a scrollable grid — and per the CSS spec,
// overflow-x can never actually stay "visible" once overflow-y is
// auto/scroll (the browser silently forces it to "auto" too) — so anything
// positioned relative to that box gets clipped the moment it overflows,
// worst at the leftmost/rightmost columns. Viewport-fixed coordinates sidestep
// that entirely and also get clamped to the window so they never run off-screen.
function popoverStyle(rect: DOMRect | null): React.CSSProperties {
  if (!rect) return { display: 'none' }
  const showBelow = window.innerHeight - rect.bottom > 160 || rect.top < 160
  let left = rect.left + rect.width / 2 - POPOVER_WIDTH / 2
  left = Math.max(POPOVER_MARGIN, Math.min(left, window.innerWidth - POPOVER_WIDTH - POPOVER_MARGIN))
  return {
    position: 'fixed',
    left,
    width: POPOVER_WIDTH,
    ...(showBelow ? { top: rect.bottom + 6 } : { bottom: window.innerHeight - rect.top + 6 }),
  }
}

export function WeeklyTimetable({
  userId,
  refreshKey,
  onTimetableChanged,
}: {
  userId: string
  // Bumped by a sibling (the Academic Workspace's Timetable card) after it
  // saves a new version, so this widget picks up the change too even though
  // it fetches independently — see `onTimetableChanged` below for the
  // reverse direction.
  refreshKey?: number
  // Fired after this component's own "Upload Timetable" button saves a new
  // version, so siblings (Today's Classes, the Academic Workspace card) that
  // don't share this component's state can refetch too.
  onTimetableChanged?: () => void
}) {
  const [data, setData] = useState<{ version: TimetableVersion; slots: TimetableSlot[] } | null | undefined>(undefined)
  const [now, setNow] = useState(() => new Date())
  const [active, setActive] = useState<ActiveState | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const openSlot = (key: string, slot: TimetableSlot, rect: DOMRect) => setActive({ key, slot, rect })
  const closeSlot = (key: string) => setActive(prev => (prev?.key === key ? null : prev))
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrolledRef = useRef(false)

  useEffect(() => {
    getActiveTimetable(userId).then(setData).catch(() => setData(null))
  }, [userId, refreshKey])

  const handleUploadSaved = () => {
    setShowUploadModal(false)
    getActiveTimetable(userId).then(setData).catch(() => setData(null))
    onTimetableChanged?.()
  }

  // Drives the current-time indicator line — doesn't need to be more
  // frequent than the line itself is visually precise to.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const { gridStart, gridEnd } = useMemo(() => {
    const slots = data?.slots ?? []
    if (slots.length === 0) return { gridStart: 8 * 60, gridEnd: 18 * 60 }
    const min = Math.min(...slots.map(s => toMinutes(s.startTime)))
    const max = Math.max(...slots.map(s => toMinutes(s.endTime)))
    return { gridStart: Math.floor(min / 60) * 60, gridEnd: Math.ceil(max / 60) * 60 }
  }, [data])

  const todayName = JS_DAY_NAMES[now.getDay()]

  // Auto-scroll once, on load: jump to the current time if it falls inside
  // the grid's range, otherwise to today's first class, otherwise the
  // week's first class — never re-runs on the `now` tick, so it doesn't
  // fight a user's manual scroll.
  useEffect(() => {
    if (scrolledRef.current) return
    const el = scrollRef.current
    if (!el || !data || data.slots.length === 0) return
    scrolledRef.current = true

    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()
    let targetMinutes: number
    if (nowMinutes >= gridStart && nowMinutes <= gridEnd) {
      targetMinutes = nowMinutes
    } else {
      const today = JS_DAY_NAMES[new Date().getDay()]
      const todaysSlots = data.slots.filter(s => s.day === today)
      const pool = todaysSlots.length > 0 ? todaysSlots : data.slots
      targetMinutes = Math.min(...pool.map(s => toMinutes(s.startTime)))
    }
    el.scrollTop = Math.max(0, (targetMinutes - gridStart) * PX_PER_MINUTE - 80)
  }, [data, gridStart, gridEnd])

  if (data === undefined) return null // loading

  const gridHeight = (gridEnd - gridStart) * PX_PER_MINUTE
  const hourMarks: number[] = []
  for (let m = gridStart; m <= gridEnd; m += 60) hourMarks.push(m)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const showNowLine = nowMinutes >= gridStart && nowMinutes <= gridEnd

  return (
    <>
    <GlassCard className="p-6">
      <div className="flex items-center justify-between flex-wrap gap-y-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
            <CalendarClock className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold font-display">Weekly Timetable</h3>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => setShowUploadModal(true)}>
          <Upload className="w-3.5 h-3.5" />
          Upload Timetable
        </Button>
      </div>

      {!data || data.slots.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-muted-foreground">No active timetable yet — add one from your Academic Workspace above.</p>
        </div>
      ) : (
        <div>
          <div className="flex mb-1.5">
            <div className="w-10 shrink-0" />
            <div className="flex-1 grid grid-cols-7 gap-1">
              {DAYS.map(day => (
                <div
                  key={day}
                  className={`text-[10px] font-medium text-center py-1 rounded-md ${day === todayName ? 'text-indigo-400 font-semibold' : 'text-muted-foreground'}`}
                  style={day === todayName ? { background: 'rgba(99,102,241,0.1)' } : undefined}
                >
                  {DAY_SHORT[day]}
                </div>
              ))}
            </div>
          </div>
          <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: SCROLL_HEIGHT }}>
            <div className="flex" style={{ height: gridHeight }}>
              <div className="w-10 shrink-0 relative">
                {hourMarks.map(m => (
                  <div
                    key={m}
                    className="absolute text-[9px] text-muted-foreground -translate-y-1/2 right-1"
                    style={{ top: (m - gridStart) * PX_PER_MINUTE }}
                  >
                    {String(Math.floor(m / 60)).padStart(2, '0')}:00
                  </div>
                ))}
              </div>
              <div className="flex-1 grid grid-cols-7 gap-1 relative" style={{ height: gridHeight }}>
                {hourMarks.map(m => (
                  <div
                    key={m}
                    className="absolute left-0 right-0 border-t"
                    style={{ top: (m - gridStart) * PX_PER_MINUTE, borderColor: 'var(--divider)' }}
                  />
                ))}
                {DAYS.map(day => {
                  const isToday = day === todayName
                  return (
                    <div
                      key={day}
                      className="relative rounded-md"
                      style={{ height: gridHeight, background: isToday ? 'rgba(99,102,241,0.05)' : undefined }}
                    >
                      {isToday && showNowLine && (
                        <div
                          className="absolute left-0 right-0 z-20 pointer-events-none"
                          style={{ top: (nowMinutes - gridStart) * PX_PER_MINUTE }}
                        >
                          <div className="relative">
                            <div className="absolute -left-0.5 -top-1 w-2 h-2 rounded-full bg-red-500" />
                            <div className="border-t-2 border-red-500" />
                          </div>
                        </div>
                      )}
                      {data.slots.filter(s => s.day === day).map((s, i) => {
                        const key = `${day}-${i}`
                        const top = (toMinutes(s.startTime) - gridStart) * PX_PER_MINUTE
                        const height = Math.max(28, (toMinutes(s.endTime) - toMinutes(s.startTime)) * PX_PER_MINUTE)
                        const color = colorForSubject(s.subject)
                        const isActive = active?.key === key
                        const label = `${s.subject}, ${formatTimeRange12h(s.startTime, s.endTime)}${s.room ? `, ${formatRoom(s.room)}` : ''}`
                        return (
                          <div
                            key={key}
                            role="button"
                            tabIndex={0}
                            aria-label={label}
                            className="absolute left-0 right-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                            style={{ top, height, zIndex: isActive ? 30 : 10 }}
                            onMouseEnter={e => openSlot(key, s, e.currentTarget.getBoundingClientRect())}
                            onMouseLeave={() => closeSlot(key)}
                            onFocus={e => openSlot(key, s, e.currentTarget.getBoundingClientRect())}
                            onBlur={() => closeSlot(key)}
                            onClick={e => openSlot(key, s, e.currentTarget.getBoundingClientRect())}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                openSlot(key, s, e.currentTarget.getBoundingClientRect())
                              } else if (e.key === 'Escape') {
                                closeSlot(key)
                              }
                            }}
                          >
                            <div
                              className="h-full w-full rounded-md px-1.5 py-1 overflow-hidden cursor-pointer"
                              style={{ background: `${color}26`, border: `1px solid ${color}55` }}
                            >
                              <div className="text-[9px] font-bold leading-tight line-clamp-2" style={{ color }}>{s.subject}</div>
                              <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">{formatTimeRange12h(s.startTime, s.endTime)}</div>
                              {s.room && <div className="text-[9px] text-muted-foreground/80 leading-tight mt-0.5 truncate">{formatRoom(s.room)}</div>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {active && typeof document !== 'undefined' && createPortal(
        <div
          role="tooltip"
          className="z-50 rounded-xl p-3 pointer-events-none"
          style={{
            ...popoverStyle(active.rect),
            background: 'linear-gradient(135deg, var(--glass-from), var(--glass-to))',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
            backdropFilter: 'blur(24px)',
          }}
        >
          <div className="text-xs font-bold mb-1.5" style={{ color: colorForSubject(active.slot.subject) }}>{active.slot.subject}</div>
          <div className="text-[11px] text-foreground/80 mb-1">{formatTimeRange12h(active.slot.startTime, active.slot.endTime)}</div>
          {active.slot.room && (
            <div className="text-[11px] text-muted-foreground mb-1">{formatRoom(active.slot.room)}</div>
          )}
          <div className="text-[11px] text-muted-foreground">Duration: {formatDuration(active.slot.startTime, active.slot.endTime)}</div>
          {active.slot.faculty && <div className="text-[11px] text-muted-foreground mt-1">Faculty: {active.slot.faculty}</div>}
        </div>,
        document.body
      )}
    </GlassCard>

    <AnimatePresence>
      {showUploadModal && (
        <TimetableUploadModal
          userId={userId}
          hasExisting={data !== null}
          onClose={() => setShowUploadModal(false)}
          onSaved={handleUploadSaved}
        />
      )}
    </AnimatePresence>
    </>
  )
}
