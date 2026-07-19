'use client'

import { GlassCard } from '@/components/ui/card'
import { buildGradeDistribution } from '@/lib/calculations/gradebookInsights'
import type { GradebookSemester } from '@/lib/gradebook/api'

const GRADE_COLORS: Record<string, string> = {
  'O': '#10b981', 'A+': '#6366f1', 'A': '#8b5cf6', 'B+': '#06b6d4',
  'B': '#f59e0b', 'C': '#f97316', 'P': '#94a3b8', 'F': '#ef4444',
}

export function GradeDistribution({ semesters }: { semesters: GradebookSemester[] }) {
  const dist = buildGradeDistribution(semesters)
  // Hides gracefully when there's no subject-level grade data to distribute.
  if (dist.length === 0) return null
  const max = Math.max(...dist.map(d => d.count))

  return (
    <GlassCard className="p-6">
      <h3 className="text-base font-semibold font-display mb-1">Grade Distribution</h3>
      <p className="text-xs text-muted-foreground mb-5">How your grades break down across all subjects</p>
      <div className="space-y-2.5">
        {dist.map(d => (
          <div key={d.grade} className="flex items-center gap-3">
            <span className="w-8 text-sm font-semibold shrink-0" style={{ color: GRADE_COLORS[d.grade] ?? '#a1a1aa' }}>{d.grade}</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(d.count / max) * 100}%`, background: GRADE_COLORS[d.grade] ?? '#a1a1aa' }}
              />
            </div>
            <span className="w-6 text-right text-sm text-muted-foreground shrink-0">{d.count}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
