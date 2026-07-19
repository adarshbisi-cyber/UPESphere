'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Building2, CalendarDays } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { cn, EASE_OUT } from '@/lib/utils'
import { CORPORATE_CASES } from '@/lib/data/corporateCases'

const EASE = EASE_OUT
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Only surface month chips that actually hold cases.
const ACTIVE_MONTHS = Array.from(new Set(CORPORATE_CASES.map(c => c.month))).sort((a, b) => a - b)

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-200 select-none',
        active
          ? 'text-white border-transparent bg-gradient-to-r from-indigo-500 to-violet-500'
          : 'text-muted-foreground border-black/10 dark:border-white/10 hover:text-foreground hover:border-black/25 dark:hover:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/5'
      )}
    >
      {children}
    </button>
  )
}

function CaseCard({ c, index }: { c: (typeof CORPORATE_CASES)[number]; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ duration: 0.35, delay: Math.min(index, 12) * 0.04, ease: EASE }}
      whileHover={{ y: -4 }}
      className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 overflow-hidden"
    >
      <div className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'radial-gradient(420px at 50% -10%, rgba(99,102,241,0.14), transparent 70%)' }} />
      <div className="relative">
        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300/80">{MONTHS_FULL[c.month - 1]}</span>
        <h3 className="text-base font-semibold font-display leading-tight mt-1">{c.name}</h3>
        <p className="text-sm text-muted-foreground mt-1.5 inline-flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-indigo-400" /> {c.sponsor}
        </p>
      </div>
    </motion.div>
  )
}

export function CorporateCases() {
  const [query, setQuery] = useState('')
  const [month, setMonth] = useState<number | 'all'>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CORPORATE_CASES.filter(c => {
      if (month !== 'all' && c.month !== month) return false
      if (q && !(`${c.name} ${c.sponsor}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [query, month])

  return (
    <section className="px-4 sm:px-6 lg:px-8 mt-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}
        className="mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-4">
          Corporate Cases
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">
          Company-run flagships, <span className="text-muted-foreground">month by month.</span>
        </h2>
        <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">
          {CORPORATE_CASES.length} corporate case competitions Indian B-school students compete in — mapped to the month they typically open.
        </p>
      </motion.div>

      {/* filter bar */}
      <GlassCard className="p-5 border border-white/10 bg-white/[0.03] mb-8">
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search a case or company…"
            className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-colors placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mr-1 inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" />Month</span>
          <Chip active={month === 'all'} onClick={() => setMonth('all')}>All</Chip>
          {ACTIVE_MONTHS.map(m => (
            <Chip key={m} active={month === m} onClick={() => setMonth(m)}>{MONTHS[m - 1]}</Chip>
          ))}
        </div>
      </GlassCard>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">{filtered.length}</span> {filtered.length === 1 ? 'case' : 'cases'}
        </span>
        {(query || month !== 'all') && (
          <button onClick={() => { setQuery(''); setMonth('all') }} className="text-xs text-indigo-300 hover:text-indigo-200 transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No cases match these filters.</p>
      ) : (
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((c, i) => <CaseCard key={c.id} c={c} index={i} />)}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  )
}
