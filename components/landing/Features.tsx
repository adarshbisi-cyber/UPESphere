'use client'

import { motion } from 'framer-motion'
import { Calculator, BarChart3, Calendar, Brain, Target, Share2 } from 'lucide-react'

const features = [
  {
    icon: Calculator,
    title: 'GPA Calculator',
    description: 'Support for 10-point, 4-point, and percentage scales. Dynamic subject rows with real-time calculation.',
    color: 'from-indigo-500/20 to-indigo-600/10',
    iconColor: 'text-indigo-400',
    border: 'border-indigo-500/20',
    glow: 'group-hover:shadow-indigo-500/20',
  },
  {
    icon: BarChart3,
    title: 'CGPA Tracker',
    description: 'Semester-wise SGPA entry, cumulative CGPA trends, and target prediction for your dream score.',
    color: 'from-violet-500/20 to-violet-600/10',
    iconColor: 'text-violet-400',
    border: 'border-violet-500/20',
    glow: 'group-hover:shadow-violet-500/20',
  },
  {
    icon: Calendar,
    title: 'Attendance Manager',
    description: 'Know exactly how many classes you can bunk safely. Health meter and instant recovery guidance.',
    color: 'from-cyan-500/20 to-cyan-600/10',
    iconColor: 'text-cyan-400',
    border: 'border-cyan-500/20',
    glow: 'group-hover:shadow-cyan-500/20',
  },
  {
    icon: Brain,
    title: 'AI-Style Insights',
    description: 'Intelligent suggestions like "Improving Math from B to A increases your GPA by 0.3." Rule-based smart analysis.',
    color: 'from-emerald-500/20 to-emerald-600/10',
    iconColor: 'text-emerald-400',
    border: 'border-emerald-500/20',
    glow: 'group-hover:shadow-emerald-500/20',
  },
  {
    icon: Target,
    title: 'Target Predictor',
    description: 'Set your target CGPA and we calculate the exact SGPA you need each semester to reach it.',
    color: 'from-amber-500/20 to-amber-600/10',
    iconColor: 'text-amber-400',
    border: 'border-amber-500/20',
    glow: 'group-hover:shadow-amber-500/20',
  },
  {
    icon: Share2,
    title: 'Save & Share',
    description: 'Save your calculations, export as PDF, and share beautiful result cards with friends.',
    color: 'from-rose-500/20 to-rose-600/10',
    iconColor: 'text-rose-400',
    border: 'border-rose-500/20',
    glow: 'group-hover:shadow-rose-500/20',
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
            Everything You Need
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold font-display tracking-tight mb-4">
            Built for modern{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              students
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Not just calculators — a complete academic analytics platform that understands how Indian universities work.
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
            <motion.div
              key={feature.title}
              variants={item}
              className={`group relative rounded-2xl border ${feature.border} bg-gradient-to-br ${feature.color} p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${feature.glow} cursor-default`}
            >
              <div className={`inline-flex p-3 rounded-xl bg-white/5 border border-white/10 mb-4 ${feature.iconColor}`}>
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold font-display text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
