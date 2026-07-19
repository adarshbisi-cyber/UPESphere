'use client'

import { useEffect, useState } from 'react'
import { animate, motion } from 'framer-motion'
import { cn, EASE_OUT } from '@/lib/utils'

// Shared glassmorphism stat-card building blocks — used by the Dashboard
// summary cards and the Gradebook's academic summary cards so both stay
// visually identical without duplicating the styling.

export type Accent = 'indigo' | 'violet' | 'cyan' | 'emerald' | 'amber'

export const ACCENT: Record<Accent, { gradient: string; border: string; value: string; bg: string; icon: string; bar: string }> = {
  indigo: { gradient: 'from-indigo-500/10 to-indigo-600/5', border: 'border-indigo-500/20', value: 'text-indigo-300', bg: 'bg-indigo-500/10', icon: 'text-indigo-400', bar: 'bg-indigo-400' },
  violet: { gradient: 'from-violet-500/10 to-violet-600/5', border: 'border-violet-500/20', value: 'text-violet-300', bg: 'bg-violet-500/10', icon: 'text-violet-400', bar: 'bg-violet-400' },
  cyan: { gradient: 'from-cyan-500/10 to-cyan-600/5', border: 'border-cyan-500/20', value: 'text-cyan-300', bg: 'bg-cyan-500/10', icon: 'text-cyan-400', bar: 'bg-cyan-400' },
  emerald: { gradient: 'from-emerald-500/10 to-emerald-600/5', border: 'border-emerald-500/20', value: 'text-emerald-300', bg: 'bg-emerald-500/10', icon: 'text-emerald-400', bar: 'bg-emerald-400' },
  amber: { gradient: 'from-amber-500/10 to-amber-600/5', border: 'border-amber-500/20', value: 'text-amber-300', bg: 'bg-amber-500/10', icon: 'text-amber-400', bar: 'bg-amber-400' },
}

// Count-up on mount / when the target value first arrives, so numbers animate
// in as the page loads. Re-animates from zero if the value changes (data
// loads once, so in practice that's a single run per card).
export function AnimatedNumber({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.8,
      ease: EASE_OUT,
      onUpdate: v => setDisplay(v),
    })
    return () => controls.stop()
  }, [value])
  return <span className={className}>{display.toFixed(decimals)}</span>
}

export function StatCard({
  title,
  accent,
  icon,
  delay,
  children,
}: {
  title: string
  accent: Accent
  icon: React.ReactNode
  delay: number
  children: React.ReactNode
}) {
  const c = ACCENT[accent]
  return (
    <motion.div
      initial={{ opacity: 0, transform: 'translateY(16px)' }}
      animate={{ opacity: 1, transform: 'translateY(0px)' }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        'rounded-xl border p-3.5 bg-gradient-to-br backdrop-blur-sm flex flex-col',
        c.gradient,
        c.border,
        '[@media(hover:hover)_and_(pointer:fine)]:hover:scale-[1.02] transition-transform duration-200 cursor-default'
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-muted-foreground font-medium">{title}</p>
        <div className={cn('p-1.5 rounded-lg', c.bg, c.icon)}>{icon}</div>
      </div>
      {children}
    </motion.div>
  )
}

export function StatProgressBar({ pct, accent, delay }: { pct: number; accent: Accent; delay: number }) {
  const c = ACCENT[accent]
  const scale = Math.min(100, Math.max(0, pct)) / 100
  return (
    <div className="h-1 rounded-full overflow-hidden mt-1.5" style={{ background: 'var(--divider)' }}>
      <motion.div
        className={cn('h-full w-full rounded-full origin-left', c.bar)}
        initial={{ transform: 'scaleX(0)' }}
        animate={{ transform: `scaleX(${scale})` }}
        transition={{ duration: 0.8, delay: delay + 0.1, ease: EASE_OUT }}
      />
    </div>
  )
}
