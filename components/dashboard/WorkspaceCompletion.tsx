'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, Square, LayoutGrid } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getWorkspaceStatus, workspaceCompletionPct, type WorkspaceStatus } from '@/lib/onboarding/api'

const ITEMS: { key: keyof WorkspaceStatus; label: string; href: string }[] = [
  { key: 'profile', label: 'Profile', href: '/workspace/setup' },
  { key: 'curriculum', label: 'Curriculum', href: '/workspace/setup' },
  { key: 'timetable', label: 'Timetable', href: '/workspace/setup' },
  { key: 'gradeCard', label: 'Grade Card', href: '/workspace/setup' },
  { key: 'resume', label: 'Resume', href: '/workspace/setup' },
]

export function WorkspaceCompletion({ userId }: { userId: string }) {
  const [status, setStatus] = useState<WorkspaceStatus | null>(null)

  useEffect(() => {
    getWorkspaceStatus(userId).then(setStatus).catch(() => setStatus(null))
  }, [userId])

  if (!status) return null

  const pct = workspaceCompletionPct(status)
  if (pct === 100) return null // fully set up — no need to keep nudging

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <GlassCard className="p-5 border border-indigo-500/20 bg-indigo-500/[0.03] mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
              <LayoutGrid className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-sm font-semibold font-display">Academic Workspace</span>
          </div>
          <span className="text-sm font-mono text-indigo-400">{pct}% Complete</span>
        </div>

        <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: 'var(--divider)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {ITEMS.map(item => {
            const done = status[item.key]
            return done ? (
              <span key={item.key} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                <Check className="w-3 h-3" /> {item.label}
              </span>
            ) : (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors',
                  'border-white/10 text-muted-foreground hover:text-foreground hover:border-white/25'
                )}
              >
                <Square className="w-3 h-3" /> {item.label}
              </Link>
            )
          })}
        </div>
      </GlassCard>
    </motion.div>
  )
}
