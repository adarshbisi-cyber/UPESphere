'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, AlertTriangle, XCircle, Plus, Minus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlassCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { calculateAttendance } from '@/lib/calculations/attendance'
import { GA } from '@/lib/analytics'

type NumOrEmpty = number | ''

const STATUS_CONFIG = {
  safe: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    label: 'Safe Zone',
    gradient: '#10b981',
    gradientEnd: '#34d399',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    label: 'Warning',
    gradient: '#f59e0b',
    gradientEnd: '#fbbf24',
  },
  danger: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    label: 'Danger Zone',
    gradient: '#ef4444',
    gradientEnd: '#f87171',
  },
}

export function AttendanceCalculator() {
  const [attended, setAttended] = useState<NumOrEmpty>('')
  const [total, setTotal] = useState<NumOrEmpty>('')
  const [required, setRequired] = useState<NumOrEmpty>(75)
  const [plannedTotal, setPlannedTotal] = useState<NumOrEmpty>('')

  const attendedNum = typeof attended === 'number' ? attended : 0
  const totalNum = typeof total === 'number' ? total : 0
  const requiredNum = typeof required === 'number' ? required : 75
  const plannedTotalNum = typeof plannedTotal === 'number' ? plannedTotal : 0

  const result = calculateAttendance(attendedNum, totalNum, requiredNum)
  const cfg = STATUS_CONFIG[result.status]
  const StatusIcon = cfg.icon

  // Fire attendance_calculated once per stable result (debounced, only when inputs are valid)
  const trackTimer = useRef<ReturnType<typeof setTimeout>>()
  const lastTracked = useRef<string>('')
  useEffect(() => {
    if (typeof attended !== 'number' || typeof total !== 'number' || total === 0) return
    const key = `${attended}/${total}/${requiredNum}`
    if (key === lastTracked.current) return
    clearTimeout(trackTimer.current)
    trackTimer.current = setTimeout(() => {
      lastTracked.current = key
      GA.attendanceCalculated(result.currentPercentage, result.status)
    }, 800)
    return () => clearTimeout(trackTimer.current)
  }, [attended, total, requiredNum, result.currentPercentage, result.status])

  // Track bunk planner when plannedTotal is set
  const bunkTimer = useRef<ReturnType<typeof setTimeout>>()
  const lastBunk = useRef<number>(-1)
  useEffect(() => {
    if (typeof plannedTotal !== 'number' || plannedTotal === 0) return
    if (plannedTotal === lastBunk.current) return
    clearTimeout(bunkTimer.current)
    bunkTimer.current = setTimeout(() => {
      lastBunk.current = plannedTotal
      GA.attendanceBunkPlannerUsed(plannedTotal)
    }, 1000)
    return () => clearTimeout(bunkTimer.current)
  }, [plannedTotal])

  const circumference = 2 * Math.PI * 52
  const pct = Math.min(100, result.currentPercentage)

  const mustAttend = Math.ceil((plannedTotalNum * requiredNum) / 100)
  const maxBunks = Math.max(0, plannedTotalNum - mustAttend)

  const handleAttendedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') { setAttended(''); return }
    const parsed = parseInt(raw, 10)
    if (isNaN(parsed)) return
    // Only clamp to total when total is actually set
    const max = typeof total === 'number' ? totalNum : Infinity
    setAttended(Math.max(0, Math.min(max, parsed)))
  }

  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') { setTotal(''); return }
    const parsed = parseInt(raw, 10)
    if (isNaN(parsed)) return
    const num = Math.max(0, parsed)
    // Requirement: total=0 means no classes held yet → attended must also be 0
    if (num === 0) setAttended(0)
    // Clamp attended down if it exceeds the new total
    else if (typeof attended === 'number' && attendedNum > num) setAttended(num)
    setTotal(num)
  }

  const handleRequiredChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') { setRequired(''); return }
    const parsed = parseInt(raw, 10)
    if (isNaN(parsed)) return
    setRequired(Math.max(1, Math.min(100, parsed)))
  }

  const handlePlannedTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') { setPlannedTotal(''); return }
    const parsed = parseInt(raw, 10)
    if (isNaN(parsed)) return
    setPlannedTotal(Math.max(0, parsed))
  }

  const step = (field: 'attended' | 'total', dir: 1 | -1) => {
    if (field === 'attended') {
      const max = typeof total === 'number' ? totalNum : Infinity
      setAttended(v => {
        const cur = typeof v === 'number' ? v : 0
        return Math.max(0, Math.min(max, cur + dir))
      })
    } else {
      setTotal(v => {
        const cur = typeof v === 'number' ? v : 0
        const next = Math.max(0, cur + dir)
        if (next === 0) setAttended(0)
        else if (typeof attended === 'number' && attendedNum > next) setAttended(next)
        return next
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold font-display mb-6">Your Attendance</h2>

            {/* Total */}
            <div className="mb-4">
              <Label className="text-sm mb-2 block">Total Classes Held</Label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => step('total', -1)}
                  className="p-2 rounded-lg border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <Input
                  type="number"
                  min={0}
                  value={total}
                  placeholder="e.g. 80"
                  onChange={handleTotalChange}
                  className="text-center text-xl font-bold h-12"
                />
                <button
                  onClick={() => step('total', 1)}
                  className="p-2 rounded-lg border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Attended */}
            <div className="mb-4">
              <Label className="text-sm mb-2 block">Classes Attended</Label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => step('attended', -1)}
                  className="p-2 rounded-lg border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <Input
                  type="number"
                  min={0}
                  value={attended}
                  placeholder="e.g. 68"
                  onChange={handleAttendedChange}
                  className="text-center text-xl font-bold h-12"
                />
                <button
                  onClick={() => step('attended', 1)}
                  className="p-2 rounded-lg border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Required */}
            <div>
              <Label className="text-sm mb-2 block">Required Attendance %</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={required}
                placeholder="e.g. 75"
                onChange={handleRequiredChange}
                className="text-center h-12 text-xl font-bold"
              />
            </div>
          </GlassCard>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <GlassCard className="p-6">
            {/* Circular gauge */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--ring-track)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke="var(--ring-track)"
                    strokeWidth="2"
                    strokeDasharray={`2 ${circumference - 2}`}
                    strokeDashoffset={circumference - (requiredNum / 100) * circumference}
                  />
                  <motion.circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke={`url(#gauge-${result.status})`}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id={`gauge-${result.status}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={cfg.gradient} />
                      <stop offset="100%" stopColor={cfg.gradientEnd} />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold font-display ${cfg.color}`}>
                    {result.currentPercentage.toFixed(1)}%
                  </span>
                  <Badge
                    variant={result.status === 'safe' ? 'emerald' : result.status === 'warning' ? 'amber' : 'red'}
                    className="mt-1 text-xs"
                  >
                    {cfg.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center rounded-xl p-4" style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}>
                <div className="text-2xl font-bold font-display text-foreground">{attendedNum}</div>
                <div className="text-xs text-muted-foreground mt-1">Attended</div>
              </div>
              <div className={`text-center rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
                <div className={`text-2xl font-bold font-display ${cfg.color}`}>
                  {result.status === 'danger' ? result.classesNeeded : result.safeBunks}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {result.status === 'danger' ? 'Must Attend Next' : 'Still Can Skip'}
                </div>
              </div>
              <div className="text-center rounded-xl p-4" style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}>
                <div className="text-2xl font-bold font-display text-foreground">{requiredNum}%</div>
                <div className="text-xs text-muted-foreground mt-1">Required</div>
              </div>
            </div>

            {/* Message */}
            <div className={`rounded-xl p-4 border ${cfg.bg} ${cfg.border} mb-4`}>
              <div className="flex items-start gap-3">
                <StatusIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                <p className="text-sm leading-relaxed text-foreground/90">{result.message}</p>
              </div>
            </div>

            {/* Insights */}
            {result.insights.length > 0 && (
              <div className="space-y-2">
                {result.insights.map((insight, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-sm text-muted-foreground flex gap-2 items-start"
                  >
                    <span className="text-indigo-400 mt-1 flex-shrink-0">→</span>
                    {insight}
                  </motion.p>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Bunk allowance */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold font-display mb-1">Bunk Allowance</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Enter total planned classes for the semester to see how many you can skip
        </p>
        <div className="mb-5">
          <Label className="text-sm mb-2 block">Total Planned Classes</Label>
          <Input
            type="number"
            min={0}
            value={plannedTotal}
            placeholder="e.g. 120 (full semester)"
            onChange={handlePlannedTotalChange}
            className="h-12 text-xl font-bold text-center max-w-xs"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center rounded-xl p-4" style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}>
            <div className="text-3xl font-bold font-display text-foreground">{plannedTotalNum}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Classes</div>
          </div>
          <div className="text-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
            <div className="text-3xl font-bold font-display text-emerald-400">
              {maxBunks}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Can Bunk</div>
          </div>
          <div className="text-center rounded-xl p-4" style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}>
            <div className="text-3xl font-bold font-display text-foreground">{mustAttend}</div>
            <div className="text-xs text-muted-foreground mt-1">Must Attend</div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
