'use client'

import { useState } from 'react'
import { GraduationCap, Check, Plus } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GradeSheetsManagerModal } from '@/components/workspace/GradeSheetsManagerModal'
import type { GradebookSemester } from '@/lib/gradebook/api'

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Reuses the exact GradeSheetsManagerModal already built for the Dashboard's
// Academic Workspace card — same add/replace/delete logic, same per-semester
// scoping (replacing Semester 2 only ever touches Semester 2's row), so
// there's no separate/duplicate grade-sheet management implementation here.
export function GradeSheetsSection({
  userId,
  semesters,
  onChanged,
}: {
  userId: string
  semesters: GradebookSemester[]
  onChanged: () => void
}) {
  const [showManager, setShowManager] = useState(false)

  return (
    <GlassCard className="p-6">
      <h3 className="text-base font-semibold font-display mb-1">Grade Sheets</h3>
      <p className="text-xs text-muted-foreground mb-5">Manage your semester-wise academic records</p>

      <div className="space-y-2 mb-5">
        {semesters.map(s => (
          <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--muted-surface)' }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{s.name || `Semester ${s.semesterNumber}`}</div>
                <div className="text-[11px] text-emerald-400 inline-flex items-center gap-1">
                  <Check className="w-3 h-3" /> Processed
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] text-muted-foreground mb-1">Uploaded: {formatDate(s.createdAt)}</div>
              <button onClick={() => setShowManager(true)} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Manage
              </button>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="gap-1.5" onClick={() => setShowManager(true)}>
        <Plus className="w-4 h-4" /> Add Grade Sheet
      </Button>

      {showManager && (
        <GradeSheetsManagerModal
          userId={userId}
          onClose={() => setShowManager(false)}
          onSaved={() => { setShowManager(false); onChanged() }}
        />
      )}
    </GlassCard>
  )
}
