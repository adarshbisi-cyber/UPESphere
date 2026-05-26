'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, XCircle, BookOpen, FileText, GraduationCap, Target, CheckCircle, HelpCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { GlassCard } from '@/components/ui/card'
import { GA } from '@/lib/analytics'

// ─── Types ───────────────────────────────────────────────────────────────────

type NumOrEmpty = number | ''

interface Inputs {
  internalMarks: NumOrEmpty
  internalMax:   NumOrEmpty
  midSemMarks:   NumOrEmpty
  midSemMax:     NumOrEmpty
  endSemMarks:   NumOrEmpty
  endSemMax:     NumOrEmpty
  passingPercent: number
}

const DEFAULTS: Inputs = {
  internalMarks: '',
  internalMax:   '',
  midSemMarks:   '',
  midSemMax:     '',
  endSemMarks:   '',
  endSemMax:     '',
  passingPercent: 40,
}

// Fixed weightages that map each component to the 100-point scale
const W_INTERNAL = 50
const W_MIDSEM   = 20
const W_ENDSEM   = 30

const toNum = (v: NumOrEmpty): number => (typeof v === 'number' ? v : 0)

// ─── Calculations ─────────────────────────────────────────────────────────────

function calcResults(i: Inputs) {
  const safe = (marks: NumOrEmpty, max: NumOrEmpty) => {
    const m = toNum(max)
    return m > 0 ? toNum(marks) / m : 0
  }

  // Scale each component's raw marks to its weightage contribution (out of 100 total)
  const internalScore = safe(i.internalMarks, i.internalMax) * W_INTERNAL
  const midSemScore   = safe(i.midSemMarks,   i.midSemMax)   * W_MIDSEM
  const endSemScore   = safe(i.endSemMarks,   i.endSemMax)   * W_ENDSEM

  const knownScore    = internalScore + midSemScore   // out of 70 (before end sem)
  const expectedTotal = knownScore + endSemScore      // out of 100
  const passingMark   = i.passingPercent
  const endSemMax     = toNum(i.endSemMax)
  const endSemMarks   = toNum(i.endSemMarks)

  // Weighted points still needed from End Sem (NO clamping — clamping hid the impossible case)
  const minEndSemWeightedNeeded = Math.max(passingMark - knownScore, 0)

  // Distinguish "no data entered yet" from "entered 0"
  const hasKnownData  = i.internalMarks !== '' || i.midSemMarks !== ''
  const alreadyPassing = knownScore >= passingMark
  // Impossible: after data is entered, even full End Sem marks can't bridge the gap
  const impossible    = hasKnownData && !alreadyPassing && minEndSemWeightedNeeded > W_ENDSEM

  // Convert weighted points → raw marks on the student's End Sem paper
  // null = impossible or no data (handled in UI separately)
  const minEndSemMarks: number | null =
    !hasKnownData    ? null   // waiting for input
    : alreadyPassing ? 0
    : impossible     ? null   // impossible case
    : endSemMax > 0  ? Math.ceil((minEndSemWeightedNeeded / W_ENDSEM) * endSemMax)
    : 0

  // Pass probability
  let passProbability: number
  if (impossible) {
    passProbability = 0
  } else if (alreadyPassing) {
    passProbability = 100
  } else if (!hasKnownData) {
    passProbability = 50  // neutral placeholder
  } else {
    const needed     = minEndSemMarks ?? 0
    const gap        = endSemMarks - needed
    const clampRange = Math.max(endSemMax * 0.2, 5)
    const clampedGap = Math.max(-clampRange, Math.min(clampRange, gap))
    passProbability  = Math.round(((clampedGap + clampRange) / (2 * clampRange)) * 100)
  }

  const status: 'safe' | 'borderline' | 'danger' =
    passProbability >= 75 ? 'safe' : passProbability >= 45 ? 'borderline' : 'danger'

  const endSemMaxLabel = endSemMax || '?'
  let headline = ''
  let subtext  = ''
  if (!hasKnownData) {
    headline = 'Enter your marks to see the requirement.'
    subtext  = 'Fill in Internal and Mid Sem marks to calculate your minimum End Sem score.'
  } else if (impossible) {
    headline = 'Passing is no longer mathematically possible.'
    subtext  = `Even with full marks in End Sem, you cannot reach ${passingMark}%.`
  } else if (alreadyPassing) {
    headline = "You're already passing!"
    subtext  = 'Your known marks are enough to pass. End Sem is just a bonus.'
  } else {
    const gap = endSemMarks - (minEndSemMarks ?? 0)
    if (gap > endSemMax * 0.15) {
      headline = `You need ${minEndSemMarks}/${endSemMaxLabel} in End Sem to pass.`
      subtext  = 'You are currently in the safe zone.'
    } else if (gap >= 0) {
      headline = `You need ${minEndSemMarks}/${endSemMaxLabel} in End Sem to pass.`
      subtext  = `You're targeting ${endSemMarks}. Stay on track — it's close!`
    } else {
      headline = `You need ${minEndSemMarks}/${endSemMaxLabel} in End Sem to pass.`
      subtext  = `Scoring below ${minEndSemMarks} may lead to failure.`
    }
  }

  return {
    internalScore, midSemScore, endSemScore,
    knownScore, expectedTotal,
    passingMark, minEndSemMarks,
    alreadyPassing, impossible, hasKnownData,
    passProbability,
    status, headline, subtext, endSemMax,
  }
}

// ─── Mark Input ───────────────────────────────────────────────────────────────

function MarkInput({
  label, sublabel, icon: Icon, value, max, onChange, onMaxChange, color,
  valuePlaceholder, maxPlaceholder,
}: {
  label: string
  sublabel: string
  icon: React.ElementType
  value: NumOrEmpty
  max: NumOrEmpty
  onChange: (v: NumOrEmpty) => void
  onMaxChange: (v: NumOrEmpty) => void
  color: string
  valuePlaceholder: string
  maxPlaceholder: string
}) {
  const exceeded =
    typeof value === 'number' && typeof max === 'number' && max > 0 && value > max

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') { onChange(''); return }
    const parsed = parseInt(raw, 10)
    if (!isNaN(parsed)) onChange(Math.max(0, parsed))
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') { onMaxChange(''); return }
    const parsed = parseInt(raw, 10)
    if (!isNaN(parsed)) onMaxChange(Math.max(1, parsed))
  }

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}>
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: `${color}22`, border: `1px solid ${color}44` }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <span
          className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full uppercase tracking-wide"
          style={{ background: 'var(--inner-surface)', border: '1px solid var(--divider)' }}
        >
          {sublabel}
        </span>
      </div>

      <div className="grid grid-cols-[1fr,28px,1fr] items-end gap-1.5">
        <div>
          <p className="text-[10px] text-muted-foreground/60 mb-1.5 font-semibold tracking-widest uppercase">
            Scored
          </p>
          <Input
            type="number"
            min={0}
            value={value}
            placeholder={valuePlaceholder}
            onChange={handleValueChange}
            className={`h-11 text-center font-bold text-lg ${exceeded ? 'ring-2 ring-red-500/40' : ''}`}
          />
        </div>
        <div className="flex items-center justify-center pb-2">
          <span className="text-muted-foreground/40 text-base font-medium select-none">/</span>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground/60 mb-1.5 font-semibold tracking-widest uppercase">
            Out Of
          </p>
          <Input
            type="number"
            min={1}
            value={max}
            placeholder={maxPlaceholder}
            onChange={handleMaxChange}
            className="h-11 text-center font-bold text-lg"
          />
        </div>
      </div>

      <AnimatePresence>
        {exceeded && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="mt-2.5 flex items-center gap-1.5 text-xs text-red-400"
          >
            <AlertTriangle className="w-3 h-3 shrink-0" />
            Scored marks cannot exceed maximum marks.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Calculator ──────────────────────────────────────────────────────────

export function PassCalculator() {
  const [inp, setInp] = useState<Inputs>(DEFAULTS)

  const setMark = (key: keyof Omit<Inputs, 'passingPercent'>, value: NumOrEmpty) =>
    setInp(prev => ({ ...prev, [key]: value }))
  const setPassing = (value: number) =>
    setInp(prev => ({ ...prev, passingPercent: value }))

  const r = calcResults(inp)

  // Neutral status for the empty/no-data state
  const displayStatus = !r.hasKnownData ? 'neutral' : r.impossible ? 'danger' : r.status

  // Track when user has filled in enough to get a meaningful result
  const passTimer = useRef<ReturnType<typeof setTimeout>>()
  const lastPassKey = useRef<string>('')
  useEffect(() => {
    if (typeof inp.endSemMax !== 'number' || inp.endSemMax === 0) return
    const key = `${inp.endSemMax}/${inp.endSemMarks}/${inp.passingPercent}`
    if (key === lastPassKey.current) return
    clearTimeout(passTimer.current)
    passTimer.current = setTimeout(() => {
      lastPassKey.current = key
      GA.passChecked(inp.endSemMax as number, inp.passingPercent)
    }, 800)
    return () => clearTimeout(passTimer.current)
  }, [inp.endSemMax, inp.endSemMarks, inp.passingPercent])

  const STATUS_MAP = {
    safe:       { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', barColor: 'bg-emerald-500', Icon: Shield,        label: 'Safe Zone'     },
    borderline: { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25',  barColor: 'bg-amber-500',   Icon: AlertTriangle, label: 'Borderline'    },
    danger:     { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/25',    barColor: 'bg-red-500',     Icon: XCircle,       label: 'At Risk'       },
    neutral:    { color: 'text-muted-foreground', bg: 'bg-foreground/[0.04]', border: 'border-foreground/10', barColor: 'bg-foreground/20', Icon: HelpCircle, label: 'Enter Marks' },
  } as const
  const sc = STATUS_MAP[displayStatus]

  const knownPct     = Math.round((r.knownScore / 70) * 100)
  const endSemReqPct = r.endSemMax > 0 && r.minEndSemMarks !== null
    ? Math.min(100, Math.round((r.minEndSemMarks / r.endSemMax) * 100))
    : 0

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      <div className="grid lg:grid-cols-5 gap-6">

        {/* ── Mark Inputs ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <GlassCard className="p-6">
            <h2 className="text-base font-semibold font-display mb-5 flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-400" />
              Enter Your Marks
            </h2>

            <div className="space-y-3">
              <MarkInput
                label="Internal Marks"       sublabel="Weightage: 50 pts"
                icon={BookOpen}              color="#6366f1"
                value={inp.internalMarks}    max={inp.internalMax}
                valuePlaceholder="e.g. 35"   maxPlaceholder="e.g. 50"
                onChange={v => setMark('internalMarks', v)}
                onMaxChange={v => setMark('internalMax', v)}
              />
              <MarkInput
                label="Mid Sem Marks"        sublabel="Weightage: 20 pts"
                icon={FileText}              color="#8b5cf6"
                value={inp.midSemMarks}      max={inp.midSemMax}
                valuePlaceholder="e.g. 14"   maxPlaceholder="e.g. 20"
                onChange={v => setMark('midSemMarks', v)}
                onMaxChange={v => setMark('midSemMax', v)}
              />
              <MarkInput
                label="End Sem (Expected)"   sublabel="Weightage: 30 pts"
                icon={GraduationCap}         color="#06b6d4"
                value={inp.endSemMarks}      max={inp.endSemMax}
                valuePlaceholder="e.g. 20"   maxPlaceholder="e.g. 30"
                onChange={v => setMark('endSemMarks', v)}
                onMaxChange={v => setMark('endSemMax', v)}
              />
            </div>

            <p className="text-[11px] text-muted-foreground/50 text-center mt-3 leading-relaxed">
              Both "Scored" and "Out Of" fields are editable — enter custom values for any exam.
            </p>

            <div className="mt-4 pt-4 border-t border-[var(--divider)]">
              <p className="text-xs text-muted-foreground font-medium mb-1.5">Passing Criteria</p>
              <div className="flex items-center gap-2 max-w-[140px]">
                <Input
                  type="number" min={1} max={100}
                  value={inp.passingPercent}
                  onChange={e => {
                    const parsed = parseInt(e.target.value, 10)
                    if (!isNaN(parsed)) setPassing(Math.max(1, Math.min(100, parsed)))
                  }}
                  className="h-9 text-center font-semibold"
                />
                <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">% of 100</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* ── Score Summary ────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-3">

          {/* CARD 1 — Secured So Far */}
          <GlassCard className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">
                  Secured So Far
                </p>
                <p className="text-xs text-muted-foreground">Internal + Mid Sem combined</p>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${sc.bg} ${sc.border} ${sc.color}`}
              >
                <sc.Icon className="w-3 h-3" />
                {sc.label}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 mb-3">
              <motion.span
                key={r.knownScore}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-bold font-display text-foreground"
              >
                {r.knownScore.toFixed(1)}
              </motion.span>
              <span className="text-base text-muted-foreground font-medium">/ 70 pts</span>
            </div>

            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                animate={{ width: `${Math.min(100, knownPct)}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground/50 mt-1">
              <span>0</span>
              <span>{knownPct}% of pre-exam marks</span>
              <span>70</span>
            </div>
          </GlassCard>

          {/* CARD 2 — End Sem Requirement */}
          <div className={`rounded-2xl p-5 border ${sc.bg} ${sc.border}`}>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">
              End Sem Requirement
            </p>

            <AnimatePresence mode="wait">

              {/* State A — no marks entered yet */}
              {!r.hasKnownData && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}>
                    <HelpCircle className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Enter Internal &amp; Mid Sem marks to calculate your minimum End Sem requirement.
                  </p>
                </motion.div>
              )}

              {/* State B — impossible */}
              {r.hasKnownData && r.impossible && (
                <motion.div
                  key="impossible"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                    <XCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-base font-bold font-display text-red-400 leading-tight">
                      Mathematically Impossible
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Even full marks in End Sem can't reach {r.passingMark}%.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* State C — already passing */}
              {r.hasKnownData && !r.impossible && r.alreadyPassing && (
                <motion.div
                  key="passing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold font-display text-emerald-400 leading-tight">Already Passing!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">No minimum score required.</p>
                  </div>
                </motion.div>
              )}

              {/* State D — marks required */}
              {r.hasKnownData && !r.impossible && !r.alreadyPassing && (
                <motion.div key="required" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <motion.span
                      key={r.minEndSemMarks}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`text-5xl font-bold font-display ${sc.color}`}
                    >
                      {r.minEndSemMarks ?? '—'}
                    </motion.span>
                    <span className={`text-xl font-medium opacity-60 ${sc.color}`}>
                      / {r.endSemMax || '?'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">minimum marks to pass</p>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                    <motion.div
                      className={`h-full rounded-full ${sc.barColor}`}
                      animate={{ width: `${endSemReqPct}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* CARD 3 — Bottom mini stats */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-semibold">Expected Total</p>
              <motion.p
                key={r.expectedTotal}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl font-bold font-display text-foreground"
              >
                {r.expectedTotal.toFixed(0)}
              </motion.p>
              <p className="text-[10px] text-muted-foreground mt-0.5">out of 100</p>
            </div>
            <div className={`rounded-xl p-4 text-center border ${sc.bg} ${sc.border}`}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-semibold">Pass Chance</p>
              <motion.p
                key={r.passProbability}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-2xl font-bold font-display ${sc.color}`}
              >
                {r.hasKnownData ? `${r.passProbability}%` : '—'}
              </motion.p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`${inp.endSemMarks}-${inp.endSemMax}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs font-semibold mt-1.5 leading-snug text-slate-700 dark:text-slate-300"
                >
                  {inp.endSemMarks !== '' && inp.endSemMax !== ''
                    ? `If you score ${inp.endSemMarks} out of ${inp.endSemMax}`
                    : inp.endSemMax !== ''
                    ? `Out of ${inp.endSemMax} in End Sem`
                    : 'Enter End Sem score'}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

      {/* ── Status Banner ────────────────────────────────────────────────────── */}
      <motion.div
        key={r.status + String(r.hasKnownData)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-6 border ${sc.bg} ${sc.border} flex items-center gap-4`}
      >
        <div className={`rounded-full p-3 border ${sc.bg} ${sc.border} shrink-0`}>
          <sc.Icon className={`w-6 h-6 ${sc.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-xs font-semibold uppercase tracking-widest ${sc.color}`}>{sc.label}</span>
          <p className={`text-xl font-bold font-display mt-1 ${sc.color}`}>{r.headline}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{r.subtext}</p>
        </div>
        {r.hasKnownData && (
          <div className="hidden sm:block text-right shrink-0">
            <div className={`text-4xl font-bold font-display ${sc.color}`}>{r.passProbability}%</div>
            <div className="text-xs text-muted-foreground">pass chance</div>
          </div>
        )}
      </motion.div>

    </div>
  )
}
