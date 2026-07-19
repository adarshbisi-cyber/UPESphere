'use client'

import { useCallback, useEffect, useState } from 'react'
import { GraduationCap, BarChart3, Clock, Target, Award } from 'lucide-react'
import { AnimatedNumber, StatCard, StatProgressBar } from '@/components/shared/StatCard'
import { getActiveTimetable, getTotalSemesters, updateTotalSemesters, type GradeSheet } from '@/lib/onboarding/api'
import { computeCgpaSimple } from '@/lib/calculations/cgpa'
import { formatTime12h, toMinutes } from '@/lib/timetable/display'

const JS_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const PROGRAM_LENGTHS = [2, 4, 6, 8, 10, 12]
const DEFAULT_TOTAL_SEMESTERS = 8

export function SummaryCards({ userId, semesters }: { userId: string; semesters: GradeSheet[] }) {
  const [todayCount, setTodayCount] = useState<number | null>(null)
  const [nextClassTime, setNextClassTime] = useState<string | null>(null)
  const [todayError, setTodayError] = useState(false)
  // null until fetched; falls back to a default in the UI so existing accounts
  // (which have no stored value yet) still render, and can set it inline.
  const [totalSemesters, setTotalSemesters] = useState<number | null>(null)

  // Split out so the "Today's Classes" retry button can re-run just this
  // fetch — a failed request must not look identical to "no classes today."
  const fetchToday = useCallback(() => {
    setTodayError(false)
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
      .catch(() => setTodayError(true))
  }, [userId])

  useEffect(() => {
    getTotalSemesters(userId).then(setTotalSemesters).catch(() => setTotalSemesters(null))
    fetchToday()
  }, [userId, fetchToday])

  // sgpa/totalCredits are nullable in the schema even though the save path
  // always provides both — filter defensively before the shared CGPA math.
  const valid = semesters.filter(
    (s): s is GradeSheet & { sgpa: number; totalCredits: number } => s.sgpa != null && s.totalCredits != null
  )
  const latest = valid.length > 0 ? valid[valid.length - 1] : null
  const cgpa = computeCgpaSimple(valid)
  const completedSemesters = valid.length
  const completedCredits = valid.reduce((s, r) => s + r.totalCredits, 0)

  const totalDisplay = totalSemesters ?? DEFAULT_TOTAL_SEMESTERS
  const degreePct = (completedSemesters / totalDisplay) * 100

  const changeTotalSemesters = (n: number) => {
    setTotalSemesters(n)
    updateTotalSemesters(userId, n).catch(() => {})
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
      {/* 1. Latest SGPA */}
      <StatCard title="Latest SGPA" accent="indigo" delay={0} icon={<GraduationCap className="w-3.5 h-3.5" />}>
        <div className="text-3xl font-bold font-display leading-none mb-1.5 text-indigo-300">
          {latest ? <AnimatedNumber value={latest.sgpa} decimals={2} /> : '—'}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {latest ? `Semester ${latest.semesterNumber}` : 'No data yet'}
        </p>
      </StatCard>

      {/* 2. CGPA */}
      <StatCard title="CGPA" accent="violet" delay={0.05} icon={<BarChart3 className="w-3.5 h-3.5" />}>
        <div className="text-3xl font-bold font-display leading-none mb-1.5 text-violet-300">
          {cgpa != null ? <AnimatedNumber value={cgpa} decimals={2} /> : '—'}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {latest ? `After Semester ${latest.semesterNumber}` : 'No data yet'}
        </p>
      </StatCard>

      {/* 3. Today's Classes */}
      <StatCard title="Today's Classes" accent="cyan" delay={0.1} icon={<Clock className="w-3.5 h-3.5" />}>
        {todayError ? (
          <>
            <div className="text-sm font-semibold text-red-400 mb-1">Couldn&apos;t load</div>
            <button onClick={fetchToday} className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
              Try again
            </button>
          </>
        ) : todayCount === 0 ? (
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
      </StatCard>

      {/* 4. Degree Progress */}
      <StatCard title="Degree Progress" accent="emerald" delay={0.15} icon={<Target className="w-3.5 h-3.5" />}>
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
        <StatProgressBar pct={degreePct} accent="emerald" delay={0.15} />
        <p className="text-[10px] text-muted-foreground mt-1">{Math.round(degreePct)}% Complete</p>
      </StatCard>

      {/* 5. Credits Earned */}
      <StatCard title="Credits Earned" accent="amber" delay={0.2} icon={<Award className="w-3.5 h-3.5" />}>
        <div className="text-3xl font-bold font-display leading-none mb-1.5 text-amber-300">
          <AnimatedNumber value={completedCredits} />
        </div>
        <p className="text-[11px] text-muted-foreground">Credits Completed</p>
      </StatCard>
    </div>
  )
}
