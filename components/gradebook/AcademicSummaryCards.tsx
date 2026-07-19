'use client'

import { useEffect, useState } from 'react'
import { GraduationCap, BarChart3, Award, Target } from 'lucide-react'
import { AnimatedNumber, StatCard, StatProgressBar } from '@/components/shared/StatCard'
import { getTotalSemesters } from '@/lib/onboarding/api'
import { computeCgpaSimple } from '@/lib/calculations/cgpa'
import type { GradebookSemester } from '@/lib/gradebook/api'

const DEFAULT_TOTAL_SEMESTERS = 8

// The same four academic figures shown on the Dashboard (Latest SGPA, CGPA,
// Credits Earned, Semesters Completed) — same computeCgpaSimple/getTotalSemesters
// calls, same semesters prop shape, so the numbers can never diverge from the
// Dashboard's SummaryCards.
export function AcademicSummaryCards({ userId, semesters }: { userId: string; semesters: GradebookSemester[] }) {
  const [totalSemesters, setTotalSemesters] = useState<number | null>(null)

  useEffect(() => {
    getTotalSemesters(userId).then(setTotalSemesters).catch(() => setTotalSemesters(null))
  }, [userId])

  const valid = semesters.filter(
    (s): s is GradebookSemester & { sgpa: number; totalCredits: number } => s.sgpa != null && s.totalCredits != null
  )
  const latest = valid.length > 0 ? valid[valid.length - 1] : null
  const cgpa = computeCgpaSimple(valid)
  const completedSemesters = valid.length
  const completedCredits = valid.reduce((s, r) => s + r.totalCredits, 0)
  const totalDisplay = totalSemesters ?? DEFAULT_TOTAL_SEMESTERS
  const degreePct = (completedSemesters / totalDisplay) * 100

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      <StatCard title="Latest SGPA" accent="indigo" delay={0} icon={<GraduationCap className="w-3.5 h-3.5" />}>
        <div className="text-3xl font-bold font-display leading-none mb-1.5 text-indigo-300">
          {latest ? <AnimatedNumber value={latest.sgpa} decimals={2} /> : '—'}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {latest ? `Semester ${latest.semesterNumber}` : 'No data yet'}
        </p>
      </StatCard>

      <StatCard title="CGPA" accent="violet" delay={0.05} icon={<BarChart3 className="w-3.5 h-3.5" />}>
        <div className="text-3xl font-bold font-display leading-none mb-1.5 text-violet-300">
          {cgpa != null ? <AnimatedNumber value={cgpa} decimals={2} /> : '—'}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {latest ? `After Semester ${latest.semesterNumber}` : 'No data yet'}
        </p>
      </StatCard>

      <StatCard title="Credits Earned" accent="amber" delay={0.1} icon={<Award className="w-3.5 h-3.5" />}>
        <div className="text-3xl font-bold font-display leading-none mb-1.5 text-amber-300">
          <AnimatedNumber value={completedCredits} />
        </div>
        <p className="text-[11px] text-muted-foreground">Credits Completed</p>
      </StatCard>

      <StatCard title="Semesters Completed" accent="emerald" delay={0.15} icon={<Target className="w-3.5 h-3.5" />}>
        <div className="flex items-baseline gap-1 mb-1 text-emerald-300">
          <span className="text-3xl font-bold font-display leading-none">
            <AnimatedNumber value={completedSemesters} />
          </span>
          <span className="text-base text-muted-foreground font-medium">/ {totalDisplay}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">Semesters Completed</p>
        <StatProgressBar pct={degreePct} accent="emerald" delay={0.15} />
      </StatCard>
    </div>
  )
}
