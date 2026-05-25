'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface ScrollToTargetButtonProps {
  targetId: string
}

export function ScrollToTargetButton({ targetId }: ScrollToTargetButtonProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const target = document.getElementById(targetId)
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [targetId])

  const handleClick = () => {
    const el = document.getElementById(targetId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <motion.button
            onClick={handleClick}
            aria-label="Scroll to Semester GPA Target Calculator"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
            className="relative w-12 h-12 rounded-full flex items-center justify-center cursor-pointer select-none"
            style={{
              background: 'radial-gradient(circle at 40% 35%, rgba(139,92,246,0.22) 0%, rgba(99,102,241,0.12) 60%, rgba(255,255,255,0.04) 100%)',
              border: '1px solid rgba(139,92,246,0.38)',
              boxShadow: '0 0 20px rgba(139,92,246,0.22), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
              backdropFilter: 'blur(14px)',
            }}
          >
            {/* Pulsing glow ring */}
            <motion.span
              className="absolute inset-0 rounded-full"
              animate={{ opacity: [0.35, 0.7, 0.35] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ boxShadow: '0 0 24px rgba(139,92,246,0.35)' }}
            />
            <ChevronDown className="w-5 h-5 text-violet-300 relative z-10" strokeWidth={2.5} />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
