'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, Search, HelpCircle, MessageSquare, Lightbulb, X,
} from 'lucide-react'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/landing/Footer'
import { GA } from '@/lib/analytics'
import { cn } from '@/lib/utils'

const FEEDBACK_URL = 'https://forms.gle/nNT7KWYXobfXBUTM8'

const faqs = [
  {
    category: 'Calculators & Tools',
    q: 'Which universities does UPESphere support?',
    a: 'UPESphere supports VTU, SRM, KIIT, Anna University, UPES, and a Generic 10-point and 4-point scale that covers most Indian and international universities. More presets are added regularly.',
  },
  {
    category: 'Calculators & Tools',
    q: 'How is SGPA different from CGPA?',
    a: "SGPA (Semester GPA) is your GPA for a single semester calculated from that semester's subjects. CGPA (Cumulative GPA) is the weighted average across all completed semesters, factoring in each semester's credits.",
  },
  {
    category: 'Calculators & Tools',
    q: 'How does the safe-bunk calculator work?',
    a: 'We calculate how many classes you can miss while still maintaining your required attendance percentage. The formula is: safe_bunks = floor(attended × 100 / required%) − total_classes.',
  },
  {
    category: 'Calculators & Tools',
    q: 'Can UPESphere predict what CGPA I can achieve?',
    a: 'Yes! Enter your current semester-wise SGPAs and set your target CGPA. The Target Predictor will tell you the exact SGPA you need to average in remaining semesters to hit your goal.',
  },
  {
    category: 'Platform & Account',
    q: 'Is UPESphere free to use?',
    a: 'Yes! All calculators — GPA, CGPA, and Attendance — are completely free to use without an account. Sign up to save your history and access the personal dashboard.',
  },
  {
    category: 'Platform & Account',
    q: 'Is my data stored securely?',
    a: 'We use Supabase with row-level security, meaning only you can see your saved calculations. All data is encrypted at rest and in transit.',
  },
  {
    category: 'Platform & Account',
    q: 'Can I export my results as PDF?',
    a: 'Yes — you can export any calculation result as a PDF or share a shareable link card directly with friends (feature available with a free account).',
  },
]

const categories = Array.from(new Set(faqs.map(f => f.category)))

// ── Single accordion item ─────────────────────────────────────────────────────
function FAQItem({
  faq,
  open,
  onToggle,
  highlight,
  delay,
}: {
  faq: (typeof faqs)[0]
  open: boolean
  onToggle: () => void
  highlight: string
  delay: number
}) {
  const highlightText = (text: string) => {
    if (!highlight) return text
    const idx = text.toLowerCase().indexOf(highlight.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-indigo-500/25 text-indigo-300 rounded px-0.5">
          {text.slice(idx, idx + highlight.length)}
        </mark>
        {text.slice(idx + highlight.length)}
      </>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, var(--glass-from), var(--glass-to))`,
        border: `1px solid ${open ? 'rgba(99,102,241,0.3)' : 'var(--glass-border)'}`,
        transition: 'border-color 0.2s',
      }}
    >
      <button
        onClick={() => {
          const opening = !open
          onToggle()
          if (opening) GA.faqExpanded(faq.q)
        }}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.03] transition-colors"
        aria-expanded={open}
      >
        <span className={cn('font-medium pr-4 text-[15px] leading-snug', open ? 'text-foreground' : 'text-foreground/85')}>
          {highlightText(faq.q)}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0"
        >
          <ChevronDown className={cn('w-4.5 h-4.5 transition-colors', open ? 'text-indigo-400' : 'text-muted-foreground')} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t pt-4"
              style={{ borderColor: 'var(--divider)' }}
            >
              {highlightText(faq.a)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FAQPage() {
  const [openItem, setOpenItem] = useState<string | null>(faqs[0].q)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return null
    return faqs.filter(
      f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
    )
  }, [search])

  const toggle = (q: string) => setOpenItem(prev => (prev === q ? null : q))

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/8 rounded-full blur-[120px]"
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-8 right-1/4 w-72 h-72 bg-violet-500/8 rounded-full blur-[100px]"
            animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6"
          >
            <HelpCircle className="w-4 h-4" />
            Help Center
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-5xl sm:text-6xl font-bold font-display tracking-tight leading-[1.1] mb-5"
          >
            Frequently asked{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              questions
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto"
          >
            Everything you need to know about UPESphere — calculators, accounts, data, and more.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="relative max-w-lg mx-auto"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search questions…"
              className={cn(
                'w-full pl-11 pr-10 py-3.5 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200',
                'bg-white/[0.04] border focus:border-indigo-500/40 focus:bg-indigo-500/[0.04]'
              )}
              style={{ borderColor: 'var(--glass-border)' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/10 text-muted-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Accordion ── */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Search results */}
          {filtered !== null && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <p className="text-sm text-muted-foreground">
                  {filtered.length === 0
                    ? 'No results found'
                    : `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for `}
                  {filtered.length > 0 && (
                    <span className="text-foreground font-medium">"{search}"</span>
                  )}
                </p>
              </div>
              {filtered.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-from)' }}>
                  <HelpCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No questions matched. Try a different search or</p>
                  <a
                    href={FEEDBACK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                  >
                    ask us directly →
                  </a>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filtered.map((faq, i) => (
                    <FAQItem
                      key={faq.q}
                      faq={faq}
                      open={openItem === faq.q}
                      onToggle={() => toggle(faq.q)}
                      highlight={search}
                      delay={i * 0.04}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Grouped by category (no search) */}
          {filtered === null && (
            <div className="space-y-10">
              {categories.map((category, ci) => {
                const items = faqs.filter(f => f.category === category)
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: ci * 0.1 }}
                  >
                    {/* Category label */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0',
                          ci === 0 ? 'bg-indigo-500/20' : 'bg-violet-500/20'
                        )}
                      >
                        {ci === 0
                          ? <Search className={cn('w-3 h-3', 'text-indigo-400')} />
                          : <HelpCircle className="w-3 h-3 text-violet-400" />
                        }
                      </div>
                      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {category}
                      </h2>
                      <div className="flex-1 h-px" style={{ background: 'var(--divider)' }} />
                    </div>

                    {/* Items */}
                    <div className="space-y-2.5">
                      {items.map((faq, i) => (
                        <FAQItem
                          key={faq.q}
                          faq={faq}
                          open={openItem === faq.q}
                          onToggle={() => toggle(faq.q)}
                          highlight=""
                          delay={ci * 0.08 + i * 0.05}
                        />
                      ))}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="pb-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl overflow-hidden text-center p-10 sm:p-14"
            style={{
              background: `linear-gradient(135deg, var(--glass-from), var(--glass-to))`,
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--glass-shadow)',
            }}
          >
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/3 w-64 h-32 bg-indigo-500/10 rounded-full blur-[60px]" />
              <div className="absolute bottom-0 right-1/3 w-64 h-32 bg-violet-500/10 rounded-full blur-[60px]" />
            </div>

            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center mx-auto mb-5">
                <HelpCircle className="w-6 h-6 text-indigo-400" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight mb-3">
                Still have questions?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                Can't find what you're looking for? We'd love to hear from you and help out.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={FEEDBACK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all duration-200 shadow-lg shadow-indigo-500/25 w-full sm:w-auto justify-center"
                >
                  <MessageSquare className="w-4 h-4" />
                  Give Feedback
                </a>
                <a
                  href={FEEDBACK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full sm:w-auto justify-center"
                  style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)', color: 'hsl(var(--muted-foreground))' }}
                >
                  <Lightbulb className="w-4 h-4" />
                  Suggest a Feature
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
