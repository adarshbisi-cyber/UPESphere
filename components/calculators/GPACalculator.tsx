'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence, animate } from 'framer-motion'
import { Plus, Trash2, RotateCcw, Share2, TrendingUp, Calculator, ScanLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/card'
import { calculateGPA, GRADE_POINTS_10 } from '@/lib/calculations/gpa'
import { generateId, getGPAColor } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { CurriculumScanner } from './CurriculumScanner'
import { GA } from '@/lib/analytics'
import type { Subject } from '@/types'

const GRADES = Object.keys(GRADE_POINTS_10)

const DEFAULT_SUBJECTS: Subject[] = [
  { id: '1', name: '', credits: 4, grade: 'A+' },
  { id: '2', name: '', credits: 3, grade: 'A' },
  { id: '3', name: '', credits: 4, grade: 'B+' },
]

const GRADE_COLOR: Record<string, string> = {
  'O': 'text-emerald-400', 'A+': 'text-emerald-400', 'A': 'text-green-400',
  'B+': 'text-yellow-400', 'B': 'text-yellow-300',   'C': 'text-orange-400',
  'P': 'text-orange-400',  'F': 'text-red-500',
}

export function GPACalculator() {
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS)
  const [showScanner, setShowScanner] = useState(false)
  const { toast } = useToast()

  const result = calculateGPA(subjects, '10')

  const addSubject = () => {
    setSubjects(s => {
      const next = [...s, { id: generateId(), name: '', credits: 3, grade: 'A' }]
      GA.gpaSubjectAdded(next.length)
      return next
    })
  }

  const removeSubject = (id: string) => {
    if (subjects.length <= 1) return
    setSubjects(s => {
      const next = s.filter(sub => sub.id !== id)
      GA.gpaSubjectRemoved(next.length)
      return next
    })
  }

  const update = useCallback((id: string, field: keyof Subject, value: string | number) => {
    setSubjects(s => s.map(sub => sub.id === id ? { ...sub, [field]: value } : sub))
  }, [])

  const reset = () => {
    setSubjects(DEFAULT_SUBJECTS)
    toast({ title: 'Reset', description: 'Calculator has been cleared.' })
  }

  const handleShare = () => {
    const text = `My SGPA: ${result.sgpa} (${result.percentageEquivalent}%) — Calculated with UPESphere`
    navigator.clipboard.writeText(text)
    GA.gpaShared(result.sgpa, result.totalCredits)
    toast({ title: 'Copied!', description: 'Result copied to clipboard.', variant: 'success' } as any)
  }

  const handleScanImport = (imported: Subject[]) => {
    const totalCredits = imported.reduce((a, s) => a + s.credits, 0)
    setSubjects(imported)
    setShowScanner(false)
    GA.gpaSubjectsImported(imported.length, totalCredits)
    toast({ title: `${imported.length} subjects imported`, description: `Total credits: ${totalCredits}. Now select your grades.` })
  }

  const gpaColorClass = getGPAColor(result.sgpa, 10)

  // Animated counter for SGPA display
  const prevGpaRef = useRef(result.sgpa)
  const [displayGpa, setDisplayGpa] = useState(result.sgpa)

  useEffect(() => {
    const from = prevGpaRef.current
    const to = result.sgpa
    if (Math.abs(from - to) < 0.005) { prevGpaRef.current = to; setDisplayGpa(to); return }
    const controls = animate(from, to, {
      duration: Math.min(0.7, Math.abs(from - to) * 1.8),
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => { prevGpaRef.current = v; setDisplayGpa(v) },
      onComplete: () => { prevGpaRef.current = to },
    })
    return () => controls.stop()
  }, [result.sgpa])

  return (
    <div className="max-w-4xl mx-auto">
      <AnimatePresence>
        {showScanner && (
          <CurriculumScanner
            onImport={handleScanImport}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Subject table */}
        <div className="lg:col-span-3">
          <GlassCard className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600/25 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <Calculator className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display">GPA Calculator</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Calculate your Semester GPA and track your academic performance</p>
                </div>
              </div>
              <Badge variant="indigo">10-Point Scale</Badge>
            </div>

            {/* AI Scanner trigger */}
            <button
              onClick={() => { setShowScanner(true); GA.gpaScannerOpened() }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-5 text-left group transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))',
                border: '1px solid rgba(99,102,241,0.22)',
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/25 to-violet-500/20 border border-indigo-500/25 flex items-center justify-center shrink-0">
                <ScanLine className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground leading-none mb-1">AI Course Curriculum Scanner</p>
                <p className="text-[11px] text-muted-foreground/80 leading-relaxed">Upload your curriculum&apos;s screenshot to auto-fill subjects and credits</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(99,102,241,0.15)', color: 'rgba(99,102,241,0.9)' }}>
                NEW
              </span>
            </button>

            {/* Header row */}
            <div className="grid grid-cols-12 gap-2 mb-3 px-1">
              <div className="col-span-5 text-xs text-muted-foreground font-medium">Subject Name</div>
              <div className="col-span-2 text-xs text-muted-foreground font-medium text-center">Credits</div>
              <div className="col-span-3 text-xs text-muted-foreground font-medium text-center">Grade</div>
              <div className="col-span-2 text-xs text-muted-foreground font-medium text-center">Points</div>
            </div>

            <AnimatePresence>
              {subjects.map((sub, i) => {
                const points = GRADE_POINTS_10[sub.grade] ?? '—'
                return (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-12 gap-2 mb-2 items-center"
                  >
                    <div className="col-span-5">
                      <Input
                        placeholder={`Subject ${i + 1}`}
                        value={sub.name}
                        onChange={e => update(sub.id, 'name', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={sub.credits}
                        onChange={e => {
                          const num = Math.max(0, Math.min(10, parseInt(e.target.value, 10) || 0))
                          e.target.value = String(num)
                          update(sub.id, 'credits', num)
                        }}
                        className="h-9 text-center"
                      />
                    </div>
                    <div className="col-span-3">
                      <Select value={sub.grade} onValueChange={v => update(sub.id, 'grade', v)}>
                        <SelectTrigger className={`h-9 font-semibold ${GRADE_COLOR[sub.grade] || ''}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADES.map(g => (
                            <SelectItem key={g} value={g} className={`font-semibold ${GRADE_COLOR[g] || ''}`}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1 text-center text-sm font-mono text-muted-foreground">
                      {points}
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => removeSubject(sub.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground/40 hover:text-red-400 transition-colors"
                        disabled={subjects.length <= 1}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            <Button
              variant="ghost"
              size="sm"
              onClick={addSubject}
              className="w-full mt-3 gap-2 border border-dashed border-[var(--divider)] hover:border-indigo-500/40"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </Button>

            {/* Grade reference */}
            <div className="mt-6 pt-5 border-t border-[var(--divider)]">
              <p className="text-xs text-muted-foreground mb-3 font-medium">Grade Reference</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(GRADE_POINTS_10).map(([g, pts]) => (
                  <div key={g} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${GRADE_COLOR[g] || 'text-muted-foreground'}`} style={{ background: 'var(--muted-surface)' }}>
                    <span className="font-semibold">{g}</span>
                    <span className="text-muted-foreground">= {pts}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main GPA card */}
          <GlassCard className="p-6 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Your SGPA</div>
            <div className={`text-7xl font-bold font-display tabular-nums ${gpaColorClass}`}>
              {displayGpa.toFixed(2)}
            </div>
            <div className="mt-3 flex items-center justify-center gap-3 text-sm">
              <div className="text-center">
                <div className="text-foreground/80 font-medium">{result.percentageEquivalent}%</div>
                <div className="text-xs text-muted-foreground">Equivalent</div>
              </div>
              <div className="w-px h-8 bg-[var(--divider)]" />
              <div className="text-center">
                <div className="text-foreground/80 font-medium">{result.totalCredits}</div>
                <div className="text-xs text-muted-foreground">Credits</div>
              </div>
              <div className="w-px h-8 bg-[var(--divider)]" />
              <div className="text-center">
                <div className="text-foreground/80 font-medium">{result.gradePoints.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Grade Pts</div>
              </div>
            </div>
          </GlassCard>

          {/* Performance band */}
          <GlassCard className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Performance</div>
            <div className="space-y-2">
              {[
                { label: 'Distinction', min: 9, color: 'bg-emerald-500' },
                { label: 'First Class', min: 8, color: 'bg-indigo-500' },
                { label: 'Second Class', min: 7, color: 'bg-yellow-500' },
                { label: 'Pass', min: 5, color: 'bg-orange-500' },
              ].map(band => {
                const active = result.sgpa >= band.min
                return (
                  <div key={band.label} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${active ? band.color : 'bg-foreground/10'}`} />
                    <span className={`text-sm ${active ? 'text-foreground' : 'text-muted-foreground/40'}`}>{band.label}</span>
                    {active && <Badge variant="indigo" className="ml-auto text-xs py-0">✓</Badge>}
                  </div>
                )
              })}
            </div>
          </GlassCard>

          {/* Insights */}
          {result.insights.length > 0 && (
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Insights</span>
              </div>
              <div className="space-y-2">
                {result.insights.map((insight, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-sm text-muted-foreground leading-relaxed"
                  >
                    {insight}
                  </motion.p>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={reset} className="flex-1 gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
            <Button variant="gradient-outline" size="sm" onClick={handleShare} className="flex-1 gap-1.5">
              <Share2 className="w-3.5 h-3.5" /> Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
