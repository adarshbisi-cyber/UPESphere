'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export function UploadModalShell({
  onClose,
  children,
  maxWidth = 'max-w-md',
}: {
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
}) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 18 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
          onClick={e => e.stopPropagation()}
        >
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, var(--glass-from), var(--glass-to))',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--glass-shadow)',
              backdropFilter: 'blur(24px)',
            }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
