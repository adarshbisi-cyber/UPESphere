'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlassCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { calculateCGPA } from '@/lib/calculations/cgpa'
import { generateId, getGPAColor } from '@/lib/utils'
import { GA } from '@/lib/analytics'
import type { Semester } from '@/types'

const DEFAULT_SEMESTERS: Semester[] = [
  { id: '1', name: 'Semester 1', sgpa: 8.2, credits: 22 },
  { id: '2', name: 'Semester 2', sgpa: 7.8, credits: 24 },
  { id: '3', name: 'Semester 3', sgpa: 8.5, credits: 22 },
  { id: '4', name: 'Semester 4', sgpa: 8.1, credits: 24 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl backdrop-blur-sm p-3 shadow-xl" style={{ background: 'hsl(var(--card))', border: '1px solid var(--divider)' }}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold text-indigo-300">{payload[0].value} SGPA</p>
    </div>
  )
}

export function CGPACalculator() {
  const [semesters, setSemesters] = useState<Semester[]>(DEFAULT_SEMESTERS)

  const result = calculateCGPA(semesters)

  const chartData = semesters
    .filter(s => s.sgpa > 0 && s.credits > 0)
    .map((s, i) => ({ name: s.name || `Sem ${i + 1}`, sgpa: s.sgpa }))

  const addSemester = () => {
    const n = semesters.length + 1
    setSemesters(s => {
      const next = [...s, { id: generateId(), name: `Semester ${n}`, sgpa: 0, credits: 22 }]
      GA.cgpaSemesterAdded(next.length)
      return next
    })
  }

  const removeSemester = (id: string) => {
    if (semesters.length <= 1) return
    setSemesters(s => {
      const next = s.filter(sem => sem.id !== id)
      GA.cgpaSemesterRemoved(next.length)
      return next
    })
  }

  const update = (id: string, field: keyof Semester, value: string | number) => {
    setSemesters(s => s.map(sem => sem.id === id ? { ...sem, [field]: value } : sem))
  }

  // Debounced tracking for CGPA calculation and target check
  const cgpaTimer = useRef<ReturnType<typeof setTimeout>>()
  const lastCgpa = useRef<string>('')
  useEffect(() => {
    const key = `${result.cgpa}/${semesters.length}`
    if (key === lastCgpa.current) return
    clearTimeout(cgpaTimer.current)
    cgpaTimer.current = setTimeout(() => {
      lastCgpa.current = key
      GA.cgpaCalculated(result.cgpa, semesters.length)
    }, 1000)
    return () => clearTimeout(cgpaTimer.current)
  }, [result.cgpa, semesters.length])

  const TrendIcon = result.trend === 'improving' ? TrendingUp : result.trend === 'declining' ? TrendingDown : Minus
  const trendColor = result.trend === 'improving' ? 'text-emerald-400' : result.trend === 'declining' ? 'text-red-400' : 'text-yellow-400'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Semesters input */}
        <div className="lg:col-span-3">
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold font-display mb-6">Semester Records</h2>

            <div className="grid grid-cols-10 gap-2 mb-3 px-1">
              <div className="col-span-4 text-xs text-muted-foreground font-medium">Semester</div>
              <div className="col-span-3 text-xs text-muted-foreground font-medium text-center">SGPA</div>
              <div className="col-span-2 text-xs text-muted-foreground font-medium text-center">Credits</div>
              <div className="col-span-1" />
            </div>

            <AnimatePresence>
              {semesters.map((sem, i) => (
                <motion.div
                  key={sem.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-10 gap-2 mb-2 items-center"
                >
                  <div className="col-span-4">
                    <Input
                      placeholder={`Semester ${i + 1}`}
                      value={sem.name}
                      onChange={e => update(sem.id, 'name', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      step={0.01}
                      value={sem.sgpa || ''}
                      placeholder="0.00"
                      onChange={e => update(sem.id, 'sgpa', Number(e.target.value))}
                      className="h-9 text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={1}
                      value={sem.credits || ''}
                      placeholder="22"
                      onChange={e => update(sem.id, 'credits', Number(e.target.value))}
                      className="h-9 text-center"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => removeSemester(sem.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground/40 hover:text-red-400 transition-colors"
                      disabled={semesters.length <= 1}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <Button
              variant="ghost"
              size="sm"
              onClick={addSemester}
              className="w-full mt-3 gap-2 border border-dashed border-[var(--divider)] hover:border-violet-500/40"
            >
              <Plus className="w-4 h-4" /> Add Semester
            </Button>
          </GlassCard>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="p-6 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Your CGPA</div>
            <motion.div
              key={result.cgpa}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`text-7xl font-bold font-display ${getGPAColor(result.cgpa)}`}
            >
              {result.cgpa.toFixed(2)}
            </motion.div>
            <div className="mt-3 flex items-center justify-center gap-3 text-sm">
              <div className="text-center">
                <div className="text-foreground/80 font-medium">{result.percentageEquivalent}%</div>
                <div className="text-xs text-muted-foreground">Equivalent</div>
              </div>
              <div className="w-px h-8" style={{ background: 'var(--divider)' }} />
              <div className="text-center">
                <div className="text-foreground/80 font-medium">{result.semesterCount}</div>
                <div className="text-xs text-muted-foreground">Semesters</div>
              </div>
              <div className="w-px h-8" style={{ background: 'var(--divider)' }} />
              <div className="text-center">
                <div className={`font-medium flex items-center gap-1 justify-center ${trendColor}`}>
                  <TrendIcon className="w-3.5 h-3.5" />
                  {result.trend}
                </div>
                <div className="text-xs text-muted-foreground">Trend</div>
              </div>
            </div>
          </GlassCard>

          {/* Insights */}
          {result.insights.length > 0 && (
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Insights</span>
              </div>
              <div className="space-y-2">
                {result.insights.slice(0, 2).map((insight, i) => (
                  <p key={i} className="text-sm text-muted-foreground leading-relaxed">{insight}</p>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Trend Chart */}
      {chartData.length >= 2 && (
        <GlassCard className="p-6">
          <h3 className="text-base font-semibold font-display mb-6">SGPA Trend</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={result.cgpa} stroke="rgba(139,92,246,0.4)" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="sgpa"
                  stroke="url(#lineGrad)"
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, fill: '#8b5cf6' }}
                />
                <defs>
                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

    </div>
  )
}
