// Deterministic, rule-based Gradebook insights — no LLM, no fabricated data.
// Every insight here is derived directly from the user's own parsed semester
// records; if there isn't enough data to compute one reliably, it's simply
// omitted rather than shown with a placeholder value.

import { Trophy, TrendingUp, TrendingDown, Star, Lightbulb } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { computeCgpaSimple } from '@/lib/calculations/cgpa'
import type { GradebookSemester, GradebookSubject } from '@/lib/gradebook/api'

export interface GradebookInsight {
  type: 'success' | 'tip' | 'info' | 'warning'
  icon: LucideIcon
  color: string
  bg: string
  border: string
  title: string
  body: string
}

const GRADE_ORDER = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F']

export function buildPerformanceInsights(semesters: GradebookSemester[]): GradebookInsight[] {
  const insights: GradebookInsight[] = []
  const valid = semesters.filter(s => s.sgpa != null)
  if (valid.length === 0) return insights

  // Highest SGPA (doubles as "best performing semester" — same computation,
  // shown once rather than as two near-identical cards).
  const best = valid.reduce((m, s) => ((s.sgpa as number) > (m.sgpa as number) ? s : m), valid[0])
  insights.push({
    type: 'success',
    icon: Trophy,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    title: 'Highest SGPA',
    body: `Your highest SGPA is ${best.sgpa} in ${best.name || `Semester ${best.semesterNumber}`}.`,
  })

  // CGPA trend vs the previous semester.
  if (valid.length >= 2) {
    const upToLast = computeCgpaSimple(valid.map(s => ({ sgpa: s.sgpa as number, totalCredits: s.totalCredits as number })))
    const upToPrev = computeCgpaSimple(
      valid.slice(0, -1).map(s => ({ sgpa: s.sgpa as number, totalCredits: s.totalCredits as number }))
    )
    if (upToLast != null && upToPrev != null) {
      const delta = Math.round((upToLast - upToPrev) * 100) / 100
      if (Math.abs(delta) >= 0.01) {
        const improved = delta > 0
        insights.push({
          type: improved ? 'success' : 'tip',
          icon: improved ? TrendingUp : TrendingDown,
          color: improved ? 'text-emerald-400' : 'text-amber-400',
          bg: improved ? 'bg-emerald-500/10' : 'bg-amber-500/10',
          border: improved ? 'border-emerald-500/20' : 'border-amber-500/20',
          title: 'CGPA Trend',
          body: `Your CGPA ${improved ? 'improved' : 'decreased'} by ${Math.abs(delta).toFixed(2)} compared with the previous semester.`,
        })
      }
    }
  }

  // Strongest / improvement-opportunity subjects — only when subject-level
  // grade data actually exists. Credited subjects only (0-credit audit
  // courses aren't meaningfully comparable on a grade-point scale).
  const allSubjects: GradebookSubject[] = valid.flatMap(s => s.subjects).filter(s => s.credits > 0)
  if (allSubjects.length > 0) {
    const strongest = allSubjects.reduce((m, s) => (s.gradePoints > m.gradePoints ? s : m), allSubjects[0])
    insights.push({
      type: 'success',
      icon: Star,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
      title: 'Strongest Subject',
      body: `${strongest.name} is one of your strongest-performing subjects.`,
    })

    const weakest = allSubjects.reduce((m, s) => (s.gradePoints < m.gradePoints ? s : m), allSubjects[0])
    if (weakest.name !== strongest.name) {
      insights.push({
        type: 'tip',
        icon: Lightbulb,
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/20',
        title: 'Improvement Opportunity',
        body: `${weakest.name} could be a great place to focus next — a little extra attention here goes a long way.`,
      })
    }
  }

  return insights
}

export interface GradeDistributionEntry {
  grade: string
  count: number
}

export function buildGradeDistribution(semesters: GradebookSemester[]): GradeDistributionEntry[] {
  const counts = new Map<string, number>()
  for (const sem of semesters) {
    for (const subj of sem.subjects) {
      counts.set(subj.grade, (counts.get(subj.grade) ?? 0) + 1)
    }
  }
  if (counts.size === 0) return []

  const known = GRADE_ORDER.filter(g => counts.has(g)).map(g => ({ grade: g, count: counts.get(g)! }))
  const unknown = Array.from(counts.entries())
    .filter(([g]) => !GRADE_ORDER.includes(g))
    .map(([grade, count]) => ({ grade, count }))
  return [...known, ...unknown]
}

export interface SemesterComparisonSubject {
  name: string
  gradeA: string
  gradeB: string
  gradePointsA: number
  gradePointsB: number
}

export interface SemesterComparisonResult {
  sgpaDiff: number | null
  creditsDiff: number | null
  cgpaA: number | null
  cgpaB: number | null
  subjects: SemesterComparisonSubject[]
}

// Compares two semesters. Subject-level comparison only includes subjects
// that appear (by exact name) in both semesters — never forced across
// semesters with entirely different subjects.
export function compareSemesters(
  allSemestersInOrder: GradebookSemester[],
  a: GradebookSemester,
  b: GradebookSemester
): SemesterComparisonResult {
  const upTo = (target: GradebookSemester) => {
    const idx = allSemestersInOrder.findIndex(s => s.id === target.id)
    if (idx === -1) return null
    const slice = allSemestersInOrder.slice(0, idx + 1).filter(s => s.sgpa != null && s.totalCredits != null)
    return computeCgpaSimple(slice.map(s => ({ sgpa: s.sgpa as number, totalCredits: s.totalCredits as number })))
  }

  const namesA = new Map(a.subjects.map(s => [s.name.trim().toLowerCase(), s]))
  const subjects: SemesterComparisonSubject[] = []
  for (const subjB of b.subjects) {
    const subjA = namesA.get(subjB.name.trim().toLowerCase())
    if (subjA) {
      subjects.push({
        name: subjB.name,
        gradeA: subjA.grade,
        gradeB: subjB.grade,
        gradePointsA: subjA.gradePoints,
        gradePointsB: subjB.gradePoints,
      })
    }
  }

  return {
    sgpaDiff: a.sgpa != null && b.sgpa != null ? Math.round((b.sgpa - a.sgpa) * 100) / 100 : null,
    creditsDiff: a.totalCredits != null && b.totalCredits != null ? b.totalCredits - a.totalCredits : null,
    cgpaA: upTo(a),
    cgpaB: upTo(b),
    subjects,
  }
}
