'use client'

import { motion } from 'framer-motion'

export function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100)
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">
          Step {step} of {total}
        </span>
        <span className="text-xs font-mono text-indigo-400">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  )
}
