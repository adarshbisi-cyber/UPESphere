'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { ScanLine, Calculator, Activity, CalendarCheck, Crosshair, LayoutDashboard } from 'lucide-react'

const features = [
  {
    icon: ScanLine,
    title: 'AI Curriculum Scanner',
    description: 'Upload curriculum screenshots to instantly auto-fill subjects and credits using OCR — no manual entry needed.',
    color: 'from-violet-500/20 to-violet-600/10',
    iconColor: 'text-violet-400',
    border: 'border-violet-500/20',
    glowColor: 'rgba(139,92,246,0.18)',
  },
  {
    icon: Calculator,
    title: 'Smart GPA Suite',
    description: 'Calculate semester GPA, track cumulative CGPA trends, and simulate future performance across any grading scale.',
    color: 'from-indigo-500/20 to-indigo-600/10',
    iconColor: 'text-indigo-400',
    border: 'border-indigo-500/20',
    glowColor: 'rgba(99,102,241,0.18)',
  },
  {
    icon: Activity,
    title: 'Expected Score Predictor',
    description: 'Forecast your final subject score, analyze passing probability, and estimate end semester outcomes instantly.',
    color: 'from-emerald-500/20 to-emerald-600/10',
    iconColor: 'text-emerald-400',
    border: 'border-emerald-500/20',
    glowColor: 'rgba(16,185,129,0.18)',
  },
  {
    icon: CalendarCheck,
    title: 'Attendance Planner',
    description: 'Track attendance percentage, calculate safe bunks, and get a clear recovery plan before it is too late.',
    color: 'from-cyan-500/20 to-cyan-600/10',
    iconColor: 'text-cyan-400',
    border: 'border-cyan-500/20',
    glowColor: 'rgba(6,182,212,0.18)',
  },
  {
    icon: Crosshair,
    title: 'Target GPA Planner',
    description: 'Set your desired CGPA goal and instantly discover the exact GPA you need to score this semester to reach it.',
    color: 'from-fuchsia-500/20 to-fuchsia-600/10',
    iconColor: 'text-fuchsia-400',
    border: 'border-fuchsia-500/20',
    glowColor: 'rgba(217,70,239,0.18)',
  },
  {
    icon: LayoutDashboard,
    title: 'Personal Academic Dashboard',
    description: 'Save semester records, monitor CGPA trends over time, and access your full academic history anywhere.',
    color: 'from-amber-500/20 to-amber-600/10',
    iconColor: 'text-amber-400',
    border: 'border-amber-500/20',
    glowColor: 'rgba(245,158,11,0.18)',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

function FeatureCard({ feature }: { feature: (typeof features)[0] }) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    card.style.setProperty('--gx', `${e.clientX - rect.left}px`)
    card.style.setProperty('--gy', `${e.clientY - rect.top}px`)
  }

  return (
    <motion.div
      ref={cardRef}
      variants={item}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => cardRef.current?.style.setProperty('--go', '1')}
      onMouseLeave={() => cardRef.current?.style.setProperty('--go', '0')}
      whileHover={{ y: -6, scale: 1.018 }}
      transition={{ type: 'spring', stiffness: 360, damping: 26 }}
      className={`group relative rounded-2xl border ${feature.border} bg-gradient-to-br ${feature.color} p-6 cursor-default overflow-hidden`}
    >
      {/* Cursor-reactive radial glow — zero React re-renders via CSS vars */}
      <div
        className="glow-card-overlay"
        style={{ background: `radial-gradient(380px at var(--gx, 50%) var(--gy, 50%), ${feature.glowColor}, transparent 80%)` }}
      />
      <div className={`relative inline-flex p-3 rounded-xl bg-white/5 border border-white/10 mb-4 ${feature.iconColor}`}>
        <feature.icon className="w-5 h-5" />
      </div>
      <h3 className="relative text-lg font-semibold font-display text-foreground mb-2">{feature.title}</h3>
      <p className="relative text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
    </motion.div>
  )
}

export function Features() {
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium mb-4">
            AI-Powered Platform
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold font-display tracking-tight mb-4">
            Your Complete{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Academic Toolkit
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From GPA tracking to AI-powered curriculum scanning, UPESphere helps students predict scores, manage attendance, and stay academically ahead.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map(feature => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
