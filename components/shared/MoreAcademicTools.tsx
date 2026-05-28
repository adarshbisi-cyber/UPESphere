'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { Calculator, Crosshair, TrendingUp, CalendarCheck, Target, ArrowRight } from 'lucide-react'

const ALL_TOOLS = [
  {
    label: 'GPA Calculator',
    description: 'Calculate your semester SGPA instantly',
    href: '/gpa',
    icon: Calculator,
    iconBg: 'bg-indigo-500/15',
    iconClass: 'text-indigo-400',
    borderHover: 'hover:border-indigo-500/30',
    bgHover: 'hover:bg-indigo-500/[0.06]',
    shadowHover: '0 8px 28px rgba(99,102,241,0.18), 0 2px 8px rgba(99,102,241,0.10)',
  },
  {
    label: 'GPA Target',
    description: 'Know the GPA needed to reach your CGPA goal',
    href: '/calculators/gpa-target',
    icon: Crosshair,
    iconBg: 'bg-rose-500/15',
    iconClass: 'text-rose-400',
    borderHover: 'hover:border-rose-500/30',
    bgHover: 'hover:bg-rose-500/[0.06]',
    shadowHover: '0 8px 28px rgba(244,63,94,0.18), 0 2px 8px rgba(244,63,94,0.10)',
  },
  {
    label: 'CGPA Calculator',
    description: 'Track your cumulative academic performance',
    href: '/cgpa',
    icon: TrendingUp,
    iconBg: 'bg-violet-500/15',
    iconClass: 'text-violet-400',
    borderHover: 'hover:border-violet-500/30',
    bgHover: 'hover:bg-violet-500/[0.06]',
    shadowHover: '0 8px 28px rgba(139,92,246,0.18), 0 2px 8px rgba(139,92,246,0.10)',
  },
  {
    label: 'Attendance Planner',
    description: 'Plan bunks and monitor attendance smartly',
    href: '/attendance',
    icon: CalendarCheck,
    iconBg: 'bg-cyan-500/15',
    iconClass: 'text-cyan-400',
    borderHover: 'hover:border-cyan-500/30',
    bgHover: 'hover:bg-cyan-500/[0.06]',
    shadowHover: '0 8px 28px rgba(34,211,238,0.16), 0 2px 8px rgba(34,211,238,0.08)',
  },
  {
    label: 'Can I Pass?',
    description: 'Predict passing probability and required marks',
    href: '/pass',
    icon: Target,
    iconBg: 'bg-emerald-500/15',
    iconClass: 'text-emerald-400',
    borderHover: 'hover:border-emerald-500/30',
    bgHover: 'hover:bg-emerald-500/[0.06]',
    shadowHover: '0 8px 28px rgba(52,211,153,0.16), 0 2px 8px rgba(52,211,153,0.08)',
  },
] as const

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
}

interface Props {
  current: string
}

export function MoreAcademicTools({ current }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const tools = ALL_TOOLS.filter(t => t.href !== current)

  return (
    <section ref={ref} className="max-w-5xl mx-auto mt-20 mb-4 px-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-10"
      >
        <h2 className="text-2xl font-bold font-display tracking-tight mb-2">
          More Academic Tools
        </h2>
        <p className="text-sm text-muted-foreground">
          Everything you need to stay on top of your academics
        </p>
      </motion.div>

      {/* Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {tools.map((tool) => (
          <motion.div
            key={tool.href}
            variants={cardVariants}
            whileHover={{
              y: -3,
              scale: 1.02,
              boxShadow: tool.shadowHover,
              transition: { type: 'spring', stiffness: 400, damping: 24 },
            }}
            className="group"
          >
            <Link
              href={tool.href}
              className={[
                'flex items-start gap-3 p-4 rounded-2xl border border-transparent',
                'transition-colors duration-200',
                tool.borderHover,
                tool.bgHover,
              ].join(' ')}
            >
              <div
                className={[
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  'transition-transform duration-200 group-hover:scale-110',
                  tool.iconBg,
                ].join(' ')}
              >
                <tool.icon
                  className={[
                    'w-[18px] h-[18px] transition-all duration-200 group-hover:-rotate-6',
                    tool.iconClass,
                  ].join(' ')}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors duration-200">
                  {tool.label}
                  <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 flex-shrink-0" />
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {tool.description}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
