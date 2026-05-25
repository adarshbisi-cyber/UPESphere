'use client'

import { motion } from 'framer-motion'
import { Brain, TrendingUp, AlertTriangle, Zap } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'

const DEMO_INSIGHTS = [
  {
    type: 'danger',
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    title: 'Attendance Warning',
    body: 'Your overall attendance is at 74% — just below the 75% threshold. Attend the next 2 classes to be safe.',
  },
  {
    type: 'tip',
    icon: TrendingUp,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    title: 'GPA Boost Opportunity',
    body: 'Improving Mathematics from B+ to A would increase your SGPA by 0.3 points. Focus here for maximum impact.',
  },
  {
    type: 'info',
    icon: Zap,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    title: 'Target Within Reach',
    body: 'You need an average SGPA of 8.8 in the remaining 3 semesters to graduate with a 8.5 CGPA.',
  },
  {
    type: 'success',
    icon: Brain,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    title: 'Semester 5 Best Yet',
    body: "Your Semester 5 SGPA of 8.7 is your best. You're on an upward trajectory — keep it going!",
  },
]

interface InsightsPanelProps {
  insights?: typeof DEMO_INSIGHTS
}

export function InsightsPanel({ insights = DEMO_INSIGHTS }: InsightsPanelProps) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-violet-400" />
        <h3 className="text-base font-semibold font-display">Smart Insights</h3>
        <span className="ml-auto text-xs text-muted-foreground">Updated now</span>
      </div>
      <div className="space-y-3">
        {insights.map((insight, i) => {
          const Icon = insight.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-xl p-4 border ${insight.bg} ${insight.border} flex gap-3`}
            >
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${insight.color}`} />
              <div>
                <div className={`text-sm font-medium mb-0.5 ${insight.color}`}>{insight.title}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{insight.body}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </GlassCard>
  )
}
