'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  color?: 'indigo' | 'violet' | 'emerald' | 'amber' | 'red' | 'cyan'
  icon?: React.ReactNode
  delay?: number
}

const COLOR_MAP = {
  indigo: {
    gradient: 'from-indigo-500/10 to-indigo-600/5',
    border: 'border-indigo-500/20',
    value: 'text-indigo-300',
    bg: 'bg-indigo-500/10',
    icon: 'text-indigo-400',
  },
  violet: {
    gradient: 'from-violet-500/10 to-violet-600/5',
    border: 'border-violet-500/20',
    value: 'text-violet-300',
    bg: 'bg-violet-500/10',
    icon: 'text-violet-400',
  },
  emerald: {
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-500/20',
    value: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-400',
  },
  amber: {
    gradient: 'from-amber-500/10 to-amber-600/5',
    border: 'border-amber-500/20',
    value: 'text-amber-300',
    bg: 'bg-amber-500/10',
    icon: 'text-amber-400',
  },
  red: {
    gradient: 'from-red-500/10 to-red-600/5',
    border: 'border-red-500/20',
    value: 'text-red-300',
    bg: 'bg-red-500/10',
    icon: 'text-red-400',
  },
  cyan: {
    gradient: 'from-cyan-500/10 to-cyan-600/5',
    border: 'border-cyan-500/20',
    value: 'text-cyan-300',
    bg: 'bg-cyan-500/10',
    icon: 'text-cyan-400',
  },
}

export function StatsCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = 'indigo',
  icon,
  delay = 0,
}: StatsCardProps) {
  const c = COLOR_MAP[color]

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        'rounded-2xl border p-6 bg-gradient-to-br',
        c.gradient,
        c.border,
        'hover:scale-[1.02] transition-transform duration-200 cursor-default'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
        </div>
        {icon && (
          <div className={cn('p-2 rounded-xl', c.bg, c.icon)}>
            {icon}
          </div>
        )}
      </div>

      <div className={cn('text-4xl font-bold font-display mb-2', c.value)}>
        {value}
      </div>

      <div className="flex items-center gap-3">
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {trend && trendValue && (
          <div className={cn('flex items-center gap-1 text-xs font-medium ml-auto', trendColor)}>
            <TrendIcon className="w-3.5 h-3.5" />
            {trendValue}
          </div>
        )}
      </div>
    </motion.div>
  )
}
