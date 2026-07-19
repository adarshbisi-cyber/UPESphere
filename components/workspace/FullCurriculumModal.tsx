'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { BookOpen, Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { UploadModalShell } from '@/components/workspace/UploadModalShell'
import { CurriculumUploadModal } from '@/components/workspace/CurriculumUploadModal'
import { Button } from '@/components/ui/button'
import { getAllCurriculumSubjects, deleteCurriculumSemester, type CurriculumSemesterGroup } from '@/lib/onboarding/api'
import { describeSaveError } from '@/lib/onboarding/errors'

type Status = 'loading' | 'ready' | 'error'

export function FullCurriculumModal({
  userId,
  onClose,
  onChanged,
}: {
  userId: string
  onClose: () => void
  onChanged: () => void
}) {
  const [groups, setGroups] = useState<CurriculumSemesterGroup[]>([])
  const [status, setStatus] = useState<Status>('loading')
  // Which semester's upload flow is open — null means closed, 'new' means
  // adding a semester not yet in the list.
  const [uploadTarget, setUploadTarget] = useState<number | 'new' | null>(null)
  const [deletingSemester, setDeletingSemester] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const refresh = useCallback(() => {
    setStatus('loading')
    getAllCurriculumSubjects(userId)
      .then(g => { setGroups(g); setStatus('ready') })
      .catch(() => setStatus('error'))
  }, [userId])

  useEffect(() => { refresh() }, [refresh])

  const handleUploadSaved = () => {
    setUploadTarget(null)
    refresh()
    onChanged()
  }

  const handleDelete = async (semesterNumber: number) => {
    if (deletingSemester) return
    setDeletingSemester(semesterNumber)
    setDeleteError('')
    try {
      await deleteCurriculumSemester(userId, semesterNumber)
      refresh()
      onChanged()
    } catch (err) {
      setDeleteError(describeSaveError(err))
    } finally {
      setDeletingSemester(null)
    }
  }

  return (
    <>
      <UploadModalShell onClose={onClose} maxWidth="max-w-lg">
        <h2 className="text-xl font-bold font-display tracking-tight mb-1.5 text-center pr-6">Full Curriculum</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">Every semester's saved courses, in one place.</p>

        {status === 'loading' && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">Couldn&apos;t load your curriculum.</p>
            <Button variant="outline" onClick={refresh}>Try again</Button>
          </div>
        )}

        {status === 'ready' && groups.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">No curriculum uploaded yet.</p>
            <Button variant="gradient" className="gap-2" onClick={() => setUploadTarget('new')}>
              <Plus className="w-4 h-4" />
              Upload Curriculum
            </Button>
          </div>
        )}

        {status === 'ready' && groups.length > 0 && (
          <>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {groups.map(g => (
                <div key={g.semesterNumber} className="rounded-xl p-3.5" style={{ background: 'var(--muted-surface)' }}>
                  <div className="flex items-center justify-between mb-2.5 gap-3">
                    <span className="text-sm font-semibold font-display">Semester {g.semesterNumber}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => setUploadTarget(g.semesterNumber)}
                        className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleDelete(g.semesterNumber)}
                        disabled={deletingSemester === g.semesterNumber}
                        className="text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
                        aria-label={`Delete Semester ${g.semesterNumber}`}
                      >
                        {deletingSemester === g.semesterNumber
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {g.subjects.map(s => (
                      <div key={s.id} className="flex items-center gap-2.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="flex-1 text-sm truncate">{s.name}</span>
                        <span className="text-xs font-mono text-muted-foreground shrink-0">{s.credits}cr</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {deleteError && (
              <div className="flex items-start gap-2 mt-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-300">{deleteError}</p>
              </div>
            )}

            <button
              onClick={() => setUploadTarget('new')}
              className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-indigo-400 hover:text-indigo-300 border border-dashed transition-colors"
              style={{ borderColor: 'var(--divider)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add curriculum for another semester
            </button>
          </>
        )}
      </UploadModalShell>

      <AnimatePresence>
        {uploadTarget !== null && (
          <CurriculumUploadModal
            userId={userId}
            onClose={() => setUploadTarget(null)}
            onSaved={handleUploadSaved}
            initialSemester={uploadTarget === 'new' ? undefined : uploadTarget}
            syncCurrentSemester={false}
          />
        )}
      </AnimatePresence>
    </>
  )
}
