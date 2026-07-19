'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ArrowRight, Upload } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CurriculumUploadModal } from '@/components/workspace/CurriculumUploadModal'
import { FullCurriculumModal } from '@/components/workspace/FullCurriculumModal'
import { getCurrentSemesterCurriculum, type CurrentSemesterCurriculum } from '@/lib/onboarding/api'
import { EASE_OUT } from '@/lib/utils'

const VISIBLE_LIMIT = 6

type Status = 'loading' | 'ready' | 'error'

export function MyCourses({ userId }: { userId: string }) {
  const [data, setData] = useState<CurrentSemesterCurriculum | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  // 'upload' = first-time upload (no curriculum at all yet); 'browse' = the
  // read-only Full Curriculum view (View Full Curriculum / Review Curriculum).
  const [modal, setModal] = useState<'upload' | 'browse' | null>(null)

  const refresh = useCallback(() => {
    setStatus('loading')
    getCurrentSemesterCurriculum(userId)
      .then(d => { setData(d); setStatus('ready') })
      .catch(() => setStatus('error'))
  }, [userId])

  useEffect(() => { refresh() }, [refresh])

  const handleUploadSaved = () => { setModal(null); refresh() }

  // A fetch failure and "nothing uploaded yet" must not look identical.
  if (status === 'error') {
    return (
      <GlassCard className="p-5 mb-8">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Couldn&apos;t load My Courses.</span>
          <button onClick={refresh} className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            Try again
          </button>
        </div>
      </GlassCard>
    )
  }

  if (status === 'loading' || !data) return null // still loading

  const { semesterNumber, subjects, hasAnyCurriculumUploaded } = data
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0)
  const visible = subjects.slice(0, VISIBLE_LIMIT)
  const remaining = subjects.length - visible.length

  return (
    <>
      <GlassCard className="p-5 mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold font-display">
            My Courses
            {hasAnyCurriculumUploaded && (
              <span className="text-muted-foreground font-normal"> — Semester {semesterNumber}</span>
            )}
          </h3>
        </div>

        {!hasAnyCurriculumUploaded ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Upload your curriculum to see your current semester courses here.
            </p>
            <Button variant="gradient" className="gap-2" onClick={() => setModal('upload')}>
              <Upload className="w-4 h-4" />
              Upload Curriculum
            </Button>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">No courses found for your current semester.</p>
            <Button variant="outline" onClick={() => setModal('browse')}>Review Curriculum</Button>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4 ml-9">
              {subjects.length} Course{subjects.length !== 1 ? 's' : ''} • {totalCredits} Credits
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {visible.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.03, ease: EASE_OUT }}
                  className="flex items-start gap-2.5 rounded-xl p-3 min-w-0"
                  style={{ background: 'var(--muted-surface)' }}
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground leading-snug break-words">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {s.credits} Credit{s.credits !== 1 ? 's' : ''}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {remaining > 0 ? `+ ${remaining} more course${remaining !== 1 ? 's' : ''}` : ''}
              </span>
              <button
                onClick={() => setModal('browse')}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1 shrink-0"
              >
                View Full Curriculum <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </GlassCard>

      <AnimatePresence>
        {modal === 'upload' && (
          <CurriculumUploadModal userId={userId} onClose={() => setModal(null)} onSaved={handleUploadSaved} />
        )}
        {modal === 'browse' && (
          <FullCurriculumModal userId={userId} onClose={() => setModal(null)} onChanged={refresh} />
        )}
      </AnimatePresence>
    </>
  )
}
