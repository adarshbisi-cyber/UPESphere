'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGrid, User, BookOpen, CalendarClock, GraduationCap, FileText, Check, ArrowRight } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { cn, EASE_OUT } from '@/lib/utils'
import { getWorkspaceDetails, type WorkspaceDetails } from '@/lib/onboarding/api'
import { ProfileEditModal } from '@/components/workspace/ProfileEditModal'
import { CurriculumUploadModal } from '@/components/workspace/CurriculumUploadModal'
import { TimetableUploadModal } from '@/components/workspace/TimetableUploadModal'
import { GradeSheetsManagerModal } from '@/components/workspace/GradeSheetsManagerModal'
import { ResumeUploadModal } from '@/components/workspace/ResumeUploadModal'

type ItemKey = 'profile' | 'curriculum' | 'timetable' | 'gradeCard' | 'resume'

const ITEMS: { key: ItemKey; label: string; icon: typeof User }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'curriculum', label: 'Curriculum', icon: BookOpen },
  { key: 'timetable', label: 'Timetable', icon: CalendarClock },
  { key: 'gradeCard', label: 'Grade Sheets', icon: GraduationCap },
  { key: 'resume', label: 'Resume', icon: FileText },
]

// "Today" / "Yesterday" / "12 Jul" — a light-touch relative date.
function formatUpdated(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000)
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function statusText(key: ItemKey, done: boolean, count: number): string {
  if (!done) return 'Missing'
  switch (key) {
    case 'profile': return 'Complete'
    case 'gradeCard': return `${count} Semester${count !== 1 ? 's' : ''} Uploaded`
    case 'resume': return 'ATS Ready'
    default: return 'Uploaded'
  }
}

function actionLabel(key: ItemKey, done: boolean): string {
  if (!done) return key === 'profile' ? 'Complete' : 'Upload'
  switch (key) {
    case 'profile': return 'Edit'
    case 'gradeCard': return 'Manage'
    default: return 'Replace'
  }
}

export function AcademicWorkspace({ userId }: { userId: string }) {
  const [details, setDetails] = useState<WorkspaceDetails | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [openModal, setOpenModal] = useState<ItemKey | null>(null)
  const [expanded, setExpanded] = useState(false)

  const refresh = useCallback(() => {
    setStatus('loading')
    getWorkspaceDetails(userId)
      .then(d => { setDetails(d); setStatus('ready') })
      .catch(() => setStatus('error'))
  }, [userId])

  useEffect(() => { refresh() }, [refresh])

  // A network failure and "nothing uploaded yet" must not look identical — a
  // student mid-panic before an exam needs to know which one they're seeing.
  if (status === 'error') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.03] px-5 py-3.5 mb-8">
        <span className="text-sm text-muted-foreground">Couldn&apos;t load your Academic Workspace.</span>
        <button onClick={refresh} className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
          Try again
        </button>
      </div>
    )
  }

  if (!details) return null // still loading

  const flags = ITEMS.map(i => details[i.key].done)
  const pct = Math.round((flags.filter(Boolean).length / flags.length) * 100)
  const complete = pct === 100
  const closeModal = () => setOpenModal(null)
  const handleSaved = () => { closeModal(); refresh() }

  // Once every document is on file, the checklist has done its job — collapse it to a
  // single-line status chip so it stops outranking the SGPA/CGPA numbers above it on
  // every return visit. Still expandable for anyone who wants to replace a document.
  if (complete && !expanded) {
    return (
      <motion.button
        type="button"
        onClick={() => setExpanded(true)}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] px-5 py-3.5 mb-8 hover:border-emerald-500/35 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-emerald-400" />
          </span>
          <span className="text-sm font-semibold font-display text-foreground truncate">Academic Workspace</span>
          <span className="text-sm text-muted-foreground truncate">— all documents up to date</span>
        </div>
        <span className="text-xs font-medium text-indigo-400/80 shrink-0">Manage</span>
      </motion.button>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <GlassCard className="p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
              <LayoutGrid className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-sm font-semibold font-display">Academic Workspace</span>
          </div>
          <span className="text-sm font-mono text-indigo-400">{pct}% Complete</span>
        </div>

        <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--divider)' }}>
          <motion.div
            className="h-full w-full rounded-full origin-left"
            style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }}
            initial={{ transform: 'scaleX(0)' }}
            animate={{ transform: `scaleX(${pct / 100})` }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          />
        </div>
        <p className="text-xs text-muted-foreground mb-4">Click any document below to update or replace it.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {ITEMS.map(item => {
            const d = details[item.key]
            const Icon = item.icon
            const updated = formatUpdated(d.lastUpdated)
            return (
              <button
                key={item.key}
                onClick={() => setOpenModal(item.key)}
                className={cn(
                  'group relative flex flex-col text-left rounded-xl p-3.5 border transition-all duration-200',
                  'hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5',
                  d.done ? 'border-white/10' : 'border-dashed border-white/15'
                )}
                style={{ background: 'var(--muted-surface)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  {d.done && (
                    <span className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                    </span>
                  )}
                </div>

                <div className="text-sm font-semibold text-foreground">{item.label}</div>
                <div className={cn('text-[11px] mt-0.5', d.done ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400')}>
                  {statusText(item.key, d.done, d.count)}
                </div>
                {updated && <div className="text-[10px] text-muted-foreground mt-0.5">Updated {updated}</div>}

                <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400/70 group-hover:text-indigo-300 transition-colors">
                  {actionLabel(item.key, d.done)}
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            )
          })}
        </div>
      </GlassCard>

      <AnimatePresence>
        {openModal === 'profile' && (
          <ProfileEditModal userId={userId} onClose={closeModal} onSaved={handleSaved} />
        )}
        {openModal === 'curriculum' && (
          <CurriculumUploadModal userId={userId} onClose={closeModal} onSaved={handleSaved} />
        )}
        {openModal === 'timetable' && (
          <TimetableUploadModal userId={userId} hasExisting={details.timetable.done} onClose={closeModal} onSaved={handleSaved} />
        )}
        {openModal === 'gradeCard' && (
          <GradeSheetsManagerModal userId={userId} onClose={closeModal} onSaved={handleSaved} />
        )}
        {openModal === 'resume' && (
          <ResumeUploadModal userId={userId} hasExisting={details.resume.done} onClose={closeModal} onSaved={handleSaved} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
