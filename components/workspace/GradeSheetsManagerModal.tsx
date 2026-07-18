'use client'

import { useEffect, useState } from 'react'
import { GraduationCap, Trash2, Plus, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UploadModalShell } from '@/components/workspace/UploadModalShell'
import { GradeCardUploadModal } from '@/components/workspace/GradeCardUploadModal'
import { getGradeSheets, deleteGradeSheet, type GradeSheet } from '@/lib/onboarding/api'
import { describeSaveError } from '@/lib/onboarding/errors'

export function GradeSheetsManagerModal({
  userId,
  onClose,
  onSaved,
}: {
  userId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [sheets, setSheets] = useState<GradeSheet[] | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = () => getGradeSheets(userId).then(setSheets).catch(() => setSheets([]))
  useEffect(() => { load() }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close routes through onSaved (refresh the workspace card) only if something
  // actually changed, otherwise a plain close.
  const close = () => { if (dirty) onSaved(); else onClose() }

  const handleDelete = async (id: string) => {
    if (deletingId) return
    setDeletingId(id)
    setError('')
    try {
      await deleteGradeSheet(userId, id)
      setDirty(true)
      await load()
    } catch (err) {
      setError(describeSaveError(err))
    } finally {
      setDeletingId(null)
    }
  }

  const handleUploadSaved = () => {
    setShowUpload(false)
    setDirty(true)
    load()
  }

  return (
    <>
      <UploadModalShell onClose={close}>
        <h2 className="text-xl font-bold font-display tracking-tight mb-1.5 text-center pr-6">Manage Grade Sheets</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">Add, replace, or remove semester grade sheets.</p>

        {sheets === null ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          </div>
        ) : sheets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No grade sheets yet. Add your first semester below.</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {sheets.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: 'var(--muted-surface)' }}>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.name || `Semester ${s.semesterNumber}`}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {s.sgpa != null && <span className="text-emerald-400 font-mono">{s.sgpa} SGPA</span>}
                    {s.sgpa != null && s.totalCredits != null && ' · '}
                    {s.totalCredits != null && <span>{s.totalCredits} cr</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={deletingId === s.id}
                  className="text-muted-foreground hover:text-red-400 transition-colors shrink-0 disabled:opacity-50"
                  aria-label={`Delete ${s.name || `Semester ${s.semesterNumber}`}`}
                >
                  {deletingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 mt-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <button
          onClick={() => setShowUpload(true)}
          className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-indigo-500/25 hover:border-indigo-500/45 hover:bg-indigo-500/[0.03] text-sm text-indigo-400 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add / Replace a semester
        </button>

        <div className="flex mt-4">
          <Button variant="ghost" className="ml-auto" onClick={close}>Done</Button>
        </div>
      </UploadModalShell>

      {showUpload && (
        <GradeCardUploadModal userId={userId} onClose={() => setShowUpload(false)} onSaved={handleUploadSaved} />
      )}
    </>
  )
}
