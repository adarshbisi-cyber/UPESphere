'use client'

import { forwardRef, useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Search, Star, CalendarDays, Trophy, BellRing, ArrowDown,
  Building2, Target, Compass, AlertTriangle, Sparkles,
} from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  CASE_COMPS, TRACKS, INSTITUTIONS, MONTHS, MONTHS_FULL,
  TRACK_STYLE, INSTITUTION_STYLE, CLUSTERS, HEAT_MAP, HEAT_STYLE,
  LEAD_TIMES, WATCHLIST, AMBITION_LANES, CAVEATS,
  type Track, type Institution,
} from '@/lib/data/caseComps'

const EASE = [0.22, 1, 0.36, 1] as const

// Only surface month chips that actually hold events.
const ACTIVE_MONTHS = Array.from(new Set(CASE_COMPS.map(c => c.month))).sort((a, b) => a - b)

const MUST_DO_COUNT = CASE_COMPS.filter(c => c.mustDo).length

// ── Section heading ───────────────────────────────────────────────────────
function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: EASE }}
      className="mb-10"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-4">
        {eyebrow}
      </div>
      <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">{title}</h2>
      {sub && <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">{sub}</p>}
    </motion.div>
  )
}

// ── Filter chip ───────────────────────────────────────────────────────────
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-200 select-none',
        active
          ? 'text-white border-transparent'
          : 'text-muted-foreground border-white/10 hover:text-foreground hover:border-white/25 hover:bg-white/5'
      )}
    >
      {active && (
        <motion.span
          layoutId="chip-active"
          className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 -z-10"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      {children}
    </button>
  )
}

// ── Event card ────────────────────────────────────────────────────────────
const EventCard = forwardRef<HTMLDivElement, { comp: (typeof CASE_COMPS)[number] }>(function EventCard({ comp }, ref) {
  const inst = INSTITUTION_STYLE[comp.institution]
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ duration: 0.4, ease: EASE }}
      whileHover={{ y: -5 }}
      className={cn(
        'group relative rounded-2xl border bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 overflow-hidden backdrop-blur-sm',
        comp.mustDo ? 'border-amber-400/30' : 'border-white/10'
      )}
    >
      {/* hover glow */}
      <div className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'radial-gradient(420px at 50% -10%, rgba(99,102,241,0.14), transparent 70%)' }} />

      {comp.mustDo && (
        <div className="absolute top-0 right-0 flex items-center gap-1 px-2.5 py-1 rounded-bl-xl bg-amber-400/15 border-l border-b border-amber-400/25 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
          <Star className="w-3 h-3 fill-amber-300" /> Must-do
        </div>
      )}

      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300/80">
            {MONTHS_FULL[comp.month - 1]}
          </span>
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border', inst.text, inst.bg, inst.border)}>
            {comp.institution}
          </span>
        </div>

        <h3 className="text-lg font-semibold font-display leading-tight pr-14">{comp.name}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{comp.host}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-foreground/80">
            <CalendarDays className="w-3.5 h-3.5 text-indigo-400" /> {comp.dateLabel}
          </span>
          {comp.prize && (
            <span className="inline-flex items-center gap-1.5 text-emerald-300 font-medium">
              <Trophy className="w-3.5 h-3.5" /> {comp.prize}
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground/80 mt-3 leading-relaxed">
          <span className="text-foreground/60 font-medium">Watch: </span>{comp.watch}
        </p>

        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground/60">
          <BellRing className="w-3 h-3" /> Registration opens: <span className="text-foreground/70">{comp.regOpens}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {comp.tracks.map(t => {
            const s = TRACK_STYLE[t]
            return (
              <span key={t} className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', s.text, s.bg, s.border)}>
                {t}
              </span>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
})

// ── Main experience ───────────────────────────────────────────────────────
export function CaseCompExperience() {
  const reduce = useReducedMotion()
  const [query, setQuery] = useState('')
  const [month, setMonth] = useState<number | 'all'>('all')
  const [track, setTrack] = useState<Track | 'all'>('all')
  const [inst, setInst] = useState<Institution | 'all'>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CASE_COMPS.filter(c => {
      if (month !== 'all' && c.month !== month) return false
      if (track !== 'all' && !c.tracks.includes(track)) return false
      if (inst !== 'all' && c.institution !== inst) return false
      if (q && !(`${c.name} ${c.host} ${c.watch}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [query, month, track, inst])

  const heroStagger = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.05 } },
  }
  const heroItem = {
    hidden: { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  }

  return (
    <div className="pt-24 pb-24">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* ambient glows */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/3 w-[520px] h-[520px] rounded-full bg-indigo-600/15 blur-[120px]" />
          <div className="absolute top-10 right-1/4 w-[420px] h-[420px] rounded-full bg-violet-600/12 blur-[120px]" />
        </div>

        <motion.div variants={heroStagger} initial="hidden" animate="show" className="max-w-4xl mx-auto text-center">
          <motion.div variants={heroItem} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" /> The Fest Map — 2026 Planning Edition
          </motion.div>

          <motion.h1 variants={heroItem} className="text-4xl sm:text-6xl font-bold font-display tracking-tight leading-[1.05]">
            India&rsquo;s Case-Comp &amp;{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              B-Fest Calendar
            </span>
          </motion.h1>

          <motion.p variants={heroItem} className="text-lg text-muted-foreground mt-5 max-w-2xl mx-auto leading-relaxed">
            Every IIM, IIT and DU fest worth competing in, mapped across the year — prize pools,
            flagship events, and exactly when to set your Unstop alerts.
          </motion.p>

          <motion.div variants={heroItem} className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <a href="#calendar" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow">
              Explore the calendar <ArrowDown className="w-4 h-4" />
            </a>
            <a href="#watchlist" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-foreground border border-white/12 hover:bg-white/5 transition-colors">
              Must-monitor list
            </a>
          </motion.div>

          {/* stat strip */}
          <motion.div variants={heroItem} className="grid grid-cols-3 gap-3 max-w-lg mx-auto mt-12">
            {[
              { n: CASE_COMPS.length, l: 'events mapped' },
              { n: MUST_DO_COUNT, l: 'must-do flagships' },
              { n: '₹2 Cr', l: 'top prize pool' },
            ].map(s => (
              <div key={s.l} className="rounded-2xl border border-white/10 bg-white/[0.03] py-4 px-2">
                <div className="text-2xl sm:text-3xl font-bold font-display bg-gradient-to-br from-indigo-300 to-violet-400 bg-clip-text text-transparent">{s.n}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </motion.div>

          <motion.p variants={heroItem} className="text-xs text-muted-foreground/60 mt-6 max-w-xl mx-auto leading-relaxed">
            This tracks the windows — not registration links. Those go live when organisers launch each comp.
            Bookmark it, then watch Unstop and the host&rsquo;s Instagram closer to date.
          </motion.p>
        </motion.div>
      </section>

      {/* ── Big picture ──────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 mt-28 max-w-6xl mx-auto">
        <SectionHead
          eyebrow="The Big Picture"
          title={<>Two heavy clusters, <span className="text-muted-foreground">one summer lull.</span></>}
          sub="The whole circuit bunches into two windows. If you only optimise one quarter, make it Jan–March — it carries most of the year's prize money and competition count."
        />

        <div className="grid md:grid-cols-3 gap-4">
          {CLUSTERS.map((c, i) => (
            <motion.div
              key={c.tag}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease: EASE, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <GlassCard className={cn(
                'relative h-full p-6 border overflow-hidden transition-shadow',
                c.tone === 'peak'
                  ? 'border-indigo-500/45 bg-gradient-to-br from-indigo-500/[0.14] to-violet-500/[0.07] shadow-xl shadow-indigo-500/15 ring-1 ring-inset ring-indigo-500/15'
                  : 'border-black/8 dark:border-white/10 bg-black/[0.015] dark:bg-white/[0.02]'
              )}>
                {c.tone === 'peak' && (
                  <>
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400" />
                    <div className="pointer-events-none absolute -top-16 -right-10 w-40 h-40 rounded-full bg-indigo-500/20 blur-3xl" />
                  </>
                )}
                <div className="relative flex items-center justify-between mb-1">
                  <span className={cn(
                    'text-xs font-semibold uppercase tracking-widest inline-flex items-center gap-1.5',
                    c.tone === 'peak' ? 'text-indigo-600 dark:text-indigo-300' : 'text-muted-foreground'
                  )}>
                    {c.tone === 'peak' && <Star className="w-3 h-3 fill-current" />}
                    {c.tag}
                  </span>
                  <span className={cn(
                    'text-lg font-bold font-display',
                    c.tone === 'peak' ? 'bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent' : 'text-foreground'
                  )}>{c.window}</span>
                </div>
                <p className="relative text-sm text-muted-foreground leading-relaxed mt-3">{c.body}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* heat map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-6"
        >
          <GlassCard className="p-5 border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center"><CalendarDays className="w-3.5 h-3.5 text-indigo-400" /></div>
              <span className="text-sm font-semibold font-display">Heat map</span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
              {HEAT_MAP.map((h, i) => {
                const s = HEAT_STYLE[h.level]
                return (
                  <motion.div
                    key={h.month}
                    initial={{ opacity: 0, scale: 0.6 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, ease: EASE, delay: i * 0.035 }}
                    whileHover={{ y: -2 }}
                    className={cn('rounded-lg border py-3 text-center', s.cell)}
                  >
                    <div className={cn('text-xs font-bold', s.text)}>{h.month}</div>
                    <div className={cn('text-[9px] uppercase tracking-wide mt-0.5', s.sub)}>{h.level}</div>
                  </motion.div>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/40" /> Peak — register early</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500/40" /> Busy — active</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/40" /> Builds — warming up</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-black/10 dark:bg-white/15" /> Quiet — off-season</span>
            </div>
          </GlassCard>
        </motion.div>
      </section>

      {/* ── The calendar ─────────────────────────────────────────────────── */}
      <section id="calendar" className="px-4 sm:px-6 lg:px-8 mt-28 max-w-6xl mx-auto scroll-mt-24">
        <SectionHead
          eyebrow="The Calendar"
          title={<>Filter the whole circuit</>}
          sub="Search a fest, or filter by month, track and institution. Starred cards are the highest-priority, highest-prize events to never miss."
        />

        {/* filter bar */}
        <GlassCard className="p-5 border border-white/10 bg-white/[0.03] mb-8">
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search a fest, college or sub-event…"
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-colors placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mr-1 inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" />Month</span>
              <Chip active={month === 'all'} onClick={() => setMonth('all')}>All year</Chip>
              {ACTIVE_MONTHS.map(m => (
                <Chip key={m} active={month === m} onClick={() => setMonth(m)}>{MONTHS[m - 1]}</Chip>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mr-1 inline-flex items-center gap-1"><Target className="w-3 h-3" />Track</span>
              <Chip active={track === 'all'} onClick={() => setTrack('all')}>All tracks</Chip>
              {TRACKS.map(t => (
                <Chip key={t} active={track === t} onClick={() => setTrack(t)}>{t}</Chip>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mr-1 inline-flex items-center gap-1"><Building2 className="w-3 h-3" />Institution</span>
              <Chip active={inst === 'all'} onClick={() => setInst('all')}>All</Chip>
              {INSTITUTIONS.map(x => (
                <Chip key={x} active={inst === x} onClick={() => setInst(x)}>{x}</Chip>
              ))}
            </div>
          </div>
        </GlassCard>

        <motion.div layout className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            Showing <span className="text-foreground font-semibold">{filtered.length}</span> {filtered.length === 1 ? 'event' : 'events'}
          </span>
          {(query || month !== 'all' || track !== 'all' || inst !== 'all') && (
            <button
              onClick={() => { setQuery(''); setMonth('all'); setTrack('all'); setInst('all') }}
              className="text-xs text-indigo-300 hover:text-indigo-200 transition-colors"
            >
              Clear filters
            </button>
          )}
        </motion.div>

        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(c => <EventCard key={c.id} comp={c} />)}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <Compass className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No fests match these filters.</p>
            <button onClick={() => { setQuery(''); setMonth('all'); setTrack('all'); setInst('all') }} className="text-sm text-indigo-300 hover:text-indigo-200 mt-2 transition-colors">Reset and see all {CASE_COMPS.length}</button>
          </motion.div>
        )}
      </section>

      {/* ── Lead time ────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 mt-28 max-w-6xl mx-auto">
        <SectionHead
          eyebrow="Timing"
          title={<>When to actually hit &ldquo;register&rdquo;</>}
          sub="The golden rule: start monitoring Unstop and the host's Instagram about two months before the typical fest month. Here's the lead time by format."
        />
        <div className="grid sm:grid-cols-2 gap-4">
          {LEAD_TIMES.map((l, i) => (
            <motion.div
              key={l.format}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, ease: EASE, delay: i * 0.08 }}
            >
              <GlassCard className="h-full p-5 border border-white/10 bg-white/[0.02]">
                <h3 className="text-base font-semibold font-display text-indigo-200">{l.format}</h3>
                <p className="text-xs text-muted-foreground/70 mt-1.5 italic">{l.examples}</p>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{l.timing}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Watchlist ────────────────────────────────────────────────────── */}
      <section id="watchlist" className="px-4 sm:px-6 lg:px-8 mt-28 max-w-6xl mx-auto scroll-mt-24">
        <SectionHead
          eyebrow="Action List"
          title={<>Build this Unstop watch-list now</>}
          sub="The 16 must-monitor events for the next 12 months, in chronological order. Screenshot this."
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {WATCHLIST.map((w, i) => (
            <motion.div
              key={w.name}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, ease: EASE, delay: i * 0.035 }}
              whileHover={{ y: -3 }}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 flex items-start gap-3"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
              <div className="min-w-0">
                <div className="text-sm font-medium leading-tight truncate">{w.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{w.when}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Tracks / by ambition ─────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 mt-28 max-w-6xl mx-auto">
        <SectionHead
          eyebrow="Pick Your Lane"
          title={<>The circuit, by ambition</>}
          sub="Don't chase everything. Pick the track that matches your goal and hit these in order across the year."
        />
        <div className="grid sm:grid-cols-2 gap-4">
          {AMBITION_LANES.map((lane, i) => (
            <motion.div
              key={lane.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease: EASE, delay: i * 0.08 }}
            >
              <GlassCard className="h-full p-6 border border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{lane.icon}</span>
                  <h3 className="text-lg font-semibold font-display">{lane.title}</h3>
                </div>
                <ul className="space-y-2">
                  {lane.picks.map(p => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                      <span className="leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Caveats ──────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 mt-28 max-w-4xl mx-auto">
        <SectionHead
          eyebrow="Read the Fine Print"
          title={<>Before you plan your year</>}
          sub="A few honest caveats so you don't get burned."
        />
        <div className="space-y-3">
          {CAVEATS.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, ease: EASE, delay: i * 0.06 }}
              className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-4"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400/80 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">{c}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
