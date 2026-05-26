'use client'

import { motion } from 'framer-motion'
import { MessageSquareHeart, Lightbulb, ArrowRight, Sparkles } from 'lucide-react'
import { GA } from '@/lib/analytics'

const FORM_URL = 'https://forms.gle/WxJ8hFrrTLfV4ZmDA'

export function Feedback() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-violet-500/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-64 h-64 bg-indigo-500/8 rounded-full blur-[80px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Card */}
          <div
            className="relative rounded-3xl p-8 sm:p-12 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, var(--glass-from), var(--glass-to))`,
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--glass-shadow)',
            }}
          >
            {/* Gradient edge accent */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/[0.06] via-transparent to-violet-500/[0.06] pointer-events-none" />
            {/* Top border glow line */}
            <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

            <div className="relative grid lg:grid-cols-2 gap-10 items-center">

              {/* ── Left: copy ───────────────────────────────────── */}
              <div>
                {/* Label badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-5"
                  style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: 'rgba(167,139,250,1)' }}>
                  <Sparkles className="w-3.5 h-3.5" />
                  Community Feedback
                </div>

                <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-4">
                  Help Shape{' '}
                  <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                    UPESphere
                  </span>
                </h2>

                <p className="text-base text-muted-foreground leading-relaxed mb-3 max-w-md">
                  Found a bug? Have an idea? Your feedback and feature suggestions help us build a smarter platform for every student.
                </p>

                <p className="text-sm text-muted-foreground/70 max-w-sm">
                  We read every submission — your suggestions genuinely shape what gets built next.
                </p>

                {/* Feature highlights */}
                <div className="flex flex-wrap gap-3 mt-6">
                  {[
                    { icon: MessageSquareHeart, text: 'Report a bug' },
                    { icon: Lightbulb,          text: 'Request a feature' },
                    { icon: Sparkles,           text: 'Share an idea' },
                  ].map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground"
                      style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}
                    >
                      <Icon className="w-3 h-3 text-indigo-400" />
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right: CTAs ──────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4 lg:justify-end">

                {/* Primary CTA */}
                <motion.a
                  href={FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => GA.feedbackClicked('give_feedback')}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="group relative inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl text-sm font-semibold text-white overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: '0 4px 20px rgba(99,102,241,0.35), 0 0 0 1px rgba(255,255,255,0.08) inset',
                  }}
                >
                  {/* Hover shimmer */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                  <MessageSquareHeart className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Give Feedback</span>
                  <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-0.5 transition-transform" />
                </motion.a>

                {/* Secondary CTA */}
                <motion.a
                  href={FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => GA.feedbackClicked('suggest_feature')}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl text-sm font-semibold transition-colors"
                  style={{
                    background: 'var(--muted-surface)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--foreground)',
                  }}
                >
                  <Lightbulb className="w-4 h-4 text-amber-400 group-hover:text-amber-300 transition-colors" />
                  Suggest a Feature
                </motion.a>

              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  )
}
