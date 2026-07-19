'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/ui/card'
import { compareSemesters } from '@/lib/calculations/gradebookInsights'
import type { GradebookSemester } from '@/lib/gradebook/api'

const selectClass = 'flex-1 h-10 rounded-xl border px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50'
const selectStyle = { borderColor: 'var(--divider)', background: 'var(--muted-surface)' } as const

function fmtDiff(n: number | null, decimals = 2): string {
  if (n == null) return '—'
  const rounded = Number(n.toFixed(decimals))
  return `${rounded > 0 ? '+' : ''}${rounded}`
}

export function SemesterComparison({ semesters }: { semesters: GradebookSemester[] }) {
  const [aId, setAId] = useState(semesters[0]?.id)
  const [bId, setBId] = useState(semesters[1]?.id ?? semesters[0]?.id)

  // Comparing needs at least two semesters to be meaningful.
  if (semesters.length < 2) return null

  const a = semesters.find(s => s.id === aId) ?? semesters[0]
  const b = semesters.find(s => s.id === bId) ?? semesters[1]
  const result = compareSemesters(semesters, a, b)

  return (
    <GlassCard className="p-6">
      <h3 className="text-base font-semibold font-display mb-1">Compare Semesters</h3>
      <p className="text-xs text-muted-foreground mb-5">See how two semesters stack up against each other</p>

      <div className="flex items-center gap-3 mb-6">
        <select value={aId} onChange={e => setAId(e.target.value)} className={selectClass} style={selectStyle}>
          {semesters.map(s => <option key={s.id} value={s.id}>{s.name || `Semester ${s.semesterNumber}`}</option>)}
        </select>
        <span className="text-xs text-muted-foreground font-semibold shrink-0">VS</span>
        <select value={bId} onChange={e => setBId(e.target.value)} className={selectClass} style={selectStyle}>
          {semesters.map(s => <option key={s.id} value={s.id}>{s.name || `Semester ${s.semesterNumber}`}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--muted-surface)' }}>
          <div className="text-[11px] text-muted-foreground mb-1">SGPA Difference</div>
          <div className={`text-lg font-bold font-display ${result.sgpaDiff != null && result.sgpaDiff > 0 ? 'text-emerald-400' : result.sgpaDiff != null && result.sgpaDiff < 0 ? 'text-red-400' : 'text-foreground'}`}>
            {fmtDiff(result.sgpaDiff)}
          </div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--muted-surface)' }}>
          <div className="text-[11px] text-muted-foreground mb-1">Credits Difference</div>
          <div className="text-lg font-bold font-display">{fmtDiff(result.creditsDiff, 0)}</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--muted-surface)' }}>
          <div className="text-[11px] text-muted-foreground mb-1">CGPA Progression</div>
          <div className="text-sm font-semibold mt-1.5">
            {result.cgpaA?.toFixed(2) ?? '—'} → {result.cgpaB?.toFixed(2) ?? '—'}
          </div>
        </div>
      </div>

      {result.subjects.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Common Subjects</p>
          <div className="space-y-1.5">
            {result.subjects.map(s => (
              <div key={s.name} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--muted-surface)' }}>
                <span className="truncate pr-2">{s.name}</span>
                <span className="text-muted-foreground shrink-0 font-mono text-xs">{s.gradeA} → {s.gradeB}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">No common subjects to compare between these semesters.</p>
      )}
    </GlassCard>
  )
}
