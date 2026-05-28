'use client'

import { Navbar } from '@/components/shared/Navbar'
import { GPATargetCalculator } from '@/components/calculators/GPATargetCalculator'
import { Footer } from '@/components/landing/Footer'
import Link from 'next/link'
import { Crosshair, Calculator, TrendingUp, CalendarCheck, Target, ArrowRight } from 'lucide-react'

const related = [
  {
    label: 'GPA Calculator',
    description: 'Calculate your semester SGPA instantly',
    href: '/gpa',
    icon: Calculator,
    iconBg: 'bg-indigo-500/15',
    iconClass: 'text-indigo-400',
    hoverBorder: 'hover:border-indigo-500/30',
    hoverBg: 'hover:bg-indigo-500/[0.05]',
  },
  {
    label: 'CGPA Calculator',
    description: 'Track your cumulative academic performance',
    href: '/cgpa',
    icon: TrendingUp,
    iconBg: 'bg-violet-500/15',
    iconClass: 'text-violet-400',
    hoverBorder: 'hover:border-violet-500/30',
    hoverBg: 'hover:bg-violet-500/[0.05]',
  },
  {
    label: 'Attendance Planner',
    description: 'Plan bunks and monitor attendance smartly',
    href: '/attendance',
    icon: CalendarCheck,
    iconBg: 'bg-cyan-500/15',
    iconClass: 'text-cyan-400',
    hoverBorder: 'hover:border-cyan-500/30',
    hoverBg: 'hover:bg-cyan-500/[0.05]',
  },
  {
    label: 'Can I Pass?',
    description: 'Predict passing probability and required marks',
    href: '/pass',
    icon: Target,
    iconBg: 'bg-emerald-500/15',
    iconClass: 'text-emerald-400',
    hoverBorder: 'hover:border-emerald-500/30',
    hoverBg: 'hover:bg-emerald-500/[0.05]',
  },
]

export default function GPATargetPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <div className="relative max-w-3xl mx-auto text-center pt-4 pb-12">
          {/* Ambient glow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-1/4 w-[700px] h-64 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(244,63,94,0.10) 0%, rgba(239,68,68,0.04) 50%, transparent 70%)' }}
          />

          <div className="relative flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600/30 to-pink-600/20 border border-rose-500/25 flex items-center justify-center shadow-lg shadow-rose-500/10">
              <Crosshair className="w-7 h-7 text-rose-400" />
            </div>
          </div>

          <h1 className="relative text-5xl sm:text-6xl font-bold font-display tracking-tight mb-5 leading-[1.1]">
            GPA{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 40%, #ec4899 100%)' }}
            >
              Target
            </span>
            {' '}Calculator
          </h1>

          <p className="relative text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Enter your academic standing and instantly discover the exact GPA you need this semester to reach your CGPA goal.
          </p>
        </div>

        {/* ── Calculator ────────────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto">
          <GPATargetCalculator />
        </div>

        {/* ── Related tools ─────────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto mt-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-display tracking-tight mb-2">More Academic Tools</h2>
            <p className="text-sm text-muted-foreground">Everything you need to stay on top of your academics</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {related.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'group flex items-start gap-3 p-4 rounded-2xl border border-transparent transition-all duration-200',
                  item.hoverBorder,
                  item.hoverBg,
                ].join(' ')}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${item.iconBg}`}>
                  <item.icon className={`w-[18px] h-[18px] ${item.iconClass}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors duration-200 flex items-center gap-1">
                    {item.label}
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

      <Footer />
    </main>
  )
}
