'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE_OUT } from '@/lib/utils'
import { X } from 'lucide-react'

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Rendered via a portal straight to document.body. Without this, a `fixed
// inset-0` overlay only actually covers the viewport if EVERY ancestor is
// free of transform/filter/backdrop-filter/perspective/will-change — any one
// of those establishes a new containing block, so the "fixed" overlay ends up
// sized and positioned relative to that ancestor's box instead of the
// viewport (this modal is used inside GlassCard sections throughout the app,
// and GlassCard's own `backdrop-blur` is exactly such a property). Portaling
// out of the DOM tree sidesteps the containing-block chain entirely, so it
// stays correct no matter what ancestor it's mounted under, now or later.
export function UploadModalShell({
  onClose,
  children,
  maxWidth = 'max-w-md',
}: {
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Escape-to-close, a Tab focus trap scoped to the modal panel, and
  // restoring focus to whatever triggered the modal on close — every modal
  // in the app shares this shell, so fixing it here fixes all of them at once.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    ;(firstFocusable ?? panelRef.current)?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return

      const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 18 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto outline-none`}
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
              aria-label="Close"
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
