'use client'

import { useEffect, useState } from 'react'
import { animate, motion } from 'framer-motion'
import { GraduationCap, BarChart3, Clock, Target, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getActiveTimetable, getTotalSemesters, updateTotalSemesters } from '@/lib/onboarding/api'
import { formatTime12h, toMinutes } from '@/lib/timetable/display'

export interface SemesterSummary {
  semester_number: number
  sgpa: number
  total_credits: number
}

const JS_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const PROGRAM_LENGTHS = [2, 4, 6, 8, 10, 12]
const DEFAULT_TOTAL_SEMESTERS = 8

type Accent = 'indigo' | 'violet' | 'cyan' | 'emerald' | 'amber'

const ACCENT: Record<Accent, { gradient: string; border: string; value: string; bg: string; icon: string; bar: string }> = {
  indigo: { gradient: 'from-indigo-500/10 to-indigo-600/5', border: 'border-indigo-500/20', value: 'text-indigo-300', bg: 'bg-indigo-500/10', icon: 'text-indigo-400', bar: 'bg-indigo-400' },
  violet: { gradient: 'from-violet-500/10 to-violet-600/5', border: 'border-violet-500/20', value: 'text-violet-300', bg: 'bg-violet-500/10', icon: 'text-violet-400', bar: 'bg-violet-400' },
  cyan: { gradient: 'from-cyan-500/10 to-cyan-600/5', border: 'border-cyan-500/20', value: 'text-cyan-300', bg: 'bg-cyan-500/10', icon: 'text-cyan-400', bar: 'bg-cyan-400' },
  emerald: { gradient: 'from-emerald-500/10 to-emerald-600/5', border: 'border-emerald-500/20', value: 'text-emerald-300', bg: 'bg-emerald-500/10', icon: 'text-emerald-400', bar: 'bg-emerald-400' },
  amber: { gradient: 'from-amber-500/10 to-amber-600/5', border: 'border-amber-500/20', value: 'text-amber-300', bg: 'bg-amber-500/10', icon: 'text-amber-400', bar: 'bg-amber-400' },
}

// Count-up on mount / when the target value first arrives, so numbers animate
// in as the dashboard loads. Re-animates from zero if the value changes (data
// loads once, so in practice that's a single run per card).
function AnimatedNumber({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: v => setDisplay(v),
    })
    return () => controls.stop()
  }, [value])
  return <span className={className}>{display.toFixed(decimals)}</span>
}

function SummaryCard({
  title,
  accent,
  icon,
  delay,
  children,
}: {
  title: string
  accent: Accent
  icon: React.ReactNode
  delay: number
  children: React.ReactNode
}) {
  const c = ACCENT[accent]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        'rounded-xl border p-3.5 bg-gradient-to-br flex flex-col',
        c.gradient,
        c.border,
        'hover:scale-[1.02] transition-transform duration-200 cursor-default'
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-muted-foreground font-medium">{title}</p>
        <div className={cn('p-1.5 rounded-lg', c.bg, c.icon)}>{icon}</div>
      </div>
      {children}
    </motion.div>
  )
}

function ProgressBar({ pct, accent, delay }: { pct: number; accent: Accent; delay: number }) {
  const c = ACCENT[accent]
  return (
    <div className="h-1 rounded-full overflow-hidden mt-1.5" style={{ background: 'var(--divider)' }}>
      <motion.div
        className={cn('h-full rounded-full', c.bar)}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        transition={{ duration: 0.8, delay: delay + 0.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}

function computeCgpa(semesters: SemesterSummary[]): number | null {
  if (!semesters.length) return null
  const totalCredits = semesters.reduce((s, r) => s + (r.total_credits || 0), 0)
  if (!totalCredits) return null
  const weighted = semesters.reduce((s, r) => s + r.sgpa * (r.total_credits || 0), 0)
  return weighted / totalCredits
}

export function SummaryCards({ userId, semesters }: { userId: string; semesters: SemesterSummary[] }) {
  const [todayCount, setTodayCount] = useState<number | null>(null)
  const [nextClassTime, setNextClassTime] = useState<string | null>(null)
  // null until fetched; falls back to a default in the UI so existing accounts
  // (which have no stored value yet) still render, and can set it inline.
  const [totalSemesters, setTotalSemesters] = useState<number | null>(null)

  useEffect(() => {
    getTotalSemesters(userId).then(setTotalSemesters).catch(() => setTotalSemesters(null))

    getActiveTimetable(userId)
      .then(active => {
        const slots = active?.slots ?? []
        const now = new Date()
        const today = JS_DAY_NAMES[now.getDay()]
        const nowMinutes = now.getHours() * 60 + now.getMinutes()
        const todays = slots
          .filter(s => s.day === today)
          .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))
        setTodayCount(todays.length)
        const upcoming = todays.find(s => toMinutes(s.startTime) >= nowMinutes)
        setNextClassTime(upcoming ? formatTime12h(upcoming.startTime) : null)
      })
      .catch(() => setTodayCount(0))
  }, [userId])

  const latest = semesters.length > 0 ? semesters[semesters.length - 1] : null
  const cgpa = computeCgpa(semesters)
  const completedSemesters = semesters.length
  const completedCredits = semesters.reduce((s, r) => s + (r.total_credits || 0), 0)

  const totalDisplay = totalSemesters ?? DEFAULT_TOTAL_SEMESTERS
  const degreePct = (completedSemesters / totalDisplay) * 100

  const changeTotalSemesters = (n: number) => {
    setTotalSemesters(n)
    updateTotalSemesters(userId, n).catch(() => {})
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
      {/* 1. Latest SGPA */}
      <SummaryCard title="Latest SGPA" accent="indigo" delay={0} icon={<GraduationCap className="w-3.5 h-3.5" />}>
        <div className="text-3xl font-bold font-display leading-none mb-1.5 text-indigo-300">
          {latest ? <AnimatedNumber value={latest.sgpa} decimals={2} /> : '—'}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {latest ? `Semester ${latest.semester_number}` : 'No data yet'}
        </p>
      </SummaryCard>

      {/* 2. CGPA */}
      <SummaryCard title="CGPA" accent="violet" delay={0.05} icon={<BarChart3 className="w-3.5 h-3.5" />}>
        <div className="text-3xl font-bold font-display leading-none mb-1.5 text-violet-300">
          {cgpa != null ? <AnimatedNumber value={cgpa} decimals={2} /> : '—'}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {latest ? `After Semester ${latest.semester_number}` : 'No data yet'}
        </p>
      </SummaryCard>

      {/* 3. Today's Classes */}
      <SummaryCard title="Today's Classes" accent="cyan" delay={0.1} icon={<Clock className="w-3.5 h-3.5" />}>
        {todayCount === 0 ? (
          <>
            <div className="text-base font-bold font-display leading-tight mb-1 text-cyan-300">No Classes Today</div>
            <p className="text-[11px] text-muted-foreground">Enjoy your day</p>
          </>
        ) : (
          <>
            <div className="text-3xl font-bold font-display leading-none mb-1.5 text-cyan-300">
              {todayCount == null ? '—' : <AnimatedNumber value={todayCount} />}
            </div>
            <p className="text-[11px] text-muted-foreground">Classes Scheduled</p>
            <p className="text-[11px] text-cyan-300/90 font-medium mt-0.5">
              {nextClassTime ? `Next · ${nextClassTime}` : 'All classes done'}
            </p>
          </>
        )}
      </SummaryCard>

      {/* 4. Degree Progress */}
      <SummaryCard title="Degree Progress" accent="emerald" delay={0.15} icon={<Target className="w-3.5 h-3.5" />}>
        <div className="flex items-baseline gap-1 mb-1 text-emerald-300">
          <span className="text-3xl font-bold font-display leading-none">
            <AnimatedNumber value={completedSemesters} />
          </span>
          <span className="text-base text-muted-foreground font-medium">/</span>
          <select
            aria-label="Total semesters in your program"
            value={totalDisplay}
            onChange={e => changeTotalSemesters(Number(e.target.value))}
            className="text-base text-muted-foreground font-medium bg-transparent focus:outline-none cursor-pointer hover:text-foreground transition-colors -ml-0.5"
          >
            {PROGRAM_LENGTHS.map(n => <option key={n} value={n} className="bg-background text-foreground">{n}</option>)}
          </select>
        </div>
        <p className="text-[11px] text-muted-foreground">Semesters Completed</p>
        <ProgressBar pct={degreePct} accent="emerald" delay={0.15} />
        <p className="text-[10px] text-muted-foreground mt-1">{Math.round(degreePct)}% Complete</p>
      </SummaryCard>

      {/* 5. Credits Earned */}
      <SummaryCard title="Credits Earned" accent="amber" delay={0.2} icon={<Award className="w-3.5 h-3.5" />}>
        <div className="text-3xl font-bold font-display leading-none mb-1.5 text-amber-300">
          <AnimatedNumber value={completedCredits} />
        </div>
        <p className="text-[11px] text-muted-foreground">Credits Completed</p>
      </SummaryCard>
    </div>
  )
}
