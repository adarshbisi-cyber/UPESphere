'use client'

import { motion } from 'framer-motion'
import { EASE_OUT } from '@/lib/utils'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="text-center max-w-lg mx-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
        className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 12px 32px rgba(99,102,241,0.35)' }}
      >
        <Sparkles className="w-9 h-9 text-white" />
      </motion.div>

      <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-3">
        Welcome to UPESphere 👋
      </h1>
      <p className="text-lg text-muted-foreground leading-relaxed mb-1">
        Let&rsquo;s set up your Academic Workspace.
      </p>
      <p className="text-sm text-muted-foreground/70 mb-8">This takes about 2 minutes.</p>

      <Button variant="gradient" size="lg" onClick={onStart} className="gap-2">
        Get Started <ArrowRight className="w-4 h-4" />
      </Button>
    </motion.div>
  )
}
