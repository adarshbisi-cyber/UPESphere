'use client'

import { motion } from 'framer-motion'
import { PartyPopper, ArrowRight, Check, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, EASE_OUT } from '@/lib/utils'

export interface WorkspaceChecklist {
  profile: boolean
  curriculum: boolean
  timetable: boolean
  gradeCard: boolean
  resume: boolean
}

const LABELS: Record<keyof WorkspaceChecklist, string> = {
  profile: 'Profile',
  curriculum: 'Curriculum',
  timetable: 'Timetable',
  gradeCard: 'Grade Card',
  resume: 'Resume',
}

export function FinalStep({ status, onGoToDashboard }: { status: WorkspaceChecklist; onGoToDashboard: () => void }) {
  const entries = Object.entries(status) as [keyof WorkspaceChecklist, boolean][]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="text-center max-w-md mx-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
        className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #10b981, #6366f1)', boxShadow: '0 12px 32px rgba(16,185,129,0.3)' }}
      >
        <PartyPopper className="w-9 h-9 text-white" />
      </motion.div>

      <h1 className="text-3xl font-bold font-display tracking-tight mb-2">Congratulations 🎉</h1>
      <p className="text-muted-foreground mb-8">Your Academic Workspace is Ready.</p>

      <div className="rounded-2xl p-5 mb-8 text-left" style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}>
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">Workspace Status</div>
        <div className="space-y-2.5">
          {entries.map(([key, done], i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
              className="flex items-center gap-2.5"
            >
              {done
                ? <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                : <Square className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
              <span className={cn('text-sm', done ? 'text-foreground' : 'text-muted-foreground/60')}>{LABELS[key]}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <Button variant="gradient" size="lg" onClick={onGoToDashboard} className="gap-2 w-full">
        Go to Dashboard <ArrowRight className="w-4 h-4" />
      </Button>
    </motion.div>
  )
}
