'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Building2, CalendarDays, GraduationCap, Trophy, Infinity as InfinityIcon } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  CASE_COMP_DATABASE, DB_CATEGORY_META, DB_CATEGORY_ORDER, ELIGIBILITIES, SECTORS,
  type DbCategory, type Eligibility, type Sector,
} from '@/lib/data/caseCompDatabase'

const EASE = [0.22, 1, 0.36, 1] as const
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PAGE_SIZE = 30

type MonthFilter = 'all' | number | 'flex'

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-200 select-none',
        active
          ? 'text-white border-transparent bg-gradient-to-r from-indigo-500 to-violet-500'
          : 'text-muted-foreground border-black/10 dark:border-white/10 hover:text-foreground hover:border-black/25 dark:hover:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/5'
      )}
    >
      {children}
    </button>
  )
}

function CompCard({ comp }: { comp: (typeof CASE_COMP_DATABASE)[number] }) {
  const primary = comp.categories[0]
  const meta = DB_CATEGORY_META[primary]
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold font-display leading-tight">{comp.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1.5">
            <Building2 className="w-3 h-3" /> {comp.sponsor || '—'}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
          {comp.flexible
            ? <><InfinityIcon className="w-2.5 h-2.5" /> Flexible</>
            : <><CalendarDays className="w-2.5 h-2.5" /> {comp.windowLabel}</>}
        </span>
      </div>

      {comp.format && (
        <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2">{comp.format}</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-1">
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.04] inline-flex items-center gap-1">
          <GraduationCap className="w-2.5 h-2.5" /> {comp.eligibility}
        </span>
        {comp.sector && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
            {comp.sector}
          </span>
        )}
        {comp.categories.map(c => {
          const m = DB_CATEGORY_META[c]
          return (
            <span key={c} className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full border', m.pill)}>
              {m.label}
            </span>
          )
        })}
      </div>

      {comp.prize && (
        <p className="text-[11px] text-emerald-600 dark:text-emerald-300 inline-flex items-center gap-1.5 leading-snug">
          <Trophy className="w-3 h-3 shrink-0" /> <span className="line-clamp-1">{comp.prize}</span>
        </p>
      )}
      {/* keep meta referenced so a single-category card still tints */}
      <span className={cn('sr-only', meta.dot)} />
    </div>
  )
}

export function CaseCompDatabase() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<DbCategory | 'all'>('all')
  const [sector, setSector] = useState<Sector | 'all'>('all')
  const [month, setMonth] = useState<MonthFilter>('all')
  const [elig, setElig] = useState<Eligibility | 'all'>('all')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CASE_COMP_DATABASE.filter(c => {
      if (category !== 'all' && !c.categories.includes(category)) return false
      if (sector !== 'all' && c.sector !== sector) return false
      if (elig !== 'all' && c.eligibility !== elig) return false
      if (month === 'flex' && !c.flexible) return false
      if (typeof month === 'number' && !c.months.includes(month)) return false
      if (q && !(`${c.name} ${c.sponsor} ${c.format}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [query, category, sector, month, elig])

  const shown = filtered.slice(0, visible)
  const resetPage = () => setVisible(PAGE_SIZE)

  return (
    <section className="pt-6 pb-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* intro */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">
          The Global{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">Case-Comp Database</span>
        </h2>
        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto leading-relaxed">
          {CASE_COMP_DATABASE.length} corporate, B-school and undergraduate case competitions worldwide — filter by category, month, and who can enter.
        </p>
      </motion.div>

      {/* filters */}
      <GlassCard className="p-4 sm:p-5 border border-white/10 bg-white/[0.03] mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); resetPage() }}
            placeholder="Search a competition or sponsor…"
            className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-colors placeholder:text-muted-foreground/60"
          />
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mr-1">Category</span>
            <Chip active={category === 'all'} onClick={() => { setCategory('all'); resetPage() }}>All</Chip>
            {DB_CATEGORY_ORDER.map(c => (
              <Chip key={c} active={category === c} onClick={() => { setCategory(c); resetPage() }}>{DB_CATEGORY_META[c].label}</Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mr-1">Month</span>
            <Chip active={month === 'all'} onClick={() => { setMonth('all'); resetPage() }}>All</Chip>
            {MONTHS.map((m, i) => (
              <Chip key={m} active={month === i + 1} onClick={() => { setMonth(i + 1); resetPage() }}>{m}</Chip>
            ))}
            <Chip active={month === 'flex'} onClick={() => { setMonth('flex'); resetPage() }}>Flexible</Chip>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mr-1">Sector</span>
            <Chip active={sector === 'all'} onClick={() => { setSector('all'); resetPage() }}>All</Chip>
            {SECTORS.map(sec => (
              <Chip key={sec} active={sector === sec} onClick={() => { setSector(sec); resetPage() }}>{sec}</Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mr-1">Eligibility</span>
            <Chip active={elig === 'all'} onClick={() => { setElig('all'); resetPage() }}>All</Chip>
            {ELIGIBILITIES.map(e => (
              <Chip key={e} active={elig === e} onClick={() => { setElig(e); resetPage() }}>{e}</Chip>
            ))}
          </div>
        </div>
        {sector !== 'all' && (
          <p className="text-[11px] text-muted-foreground/70 mt-3">
            Sector filtering covers the industry-classified competitions. Comps grouped by another dimension (India, MBA-focus, special-interest) aren&rsquo;t sector-tagged.
          </p>
        )}
      </GlassCard>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">{filtered.length}</span> {filtered.length === 1 ? 'competition' : 'competitions'}
        </span>
        {(query || category !== 'all' || sector !== 'all' || month !== 'all' || elig !== 'all') && (
          <button
            onClick={() => { setQuery(''); setCategory('all'); setSector('all'); setMonth('all'); setElig('all'); resetPage() }}
            className="text-xs text-indigo-300 hover:text-indigo-200 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No competitions match these filters.</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {shown.map(c => <CompCard key={c.id} comp={c} />)}
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
    </section>
  )
}
