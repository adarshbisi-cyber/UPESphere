'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { calculateAttendance } from '@/lib/calculations/attendance'
import { cn } from '@/lib/utils'

export function AttendanceDemo() {
  const [attended, setAttended] = useState(68)
  const [total, setTotal] = useState(80)
  const [required, setRequired] = useState(75)

  const result = calculateAttendance(attended, total, required)

  const statusConfig = {
    safe: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Safe Zone', gradient: 'from-emerald-500 to-green-400' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Warning', gradient: 'from-yellow-500 to-amber-400' },
    danger: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Danger Zone', gradient: 'from-red-500 to-rose-400' },
  }

  const config = statusConfig[result.status]
  const circumference = 2 * Math.PI * 45
  const progress = Math.min(100, result.currentPercentage) / 100

  return (
    <section className="py-24 relative bg-gradient-to-b from-transparent via-indigo-500/[0.03] to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: interactive demo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <div className="rounded-2xl backdrop-blur-sm p-8 shadow-2xl" style={{ background: `linear-gradient(135deg, var(--glass-from), var(--glass-to))`, border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
              {/* Circular gauge */}
              <div className="flex justify-center mb-8">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--ring-track)" strokeWidth="8" />
                    <motion.circle
                      cx="50" cy="50" r="45" fill="none"
                      stroke="url(#attendanceGrad)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      animate={{ strokeDashoffset: circumference * (1 - progress) }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                    <defs>
                      <linearGradient id="attendanceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={result.status === 'safe' ? '#10b981' : result.status === 'warning' ? '#f59e0b' : '#ef4444'} />
                        <stop offset="100%" stopColor={result.status === 'safe' ? '#34d399' : result.status === 'warning' ? '#fbbf24' : '#f87171'} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold font-display ${config.color}`}>
                      {result.currentPercentage.toFixed(1)}%
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Attended', value: attended, setter: setAttended },
                  { label: 'Total', value: total, setter: setTotal },
                  { label: 'Required %', value: required, setter: setRequired },
                ].map(({ label, value, setter }) => (
                  <div key={label}>
                    <Label className="text-xs mb-1 block">{label}</Label>
                    <Input
                      type="number"
                      value={value}
                      onChange={e => setter(Number(e.target.value))}
                      className="text-center"
                    />
                  </div>
                ))}
              </div>

              {/* Result cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl p-4 ${result.status === 'danger' ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                  <div className={`text-2xl font-bold font-display ${result.status === 'danger' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {result.status === 'danger' ? result.classesNeeded : result.safeBunks}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {result.status === 'danger' ? 'Classes to attend' : 'Safe to bunk'}
                  </div>
                </div>
                <div className={cn('rounded-xl p-4', config.bg, 'border', config.border)}>
                  <config.icon className={`w-6 h-6 mb-1 ${config.color}`} />
                  <div className="text-xs text-muted-foreground leading-relaxed">{result.message}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: copy */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-medium mb-4">
              <BookOpen className="w-3.5 h-3.5" />
              Attendance Intelligence
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold font-display tracking-tight mb-4">
              Never miss the{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                safe limit
              </span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Know exactly how many classes you can skip and how many you need to attend to recover — with a visual health meter updated instantly.
            </p>
            <ul className="space-y-3">
              {[
                'Green / Yellow / Red health status',
                'Exact safe-bunk count',
                'Recovery plan with classes needed',
                'Support for any required %',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
