'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, AlertTriangle, XCircle, BookOpen, FileText, GraduationCap, Target } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlassCard } from '@/components/ui/card'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Inputs {
  internalMarks: number
  internalMax: number
  midSemMarks: number
  midSemMax: number
  endSemMarks: number
  endSemMax: number
  passingPercent: number
}

const DEFAULTS: Inputs = {
  internalMarks: 35,
  internalMax: 50,
  midSemMarks: 14,
  midSemMax: 20,
  endSemMarks: 20,
  endSemMax: 30,
  passingPercent: 40,
}

// Weightages are fixed: internal=50, midSem=20, endSem=30 → total 100
const W_INTERNAL = 50
const W_MIDSEM = 20
const W_ENDSEM = 30

// ─── Calculations ─────────────────────────────────────────────────────────────

function calcResults(i: Inputs) {
  const safe = (marks: number, max: number) => (max > 0 ? marks / max : 0)

  // Scale each component to its weightage
  const internalScore = safe(i.internalMarks, i.internalMax) * W_INTERNAL
  const midSemScore   = safe(i.midSemMarks, i.midSemMax) * W_MIDSEM
  const endSemScore   = safe(i.endSemMarks, i.endSemMax) * W_ENDSEM

  const knownScore     = internalScore + midSemScore            // out of 70
  const expectedTotal  = knownScore + endSemScore               // out of 100
  const passingMark    = i.passingPercent                       // always out of 100

  // Minimum end-sem score needed (in weightage points, out of 30)
  const minEndSemScore    = Math.max(passingMark - knownScore, 0)
  const minEndSemScoreClamped = Math.min(minEndSemScore, W_ENDSEM)

  // Convert back to actual marks on the student's paper
  const minEndSemMarks = i.endSemMax > 0
    ? Math.ceil((minEndSemScoreClamped / W_ENDSEM) * i.endSemMax)
    : 0

  const alreadyPassing = knownScore >= passingMark

  // Gap in actual marks (positive = comfortable, negative = short)
  const gap = i.endSemMarks - minEndSemMarks

  // Map gap to probability (clamp ±20% of endSemMax)
  const clampRange = Math.max(i.endSemMax * 0.2, 5)
  const clampedGap = Math.max(-clampRange, Math.min(clampRange, gap))
  const passProbability = Math.round(((clampedGap + clampRange) / (2 * clampRange)) * 100)
  const riskLevel       = 100 - passProbability
  const confidence      = Math.max(0, Math.min(100, passProbability))

  const status: 'safe' | 'borderline' | 'danger' =
    passProbability >= 75 ? 'safe' : passProbability >= 45 ? 'borderline' : 'danger'

  let headline = ''
  let subtext = ''
  if (alreadyPassing) {
    headline = "You're already passing!"
    subtext = 'Your known marks are enough to pass. End Sem is just a bonus.'
  } else if (gap > i.endSemMax * 0.15) {
    headline = `You need ${minEndSemMarks}/${i.endSemMax} in End Sem to pass.`
    subtext = 'You are currently in the safe zone.'
  } else if (gap >= 0) {
    headline = `You need ${minEndSemMarks}/${i.endSemMax} in End Sem to pass.`
    subtext = `You're targeting ${i.endSemMarks}. Stay on track — it's close!`
  } else {
    headline = `You need ${minEndSemMarks}/${i.endSemMax} in End Sem to pass.`
    subtext = `Scoring below ${minEndSemMarks} may lead to failure.`
  }

  return {
    internalScore, midSemScore, endSemScore,
    knownScore, expectedTotal,
    passingMark, minEndSemMarks, minEndSemScoreClamped,
    alreadyPassing, gap,
    passProbability,
    status, headline, subtext,
  }
}

// ─── Mark Input ──────────────────────────────────────────────────────────────

function MarkInput({
  label, sublabel, icon: Icon, value, max, onChange, onMaxChange, color,
}: {
  label: string
  sublabel: string
  icon: React.ElementType
  value: number
  max: number
  onChange: (v: number) => void
  onMaxChange: (v: number) => void
  color: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          <Label className="text-sm font-medium">{label}</Label>
        </div>
        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
          Weightage: {sublabel}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          max={max}
          value={value || ''}
          placeholder="0"
          onChange={e => onChange(Number(e.target.value))}
          className="h-10 text-center font-semibold text-base"
        />
        <span className="text-muted-foreground font-medium">/</span>
        <Input
          type="number"
          min={1}
          value={max || ''}
          placeholder={String(max)}
          onChange={e => onMaxChange(Number(e.target.value))}
          className="h-10 text-center w-20 text-muted-foreground"
        />
      </div>
    </div>
  )
}

// ─── Main Calculator ──────────────────────────────────────────────────────────

export function PassCalculator() {
  const [inp, setInp] = useState<Inputs>(DEFAULTS)

  const set = (key: keyof Inputs, value: number) =>
    setInp(prev => ({ ...prev, [key]: value }))

  const r = calcResults(inp)

  const STATUS_MAP = {
    safe:       { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25', Icon: Shield,        label: 'Safe Zone'  },
    borderline: { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/25',     Icon: AlertTriangle, label: 'Borderline' },
    danger:     { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/25',         Icon: XCircle,       label: 'At Risk'    },
  } as const
  const sc = STATUS_MAP[r.status] ?? STATUS_MAP.danger

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Inputs + Quick Stats ─────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Inputs */}
        <div className="lg:col-span-3">
          <GlassCard className="p-6">
            <h2 className="text-base font-semibold font-display mb-6 flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-400" />
              Enter Your Marks
            </h2>

            <div className="space-y-5">
              <MarkInput
                label="Internal Marks"
                sublabel="50 pts"
                icon={BookOpen}
                value={inp.internalMarks}
                max={inp.internalMax}
                onChange={v => set('internalMarks', v)}
                onMaxChange={v => set('internalMax', v)}
                color="#6366f1"
              />
              <MarkInput
                label="Mid Sem Marks"
                sublabel="20 pts"
                icon={FileText}
                value={inp.midSemMarks}
                max={inp.midSemMax}
                onChange={v => set('midSemMarks', v)}
                onMaxChange={v => set('midSemMax', v)}
                color="#8b5cf6"
              />
              <MarkInput
                label="End Sem Marks (Expected)"
                sublabel="30 pts"
                icon={GraduationCap}
                value={inp.endSemMarks}
                max={inp.endSemMax}
                onChange={v => set('endSemMarks', v)}
                onMaxChange={v => set('endSemMax', v)}
                color="#06b6d4"
              />
            </div>

            <div className="mt-5 pt-5 border-t border-white/8">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Passing Criteria (% of 100)</Label>
                <div className="flex items-center gap-2 max-w-[160px]">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={inp.passingPercent}
                    onChange={e => set('passingPercent', Number(e.target.value))}
                    className="h-9 text-center"
                  />
                  <span className="text-muted-foreground text-sm font-medium">%</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Score Summary */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="p-5">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Score Summary</div>
            <div className="space-y-3.5">
              {[
                {
                  label: 'Known Score',
                  value: `${r.knownScore.toFixed(1)} / 70`,
                  pct: Math.round((r.knownScore / 70) * 100),
                  hint: 'Internal + Mid Sem',
                },
                {
                  label: 'Min End Sem Needed',
                  value: `${r.minEndSemMarks} / ${inp.endSemMax}`,
                  pct: Math.round((r.minEndSemMarks / inp.endSemMax) * 100),
                  hint: `${r.minEndSemScoreClamped.toFixed(1)}/30 pts`,
                },
                {
                  label: 'Expected Total',
                  value: `${r.expectedTotal.toFixed(1)} / 100`,
                  pct: Math.round(r.expectedTotal),
                  hint: 'If you score as expected',
                },
                {
                  label: 'Passing Mark',
                  value: `${r.passingMark} / 100`,
                  pct: r.passingMark,
                  hint: `${inp.passingPercent}% of total`,
                },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-0.5">
                    <div>
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="text-xs text-muted-foreground/60 ml-1.5">({item.hint})</span>
                    </div>
                    <span className="font-semibold text-white">{item.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, item.pct)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {r.gap < 0 && !r.alreadyPassing && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/25 text-sm text-red-300"
            >
              You're <span className="font-bold">{Math.abs(r.gap)} marks</span> short of the minimum required in End Sem.
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Status Banner ────────────────────────────────────────────────── */}
      <motion.div
        key={r.status}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-6 border ${sc.bg} flex items-center gap-4`}
      >
        <div className={`rounded-full p-3 ${sc.bg} shrink-0`}>
          <sc.Icon className={`w-6 h-6 ${sc.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-xs font-semibold uppercase tracking-widest ${sc.color}`}>{sc.label}</span>
          <p className={`text-xl font-bold font-display mt-1 ${sc.color}`}>{r.headline}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{r.subtext}</p>
        </div>
        <div className="hidden sm:block text-right shrink-0">
          <div className={`text-4xl font-bold font-display ${sc.color}`}>{r.passProbability}%</div>
          <div className="text-xs text-muted-foreground">pass chance</div>
        </div>
      </motion.div>

    </div>
  )
}
