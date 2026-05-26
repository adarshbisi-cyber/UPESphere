'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { GA } from '@/lib/analytics'

const faqs = [
  {
    q: 'Which universities does UPESphere support?',
    a: 'UPESphere supports VTU, SRM, KIIT, Anna University, UPES, and a Generic 10-point and 4-point scale that covers most Indian and international universities. More presets are added regularly.',
  },
  {
    q: 'Is UPESphere free to use?',
    a: 'Yes! All calculators — GPA, CGPA, and Attendance — are completely free to use without an account. Sign up to save your history and access the personal dashboard.',
  },
  {
    q: 'How is SGPA different from CGPA?',
    a: 'SGPA (Semester GPA) is your GPA for a single semester calculated from that semester\'s subjects. CGPA (Cumulative GPA) is the weighted average across all completed semesters, factoring in each semester\'s credits.',
  },
  {
    q: 'How does the safe-bunk calculator work?',
    a: 'We calculate how many classes you can miss while still maintaining your required attendance percentage. The formula is: safe_bunks = floor(attended × 100 / required%) − total_classes.',
  },
  {
    q: 'Can UPESphere predict what CGPA I can achieve?',
    a: 'Yes! Enter your current semester-wise SGPAs and set your target CGPA. The Target Predictor will tell you the exact SGPA you need to average in remaining semesters to hit your goal.',
  },
  {
    q: 'Is my data stored securely?',
    a: 'We use Supabase with row-level security, meaning only you can see your saved calculations. All data is encrypted at rest and in transit.',
  },
  {
    q: 'Can I export my results as PDF?',
    a: 'Yes — you can export any calculation result as a PDF or share a shareable link card directly with friends (feature available with a free account).',
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold font-display tracking-tight mb-4">
            Frequently asked{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              questions
            </span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about UPESphere.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: `linear-gradient(135deg, var(--glass-from), var(--glass-to))`, border: '1px solid var(--glass-border)' }}
            >
              <button
                onClick={() => {
                  const isOpening = open !== i
                  setOpen(isOpening ? i : null)
                  if (isOpening) GA.faqExpanded(faq.q)
                }}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.03] transition-colors"
              >
                <span className="font-medium text-foreground pr-4">{faq.q}</span>
                <motion.div
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </motion.div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-[var(--divider)] pt-4">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
