'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, ScanLine, Sparkles, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CurriculumScanner } from '@/components/calculators/CurriculumScanner'
import type { Subject } from '@/types'

const BENEFITS = ['Detect subjects', 'Detect credits', 'Prepare your GPA Calculator']

export function CurriculumStep({
  onContinue,
  onSkip,
}: {
  onContinue: (subjects: { name: string; credits: number }[]) => void
  onSkip: () => void
}) {
  const [scannerOpen, setScannerOpen] = useState(false)
  const [imported, setImported] = useState<Subject[] | null>(null)

  const handleImport = (subjects: Subject[]) => {
    setImported(subjects)
    setScannerOpen(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-md mx-auto w-full"
    >
      <h2 className="text-2xl font-bold font-display tracking-tight mb-1.5 text-center">Set up your Subjects</h2>
      <p className="text-sm text-muted-foreground text-center mb-2">Upload your curriculum PDF or screenshot.</p>
      <p className="text-xs text-muted-foreground/70 text-center mb-6">Our AI will automatically:</p>

      <div className="flex flex-wrap gap-1.5 justify-center mb-6">
        {BENEFITS.map(b => (
          <span key={b} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-foreground/80 border border-white/10 bg-white/[0.03]">
            <Sparkles className="w-3 h-3 text-indigo-400" /> {b}
          </span>
        ))}
      </div>

      {!imported ? (
        <button
          onClick={() => setScannerOpen(true)}
          className="w-full rounded-xl border-2 border-dashed border-indigo-500/25 hover:border-indigo-500/45 hover:bg-indigo-500/[0.03] p-8 text-center cursor-pointer transition-colors"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.16))', border: '1px solid rgba(99,102,241,0.3)' }}>
            <ScanLine className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">Open the AI Curriculum Scanner</p>
          <p className="text-xs text-muted-foreground">Upload one or more screenshots, or paste with Ctrl+V</p>
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold text-emerald-400">{imported.length} subject{imported.length !== 1 ? 's' : ''} imported</span>
            <button
              onClick={() => setScannerOpen(true)}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Re-scan
            </button>
          </div>
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {imported.map(s => (
              <div key={s.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg" style={{ background: 'var(--muted-surface)' }}>
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="flex-1 text-sm truncate">{s.name}</span>
                <span className="text-xs font-mono text-muted-foreground">{s.credits}cr</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <Button variant="ghost" onClick={onSkip}>Skip for now</Button>
        <Button
          variant="gradient"
          className="flex-1 gap-2"
          disabled={!imported || imported.length === 0}
          onClick={() => imported && onContinue(imported.map(s => ({ name: s.name, credits: s.credits })))}
        >
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {scannerOpen && (
        <CurriculumScanner onImport={handleImport} onClose={() => setScannerOpen(false)} />
      )}
    </motion.div>
  )
}
