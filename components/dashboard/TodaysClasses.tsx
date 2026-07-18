'use client'

import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { getActiveTimetable } from '@/lib/onboarding/api'
import type { TimetableSlot } from '@/lib/parsers/timetableParser'
import { colorForSubject, formatTimeRange12h, formatMinutes, formatRoom, toMinutes } from '@/lib/timetable/display'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type Status = 'completed' | 'ongoing' | 'upcoming'

export function TodaysClasses({ userId }: { userId: string }) {
  const [slots, setSlots] = useState<TimetableSlot[] | null>(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    getActiveTimetable(userId).then(data => setSlots(data?.slots ?? [])).catch(() => setSlots([]))
  }, [userId])

  // Countdowns ("Ends in", "Starts in") need to stay live while the widget
  // is open.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  if (slots === null) return null

  const today = DAY_NAMES[now.getDay()]
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const todays = slots
    .filter(s => s.day === today)
    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-semibold font-display">Today&rsquo;s Classes</h3>
      </div>

      {todays.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">🎉 No classes today. Enjoy your day!</p>
        </div>
      ) : (
        <div className="relative pl-5">
          <div className="absolute left-[7px] top-1.5 bottom-1.5 w-px" style={{ background: 'var(--divider)' }} />
          <div className="space-y-3">
            {todays.map((s, i) => {
              const startMin = toMinutes(s.startTime)
              const endMin = toMinutes(s.endTime)
              const status: Status = endMin < nowMinutes ? 'completed' : startMin <= nowMinutes ? 'ongoing' : 'upcoming'
              const color = colorForSubject(s.subject)

              return (
                <div key={i} className="relative">
                  <div
                    className="absolute -left-5 top-1.5 w-3.5 h-3.5 rounded-full border-2"
                    style={{
                      background: status === 'ongoing' ? color : 'var(--background)',
                      borderColor: status === 'completed' ? 'var(--divider)' : color,
                    }}
                  >
                    {status === 'ongoing' && (
                      <span className="absolute inset-0 rounded-full animate-ping" style={{ background: color, opacity: 0.6 }} />
                    )}
                  </div>

                  <div
                    className={`px-3 py-2.5 rounded-lg ${status === 'ongoing' ? 'ring-1' : ''}`}
                    style={{
                      background: status === 'ongoing' ? `${color}14` : 'var(--muted-surface)',
                      opacity: status === 'completed' ? 0.55 : 1,
                      ...(status === 'ongoing' ? ({ '--tw-ring-color': `${color}66` } as React.CSSProperties) : {}),
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono text-muted-foreground">{formatTimeRange12h(s.startTime, s.endTime)}</span>
                      {status === 'ongoing' && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: color, color: '#fff' }}
                        >
                          LIVE NOW
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-foreground">{s.subject}</div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      {s.room && (
                        <span className="text-[11px] text-muted-foreground">{formatRoom(s.room)}</span>
                      )}
                      {status === 'ongoing' && (
                        <span className="text-[11px] font-medium shrink-0" style={{ color }}>Ends in {formatMinutes(endMin - nowMinutes)}</span>
                      )}
                      {status === 'upcoming' && (
                        <span className="text-[11px] text-indigo-400 font-medium shrink-0">Starts in {formatMinutes(startMin - nowMinutes)}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </GlassCard>
  )
}
