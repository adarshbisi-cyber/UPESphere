'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Sparkles, TrendingUp, BookOpen, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const stats = [
  { value: '50K+', label: 'Students' },
  { value: '1M+', label: 'Calculations' },
  { value: '100+', label: 'Universities' },
]

const features = ['GPA & CGPA Calculator', 'Attendance Tracker', 'AI Insights', 'Target Predictor']

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background — adapts to theme */}
      <div className="absolute inset-0 bg-background">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-300 text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Smart Academic Companion for Indian Students
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display leading-[1.1] tracking-tight mb-6 text-foreground"
          >
            Track Your{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
              Academic Life
            </span>
            <br />
            Smarter.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Calculate GPA, track CGPA trends, manage attendance, and get AI-powered insights — all in one beautifully designed platform built for Gen Z students.
          </motion.p>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            {features.map((f) => (
              <span
                key={f}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm text-muted-foreground"
                style={{ background: 'var(--muted-surface)', borderColor: 'var(--divider)' }}
              >
                <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                {f}
              </span>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link href="/gpa">
              <Button variant="gradient" size="xl" className="gap-2 min-w-[200px]">
                Calculate GPA
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/attendance">
              <Button variant="outline" size="xl" className="gap-2 min-w-[200px]">
                <BookOpen className="w-5 h-5" />
                Track Attendance
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center justify-center gap-12"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold font-display bg-gradient-to-r dark:from-white dark:to-white/60 from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Hero mockup card */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <div
            className="relative rounded-2xl backdrop-blur-sm p-6 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, var(--glass-from), var(--glass-to))`,
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--glass-shadow)',
            }}
          >
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-transparent to-violet-500/10 pointer-events-none" />

            {/* Mock dashboard header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground font-display">Academic Overview</h3>
                <p className="text-sm text-muted-foreground">Semester 5 — Computer Science</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-sm">
                <TrendingUp className="w-3.5 h-3.5" />
                Improving
              </div>
            </div>

            {/* Mock stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Current GPA', value: '8.7', color: 'text-indigo-500 dark:text-indigo-400', sub: '10 point scale' },
                { label: 'CGPA', value: '8.4', color: 'text-violet-500 dark:text-violet-400', sub: '5 semesters' },
                { label: 'Attendance', value: '84%', color: 'text-emerald-600 dark:text-emerald-400', sub: 'Safe zone' },
                { label: 'Safe Bunks', value: '7', color: 'text-cyan-600 dark:text-cyan-400', sub: 'Remaining' },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-4" style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}>
                  <div className={`text-2xl font-bold font-display ${item.color}`}>{item.value}</div>
                  <div className="text-sm font-medium text-foreground/70 mt-0.5">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.sub}</div>
                </div>
              ))}
            </div>

            {/* Mock progress bars */}
            <div className="space-y-3">
              {[
                { subject: 'Data Structures', grade: 'A+', pct: 90, color: 'from-indigo-500 to-indigo-400' },
                { subject: 'Operating Systems', grade: 'A', pct: 80, color: 'from-violet-500 to-violet-400' },
                { subject: 'Database Systems', grade: 'B+', pct: 70, color: 'from-cyan-500 to-cyan-400' },
              ].map(item => (
                <div key={item.subject} className="flex items-center gap-4">
                  <div className="w-36 text-sm text-muted-foreground truncate">{item.subject}</div>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ duration: 1, delay: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                    />
                  </div>
                  <div className="w-8 text-sm font-medium text-muted-foreground">{item.grade}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
