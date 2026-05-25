'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Aryan Sharma',
    role: 'B.Tech CSE, VTU · Sem 5',
    avatar: 'AS',
    color: 'from-indigo-500 to-violet-500',
    text: "UPESphere is the only tool I use every semester. The CGPA predictor literally saved my academic life — I knew exactly what I needed before exams.",
    stars: 5,
  },
  {
    name: 'Priya Menon',
    role: 'B.E. ECE, Anna University · Sem 7',
    avatar: 'PM',
    color: 'from-cyan-500 to-indigo-500',
    text: "The attendance calculator is insanely useful. I can finally calculate exactly how many classes I can skip without stressing about the 75% rule.",
    stars: 5,
  },
  {
    name: 'Rohan Gupta',
    role: 'BCA, SRM · Sem 3',
    avatar: 'RG',
    color: 'from-violet-500 to-pink-500',
    text: "Finally, a student tool that actually looks good and works flawlessly on my phone. I use it before every exam season to plan my study priorities.",
    stars: 5,
  },
  {
    name: 'Sana Sheikh',
    role: 'B.Tech IT, KIIT · Sem 6',
    avatar: 'SS',
    color: 'from-emerald-500 to-cyan-500',
    text: "The insights feature is what makes UPESphere different. It told me my Maths subject was dragging my GPA by 0.4 — I focused on it and got an A!",
    stars: 5,
  },
  {
    name: 'Dev Patel',
    role: 'B.Tech Mech, UPES · Sem 4',
    avatar: 'DP',
    color: 'from-amber-500 to-orange-500',
    text: "Super clean UI. Feels like a premium SaaS product, not a boring calculator website. Shared it with my whole batch — everyone uses it now.",
    stars: 5,
  },
  {
    name: 'Kavya Reddy',
    role: 'B.E. Civil, Anna University · Sem 8',
    avatar: 'KR',
    color: 'from-rose-500 to-violet-500',
    text: "I was aiming for 8.5 CGPA to graduate. UPESphere told me exactly what SGPA I needed every semester. Hit 8.7 in the end!",
    stars: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* bg accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/[0.03] to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-medium mb-4">
            Student Love
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold font-display tracking-tight mb-4">
            Trusted by{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              50,000+ students
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Students across top Indian universities use UPESphere every semester.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl p-6 transition-colors duration-300"
              style={{ background: `linear-gradient(135deg, var(--glass-from), var(--glass-to))`, border: '1px solid var(--glass-border)' }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{`"${t.text}"`}</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-sm font-bold`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
