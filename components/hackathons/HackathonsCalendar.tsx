'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Building2, CalendarDays, Trophy, Infinity as InfinityIcon, Code2, Sparkles } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { cn, EASE_OUT } from '@/lib/utils'
import { HACKATHONS, HACKATHON_CATEGORIES } from '@/lib/data/hackathons'

const EASE = EASE_OUT
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PAGE_SIZE = 30

// Short labels + a distinct accent per hackathon category.
const CAT_META: Record<string, { short: string; pill: string; dot: string }> = {
  'Global Tech Hackathons':                    { short: 'Global Tech',    pill: 'bg-indigo-500/12 border-indigo-500/25 text-indigo-700 dark:text-indigo-200',   dot: 'bg-indigo-500' },
  'Fintech & Blockchain Hackathons':           { short: 'Fintech',        pill: 'bg-emerald-500/12 border-emerald-500/25 text-emerald-700 dark:text-emerald-200', dot: 'bg-emerald-500' },
  'Healthcare & Life Sciences Hackathons':     { short: 'Healthcare',     pill: 'bg-rose-500/12 border-rose-500/25 text-rose-700 dark:text-rose-200',           dot: 'bg-rose-500' },
  'Sustainability & Social Impact Hackathons': { short: 'Sustainability', pill: 'bg-lime-500/12 border-lime-500/25 text-lime-700 dark:text-lime-200',           dot: 'bg-lime-500' },
  'Industry-Specific Hackathons':              { short: 'Industry',       pill: 'bg-amber-500/12 border-amber-500/25 text-amber-700 dark:text-amber-200',       dot: 'bg-amber-500' },
  'India-Specific Hackathons':                 { short: 'India',          pill: 'bg-cyan-500/12 border-cyan-500/25 text-cyan-700 dark:text-cyan-200',           dot: 'bg-cyan-500' },
}

type MonthFilter = 'all' | number | 'flex'

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-200 select-none',
        active
          ? 'text-white border-transparent bg-gradient-to-r from-cyan-500 to-indigo-500'
          : 'text-muted-foreground border-black/10 dark:border-white/10 hover:text-foreground hover:border-black/25 dark:hover:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/5'
      )}
    >
      {children}
    </button>
  )
}

function HackCard({ h, index }: { h: (typeof HACKATHONS)[number]; index: number }) {
  const meta = CAT_META[h.category] ?? { short: h.category, pill: 'bg-white/5 border-white/10 text-foreground/80', dot: 'bg-slate-500' }
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: Math.min(index, 12) * 0.04, ease: EASE }}
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold font-display leading-tight">{h.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1.5">
            <Building2 className="w-3 h-3" /> {h.sponsor || '—'}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
          {h.flexible
            ? <><InfinityIcon className="w-2.5 h-2.5" /> Flexible</>
            : <><CalendarDays className="w-2.5 h-2.5" /> {h.windowLabel}</>}
        </span>
      </div>

      {h.format && <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2">{h.format}</p>}

      <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-1">
        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1', meta.pill)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} /> {meta.short}
        </span>
      </div>

      {h.prize && (
        <p className="text-[11px] text-emerald-600 dark:text-emerald-300 inline-flex items-center gap-1.5 leading-snug">
          <Trophy className="w-3 h-3 shrink-0" /> <span className="line-clamp-1">{h.prize}</span>
        </p>
      )}
    </motion.div>
  )
}

export function HackathonsCalendar() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | 'all'>('all')
  const [month, setMonth] = useState<MonthFilter>('all')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const resetPage = () => setVisible(PAGE_SIZE)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return HACKATHONS.filter(h => {
      if (category !== 'all' && h.category !== category) return false
      if (month === 'flex' && !h.flexible) return false
      if (typeof month === 'number' && !h.months.includes(month)) return false
      if (q && !(`${h.name} ${h.sponsor} ${h.format}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [query, category, month])

  const shown = filtered.slice(0, visible)

  return (
    <div className="pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
        className="max-w-6xl mx-auto text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-medium mb-5">
          <Sparkles className="w-3.5 h-3.5" /> Build · Ship · Win
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight">
          Hackathon{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">Calendar</span>
        </h1>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
          {HACKATHONS.length} hackathons and innovation challenges worldwide — from global tech to fintech, healthcare, sustainability, and India-first builds.
        </p>
      </motion.div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto">
        <GlassCard className="p-4 sm:p-5 border border-white/10 bg-white/[0.03] mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); resetPage() }}
              placeholder="Search a hackathon or host…"
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-cyan-500/50 focus:bg-white/[0.06] transition-colors placeholder:text-muted-foreground/60"
            />
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mr-1 inline-flex items-center gap-1"><Code2 className="w-3 h-3" />Track</span>
              <Chip active={category === 'all'} onClick={() => { setCategory('all'); resetPage() }}>All</Chip>
              {HACKATHON_CATEGORIES.map(c => (
                <Chip key={c} active={category === c} onClick={() => { setCategory(c); resetPage() }}>{CAT_META[c]?.short ?? c}</Chip>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mr-1 inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" />Month</span>
              <Chip active={month === 'all'} onClick={() => { setMonth('all'); resetPage() }}>All</Chip>
              {MONTHS.map((m, i) => (
                <Chip key={m} active={month === i + 1} onClick={() => { setMonth(i + 1); resetPage() }}>{m}</Chip>
              ))}
              <Chip active={month === 'flex'} onClick={() => { setMonth('flex'); resetPage() }}>Flexible</Chip>
            </div>
          </div>
        </GlassCard>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">{filtered.length}</span> {filtered.length === 1 ? 'hackathon' : 'hackathons'}
          </span>
          {(query || category !== 'all' || month !== 'all') && (
            <button
              onClick={() => { setQuery(''); setCategory('all'); setMonth('all'); resetPage() }}
              className="text-xs text-cyan-300 hover:text-cyan-200 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No hackathons match these filters.</p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {shown.map((h, i) => <HackCard key={h.id} h={h} index={i} />)}
            </div>
            {visible < filtered.length && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setVisible(v => v + PAGE_SIZE)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-foreground border border-white/12 hover:bg-white/5 transition-colors"
                >
                  Load more ({filtered.length - visible} left)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
