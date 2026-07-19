'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { GradebookSemester } from '@/lib/gradebook/api'

export function SemesterGradebookTable({ semesters }: { semesters: GradebookSemester[] }) {
  const [activeId, setActiveId] = useState(semesters[0]?.id)
  const active = semesters.find(s => s.id === activeId) ?? semesters[0]
  if (!active) return null

  return (
    <GlassCard className="p-6">
      <h3 className="text-base font-semibold font-display mb-4">Semester Gradebook</h3>

      {/* Tabs — only for semesters that actually have parsed data */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1">
        {semesters.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveId(s.id)}
            className={cn(
              'shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap',
              s.id === active.id
                ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                : 'border-white/10 text-muted-foreground hover:text-foreground hover:border-white/25'
            )}
          >
            {s.name || `Semester ${s.semesterNumber}`}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
      {active.subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No subject-level data was found in this semester's grade sheet.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b" style={{ borderColor: 'var(--divider)' }}>
                  <th className="pb-2 font-medium">Subject</th>
                  <th className="pb-2 font-medium text-right">Credits</th>
                  <th className="pb-2 font-medium text-right">Grade</th>
                  <th className="pb-2 font-medium text-right">Grade Point</th>
                  <th className="pb-2 font-medium text-right">Credit Points</th>
                </tr>
              </thead>
              <tbody>
                {active.subjects.map((s, i) => (
                  <tr key={i} className="border-b last:border-0" style={{ borderColor: 'var(--divider)' }}>
                    <td className="py-2.5 pr-3 max-w-[260px] truncate">{s.name}</td>
                    <td className="py-2.5 text-right font-mono">{s.credits}</td>
                    <td className="py-2.5 text-right font-semibold text-indigo-400">{s.grade}</td>
                    <td className="py-2.5 text-right font-mono">{s.gradePoints.toFixed(1)}</td>
                    <td className="py-2.5 text-right font-mono">{(s.credits * s.gradePoints).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {active.subjects.map((s, i) => (
              <div key={i} className="rounded-xl p-3" style={{ background: 'var(--muted-surface)' }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-medium truncate">{s.name}</span>
                  <span className="text-sm font-semibold text-indigo-400 shrink-0">{s.grade}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{s.credits} cr</span>
                  <span>{s.gradePoints.toFixed(1)} GP</span>
                  <span>{(s.credits * s.gradePoints).toFixed(1)} CP</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: '1px solid var(--divider)' }}>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Semester SGPA</p>
          <p className="text-2xl font-bold font-display text-emerald-400">{active.sgpa ?? '—'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-0.5">Total Credits</p>
          <p className="text-lg font-semibold">{active.totalCredits ?? '—'}</p>
        </div>
      </div>
    </GlassCard>
  )
}
