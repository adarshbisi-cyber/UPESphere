'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, animate } from 'framer-motion'
import { Plus, Trash2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { calculateGPA } from '@/lib/calculations/gpa'
import { generateId, EASE_OUT } from '@/lib/utils'
import type { Subject } from '@/types'

const DEFAULT_SUBJECTS: Subject[] = [
  { id: '1', name: 'Data Structures', credits: 4, grade: 'A+' },
  { id: '2', name: 'Operating Systems', credits: 3, grade: 'A' },
  { id: '3', name: 'Mathematics III', credits: 4, grade: 'B+' },
]

const GRADES_10 = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F']

export function GPADemo() {
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS)

  const result = calculateGPA(subjects, '10')

  // Animated count-up for SGPA
  const prevGpaRef = useRef(result.sgpa)
  const [displayGpa, setDisplayGpa] = useState(result.sgpa)

  useEffect(() => {
    const from = prevGpaRef.current
    const to = result.sgpa
    if (Math.abs(from - to) < 0.005) {
      prevGpaRef.current = to
      setDisplayGpa(to)
      return
    }
    const controls = animate(from, to, {
      duration: Math.min(0.7, Math.abs(from - to) * 1.8),
      ease: EASE_OUT,
      onUpdate: (v) => {
        prevGpaRef.current = v
        setDisplayGpa(v)
      },
      onComplete: () => { prevGpaRef.current = to },
    })
    return () => controls.stop()
  }, [result.sgpa])

  const addSubject = () => {
    setSubjects(s => [...s, { id: generateId(), name: '', credits: 3, grade: 'A' }])
  }

  const removeSubject = (id: string) => {
    setSubjects(s => s.filter(sub => sub.id !== id))
  }

  const update = (id: string, field: keyof Subject, value: string | number) => {
    setSubjects(s => s.map(sub => sub.id === id ? { ...sub, [field]: value } : sub))
  }

  const gradeColor: Record<string, string> = {
    'O': 'text-emerald-400', 'A+': 'text-emerald-400', 'A': 'text-green-400',
    'B+': 'text-yellow-400', 'B': 'text-yellow-400', 'C': 'text-orange-400',
    'P': 'text-orange-400', 'F': 'text-red-400',
  }

  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Live GPA Preview
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold font-display tracking-tight mb-4">
              Instant GPA{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                calculation
              </span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Add subjects, pick grades, and watch your GPA update in real-time. Uses the standard 10-point grading scale.
            </p>
            <ul className="space-y-3">
              {['10-point scale (Indian universities)', 'Weighted credit-based calculation', 'Intelligent improvement insights', 'Save and share results'].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right: interactive demo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="rounded-2xl backdrop-blur-sm p-6 shadow-2xl" style={{ background: `linear-gradient(135deg, var(--glass-from), var(--glass-to))`, border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
              {/* GPA Display — animated counter */}
              <div className="text-center mb-6 py-4">
                <div className="text-6xl font-bold font-display bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent tabular-nums">
                  {displayGpa.toFixed(2)}
                </div>
                <div className="text-muted-foreground text-sm mt-1">
                  SGPA · {result.percentageEquivalent}% · {result.totalCredits} Credits
                </div>
              </div>

              {/* Subjects */}
              <div className="space-y-3 mb-4">
                <AnimatePresence>
                  {subjects.map((sub, i) => (
                    <motion.div
                      key={sub.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex gap-2 items-center"
                    >
                      <Input
                        placeholder={`Subject ${i + 1}`}
                        value={sub.name}
                        onChange={e => update(sub.id, 'name', e.target.value)}
                        className="flex-1 h-9 text-xs"
                      />
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={sub.credits}
                        onChange={e => update(sub.id, 'credits', Number(e.target.value))}
                        className="w-14 h-9 text-xs text-center"
                      />
                      <Select value={sub.grade} onValueChange={v => update(sub.id, 'grade', v)}>
                        <SelectTrigger className={`w-20 h-9 text-xs font-semibold ${gradeColor[sub.grade] || ''}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADES_10.map(g => (
                            <SelectItem key={g} value={g} className={gradeColor[g]}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        onClick={() => removeSubject(sub.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <Button variant="ghost" size="sm" onClick={addSubject} className="w-full gap-2 border border-dashed border-[var(--divider)] hover:border-indigo-500/40">
                <Plus className="w-4 h-4" />
                Add Subject
              </Button>

              {/* Insight */}
              {result.insights[0] && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-300"
                >
                  <span className="font-medium">Insight: </span>{result.insights[0]}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
