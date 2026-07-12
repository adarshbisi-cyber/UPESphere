'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Briefcase, ArrowRight, Sparkles } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

const TEASERS = ['Internship board', 'Placement prep', 'Opportunity matching', 'Resume tools']

export function CareerTeaser() {
  return (
    <section className="relative min-h-[calc(100svh-4rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-28 pb-28 overflow-hidden">
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/3 w-[520px] h-[520px] rounded-full bg-indigo-600/15 blur-[130px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] rounded-full bg-violet-600/12 blur-[130px]" />
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-2xl mx-auto text-center">
        {/* animated emblem with radar rings */}
        <motion.div variants={item} className="relative w-24 h-24 mx-auto mb-8">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-3xl border border-indigo-400/30"
              animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
            />
          ))}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30"
          >
            <Briefcase className="w-11 h-11 text-white" />
          </motion.div>
        </motion.div>

        {/* status pill */}
        <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-6">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
          </span>
          In the workshop
        </motion.div>

        <motion.h1 variants={item} className="text-4xl sm:text-6xl font-bold font-display tracking-tight leading-[1.05]">
          Your{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">launchpad</span>
          {' '}is being built.
        </motion.h1>

        <motion.p variants={item} className="text-lg text-muted-foreground mt-5 max-w-xl mx-auto leading-relaxed">
          Internships, placements, and opportunities matched to your grades and goals — all in one place.
          We&rsquo;re heads-down making it happen.
        </motion.p>

        {/* teaser chips */}
        <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-2.5 mt-10">
          {TEASERS.map(t => (
            <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-foreground/80 border border-white/10 bg-white/[0.03]">
              <Sparkles className="w-3 h-3 text-indigo-400" /> {t}
            </span>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-3 mt-14">
          <a
            href="https://forms.gle/nNT7KWYXobfXBUTM8"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow"
          >
            Suggest a feature <ArrowRight className="w-4 h-4" />
          </a>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-foreground border border-white/12 hover:bg-white/5 transition-colors"
          >
            Back to your tools
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}
