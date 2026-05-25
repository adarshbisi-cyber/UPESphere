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
            aria-label="Scroll to calculator"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88 }}
            className="relative w-12 h-12 rounded-full flex items-center justify-center cursor-pointer select-none transition-shadow duration-300"
            style={{
              background: 'var(--arrow-btn-bg)',
              border: '1px solid var(--arrow-btn-border)',
              boxShadow: 'var(--arrow-btn-shadow)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            {/* Pulsing glow ring */}
            <motion.span
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={{ opacity: [0.3, 0.65, 0.3] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ boxShadow: 'var(--arrow-btn-glow)' }}
            />
            <ChevronDown
              className="relative z-10"
              style={{ color: 'var(--arrow-icon-color)', width: 20, height: 20 }}
              strokeWidth={2.5}
            />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
