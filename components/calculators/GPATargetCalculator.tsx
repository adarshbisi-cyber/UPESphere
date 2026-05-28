'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Flame, CheckCircle, GraduationCap, BookOpen, Target, TrendingUp, Lightbulb } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { GlassCard } from '@/components/ui/card'

// ─── Types & defaults ─────────────────────────────────────────────────────────

interface Inp {
  completedCredits: number
  currentCGPA: number
  semCredits: number
  targetCGPA: number
}

const DEFAULTS: Inp = {
  completedCredits: 80,
  currentCGPA: 7.50,
  semCredits: 20,
  targetCGPA: 8.20,
}

// ─── Calculation ──────────────────────────────────────────────────────────────

function calcRequired(inp: Inp): number {
  if (inp.semCredits <= 0) return 0
  const total = inp.completedCredits + inp.semCredits
  return ((inp.targetCGPA * total) - (inp.currentCGPA * inp.completedCredits)) / inp.semCredits
}

// ─── Difficulty ───────────────────────────────────────────────────────────────

type Level = 'done' | 'easy' | 'moderate' | 'hard' | 'impossible'

interface Diff {
  level: Level; label: string; hex: string
  text: string; bg: string; border: string
}

function getDiff(gpa: number, cur: number, tgt: number): Diff {
  if (tgt <= cur)  return { level: 'done',       label: 'Already Achieved',  hex: '#10b981', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' }
  if (gpa > 10)    return { level: 'impossible',  label: 'Not Achievable',    hex: '#6b7280', text: 'text-gray-400',    bg: 'bg-gray-500/10',    border: 'border-gray-500/25'   }
  if (gpa > 8.5)   return { level: 'hard',        label: 'Challenging',       hex: '#f97316', text: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/25' }
  if (gpa >= 7.5)  return { level: 'moderate',    label: 'Moderate',          hex: '#f59e0b', text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25'  }
  return                  { level: 'easy',        label: 'Easily Achievable', hex: '#10b981', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' }
}

function getTip(gpa: number, raw: number): string {
  if (raw > 10)  return "Consider adjusting your target CGPA or increasing this semester's credits."
  if (raw <= 0)  return "You've already surpassed your goal — set a higher target to keep pushing!"
  if (gpa > 8.5) return "Focus on high-credit subjects and try to score above your target to create a buffer."
  if (gpa >= 7.5) return "Aim for consistent performance across all subjects — avoid letting any single one slip."
  return "You're in a comfortable position. Maintain discipline and stay ahead of deadlines."
}

// ─── Animated target orb ─────────────────────────────────────────────────────

function TargetOrb() {
  return (
    <div className="relative flex items-center justify-center w-32 h-32 sm:w-44 sm:h-44">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-violet-500/20"
          style={{ width: 56 + i * 28, height: 56 + i * 28 }}
          animate={{ scale: [1, 1.07, 1], opacity: [0.55, 0.25, 0.55] }}
          transition={{ duration: 2.8, delay: i * 0.55, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <div
        className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: 'radial-gradient(circle at 35% 35%, rgba(139,92,246,0.5) 0%, rgba(99,102,241,0.25) 60%, transparent 100%)', border: '1px solid rgba(139,92,246,0.5)', boxShadow: '0 0 32px rgba(139,92,246,0.3)' }}
      >
        <Target className="w-8 h-8 text-violet-300" />
      </div>
    </div>
  )
}

// ─── Mini semicircle gauge ────────────────────────────────────────────────────

function MiniGauge({ value }: { value: number }) {
  const color = value >= 75 ? '#f59e0b' : value >= 50 ? '#6366f1' : '#ef4444'
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 140 82" className="w-36">
        {/* Track */}
        <path d="M 10 75 A 60 60 0 0 1 130 75" fill="none" stroke="var(--ring-track)" strokeWidth={11} strokeLinecap="round" />
        {/* Fill */}
        <motion.path
          d="M 10 75 A 60 60 0 0 1 130 75"
          fill="none"
          stroke={color}
          strokeWidth={11}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={100}
          animate={{ strokeDashoffset: 100 - value }}
          initial={{ strokeDashoffset: 100 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
        <text x="70" y="63" textAnchor="middle" fill="currentColor" fontSize="20" fontWeight="bold" fontFamily="system-ui">
          {value}%
        </text>
      </svg>
      <p className="text-xs text-muted-foreground -mt-1">Goal Achievement Potential</p>
    </div>
  )
}

// ─── Input card ───────────────────────────────────────────────────────────────

function InputCard({ icon: Icon, label, sublabel, value, min, max, step, suffix, onChange }: {
  icon: React.ElementType; label: string; sublabel?: string
  value: number; min?: number; max?: number; step?: number
  suffix?: string; onChange: (v: number) => void
}) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-start gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-violet-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug">{label}</p>
          {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
        </div>
      </div>
      <div className="relative">
        <Input
          type="number"
          min={min} max={max} step={step ?? 1}
          value={value || ''}
          placeholder="0"
          onChange={e => onChange(Number(e.target.value))}
          className={`h-10 font-semibold ${suffix ? 'pr-14' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>
    </GlassCard>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GPATargetCalculator() {
  const [inp, setInp] = useState<Inp>(DEFAULTS)
  const set = (k: keyof Inp, v: number) => setInp(p => ({ ...p, [k]: v }))

  const raw      = calcRequired(inp)
  const required = Math.round(raw * 100) / 100
  const diff     = getDiff(required, inp.currentCGPA, inp.targetCGPA)
  const isValid  = raw > 0 && raw <= 10
  const displayGPA = raw > 10 ? '>10' : raw <= 0 ? '—' : required.toFixed(2)
  const tip      = getTip(required, raw)

  // Goal achievement potential: how much of target CGPA is already secured
  const goalPotential = inp.targetCGPA > 0
    ? Math.round(Math.min(100, (inp.currentCGPA / inp.targetCGPA) * 100))
    : 0

  const DiffIcon = diff.level === 'easy' || diff.level === 'done' ? CheckCircle
    : diff.level === 'moderate' ? Zap : Flame

  return (
    <div className="space-y-4">

      {/* ── 4 Input cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <InputCard
          icon={GraduationCap} label="Credits Completed" sublabel="(Till Last Sem)"
          value={inp.completedCredits} suffix="credits" min={0}
          onChange={v => set('completedCredits', v)}
        />
        <InputCard
          icon={TrendingUp} label="Current CGPA" sublabel="(Till Last Sem)"
          value={inp.currentCGPA} min={0} max={10} step={0.01}
          onChange={v => set('currentCGPA', v)}
        />
        <InputCard
          icon={BookOpen} label="Current Semester Credits"
          value={inp.semCredits} suffix="credits" min={1}
          onChange={v => set('semCredits', v)}
        />
        <InputCard
          icon={Target} label="Desired CGPA" sublabel="(After This Sem)"
          value={inp.targetCGPA} min={0} max={10} step={0.01}
          onChange={v => set('targetCGPA', v)}
        />
      </div>

      {/* ── Result card ─────────────────────────────────────────────────── */}
      <GlassCard className="overflow-hidden border-violet-500/15">

        {/* 3-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--divider)]">

          {/* Left — animated orb */}
          <div className="flex items-center justify-center p-5 sm:p-8 md:p-10">
            <TargetOrb />
          </div>

          {/* Center — GPA result */}
          <div className="flex flex-col items-center justify-center gap-3 p-5 sm:p-8 text-center">
            <p className="text-sm text-muted-foreground">You need</p>

            <motion.div
              key={displayGPA}
              initial={{ scale: 0.82, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className={`text-[56px] sm:text-[80px] leading-none font-bold font-display ${diff.text}`}
              style={{ textShadow: `0 0 48px ${diff.hex}55` }}
            >
              {displayGPA}
            </motion.div>

            <p className="text-base text-muted-foreground">GPA this semester</p>

            <AnimatePresence mode="wait">
              <motion.div
                key={diff.level}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold border ${diff.bg} ${diff.border} ${diff.text}`}
              >
                <DiffIcon className="w-3.5 h-3.5" />
                {diff.label}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right — message + gauge */}
          <div className="flex flex-col justify-center gap-4 p-5 sm:p-8">

            <AnimatePresence mode="wait">
              {isValid && (
                <motion.div
                  key={required}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-1"
                >
                  <p className="text-sm font-bold text-foreground">Stay consistent and aim high!</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Achieving this GPA will help you reach
                  </p>
                  <p className={`text-2xl font-bold font-display ${diff.text}`}>
                    {inp.targetCGPA.toFixed(2)} CGPA
                  </p>
                  <p className="text-sm text-muted-foreground">after this semester.</p>
                </motion.div>
              )}
              {raw <= 0 && (
                <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-sm text-emerald-300 space-y-1">
                  <p className="font-bold text-foreground">Target already achieved!</p>
                  <p>You've surpassed your CGPA goal. Consider setting a higher target.</p>
                </motion.div>
              )}
              {raw > 10 && (
                <motion.div key="impossible" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-sm text-gray-300 space-y-1">
                  <p className="font-bold text-foreground">Target out of reach.</p>
                  <p>Adjust your CGPA goal or enroll in more credits this semester.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <MiniGauge value={goalPotential} />
          </div>
        </div>

        {/* Tip bar */}
        <div className="px-6 py-3.5 border-t border-[var(--divider)] bg-[var(--inner-surface)] flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="text-foreground font-semibold">Tip: </span>{tip}
          </p>
        </div>

      </GlassCard>
    </div>
  )
}
