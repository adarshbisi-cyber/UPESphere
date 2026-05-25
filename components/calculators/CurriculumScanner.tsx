'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, X, Sparkles, AlertTriangle, RotateCcw, Check, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateId } from '@/lib/utils'
import type { Subject } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type ScannerState = 'idle' | 'scanning' | 'preview' | 'error'

interface ParsedSubject {
  id: string
  name: string
  credits: number
  selected: boolean
  confidence: 'high' | 'low'
}

// ─── OCR Text Parser ──────────────────────────────────────────────────────────

// Matches ERP-style course codes: DIGM7004_3, HRES7029_2, CS301, BCA-101
// Deliberately no `i` flag — codes are ALL-CAPS; avoids eating "IoT" or "AI" in real names
const CODE_RE = /[A-Z]{2,8}-?\d+[_-]?\d*/

function cleanCourseName(raw: string): string {
  return raw
    .replace(new RegExp(`^${CODE_RE.source}\\s+`), '')          // leading code
    .replace(new RegExp(`\\s*\\(${CODE_RE.source}\\)\\s*`, 'g'), ' ') // (bracketed) codes
    .replace(new RegExp(`\\s+${CODE_RE.source}$`), '')           // trailing code
    .replace(/^\d{1,3}[\s.)]+/, '')                              // leading row numbers
    .replace(/\|/g, '')                                          // pipe artifacts
    .replace(/_+/g, ' ')                                         // leftover underscores
    .replace(/\s{2,}/g, ' ')                                     // collapse spaces
    .trim()
}

const SKIP_PATTERNS = [
  /^[-=|+#*]+$/,
  /^(sl\.?\s*no|s\.?\s*no|course\s*code|subject\s*name|credits?|l\s*t\s*p|hours?|subject\s*code|total|remarks|grade|semester|theory|practical)/i,
  /^\d{1,2}\.?\s*$/,
  /^(page\s*\d|www\.|http)/i,
]

function parseSubjectsFromOCR(rawText: string): ParsedSubject[] {
  const lines = rawText
    .split('\n')
    .map(l => l.trim().replace(/\s+/g, ' '))
    .filter(l => l.length >= 4)

  const seen = new Set<string>()
  const results: ParsedSubject[] = []

  const addResult = (name: string, credits: number, confidence: 'high' | 'low') => {
    const cleaned = cleanCourseName(name)

    const key = cleaned.toLowerCase().replace(/\s+/g, '')
    if (
      cleaned.length >= 3 &&
      /[a-zA-Z]{2,}/.test(cleaned) &&
      credits >= 1 &&
      credits <= 9 &&
      !seen.has(key)
    ) {
      seen.add(key)
      results.push({ id: generateId(), name: cleaned, credits, selected: true, confidence })
    }
  }

  // Pass 1 — credit at end of line (most common in Indian ERP/curriculum tables)
  for (const line of lines) {
    if (SKIP_PATTERNS.some(p => p.test(line))) continue

    // "Machine Learning   4" or "Machine Learning 3.0"
    const m = line.match(/^(.+?)\s+(\d(?:\.0)?)\s*$/)
    if (m) {
      const credit = parseFloat(m[2])
      addResult(m[1], Math.round(credit), 'high')
    }
  }

  // Pass 2 — looser match if pass 1 yielded < 2 subjects
  if (results.length < 2) {
    for (const line of lines) {
      if (SKIP_PATTERNS.some(p => p.test(line))) continue
      // find first standalone digit 1-9 anywhere in the line
      const m = line.match(/([A-Za-z][A-Za-z\s&,:()\-–]{3,60}?)\s+(\d)\b/)
      if (m) {
        addResult(m[1], parseInt(m[2]), 'low')
      }
    }
  }

  return results.slice(0, 20)
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface CurriculumScannerProps {
  onImport: (subjects: Subject[]) => void
  onClose: () => void
}

export function CurriculumScanner({ onImport, onClose }: CurriculumScannerProps) {
  const [state, setState] = useState<ScannerState>('idle')
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('Initializing…')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedSubject[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const selectedCount = parsed.filter(s => s.selected).length
  const hasLowConf = parsed.some(s => s.confidence === 'low')
  const totalCredits = parsed.filter(s => s.selected).reduce((a, s) => a + s.credits, 0)

  const toggle = (id: string) =>
    setParsed(p => p.map(s => s.id === id ? { ...s, selected: !s.selected } : s))

  const toggleAll = () => {
    const all = parsed.every(s => s.selected)
    setParsed(p => p.map(s => ({ ...s, selected: !all })))
  }

  const handleImport = () => {
    const subjects: Subject[] = parsed
      .filter(s => s.selected)
      .map(s => ({ id: generateId(), name: s.name, credits: s.credits, grade: 'A' }))
    onImport(subjects)
  }

  const reset = () => {
    setState('idle')
    setProgress(0)
    setImagePreview(null)
    setParsed([])
    setErrorMsg('')
  }

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      if (file.type === 'application/pdf') {
        setErrorMsg('PDF upload is coming soon. Please upload a screenshot of your curriculum instead.')
      } else {
        setErrorMsg('Please upload a PNG, JPG, or JPEG image.')
      }
      setState('error')
      return
    }

    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setState('scanning')
    setProgress(5)

    try {
      const { createWorker } = await import('tesseract.js')

      const worker = await createWorker('eng', 1, {
        logger: (m: { status: string; progress: number }) => {
          const s = m.status
          if (s === 'loading tesseract core')         { setProgressMsg('Loading AI engine…');       setProgress(10) }
          else if (s === 'initializing tesseract')    { setProgressMsg('Initializing OCR…');        setProgress(22) }
          else if (s === 'loading language traineddata') { setProgressMsg('Loading language model…'); setProgress(38) }
          else if (s === 'loaded language traineddata')  { setProgress(50) }
          else if (s === 'initializing api')          { setProgressMsg('Preparing scanner…');       setProgress(55) }
          else if (s === 'recognizing text')          {
            setProgressMsg('Scanning curriculum…')
            setProgress(55 + Math.round(m.progress * 40))
          }
        },
      })

      const { data } = await worker.recognize(file)
      await worker.terminate()

      setProgress(100)
      setProgressMsg('Parsing subjects…')

      const subjects = parseSubjectsFromOCR(data.text)

      if (subjects.length === 0) {
        setErrorMsg(
          "No subjects detected. Make sure your image has a clear table with a credit column, or try a higher-resolution screenshot."
        )
        setState('error')
        return
      }

      setParsed(subjects)
      setState('preview')
    } catch {
      setErrorMsg('OCR failed. Please try again with a clearer, higher-contrast image.')
      setState('error')
    }
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 18 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[440px]"
        onClick={e => e.stopPropagation()}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, var(--glass-from), var(--glass-to))`,
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* ── Header ───────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/25 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-display leading-tight">AI Curriculum Scanner</h3>
                <p className="text-[11px] text-muted-foreground">Upload once, fill automatically</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              style={{ background: 'var(--muted-surface)' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-6 pb-6">
            <AnimatePresence mode="wait">

              {/* ── IDLE ─────────────────────────────────────────── */}
              {state === 'idle' && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileRef.current?.click()}
                    className="relative rounded-xl border-2 border-dashed p-9 text-center cursor-pointer transition-all duration-200 select-none"
                    style={{
                      borderColor: isDragging ? 'rgba(99,102,241,0.6)' : 'var(--divider)',
                      background: isDragging ? 'rgba(99,102,241,0.06)' : 'transparent',
                      transform: isDragging ? 'scale(1.01)' : 'scale(1)',
                    }}
                  >
                    <motion.div
                      animate={isDragging ? { scale: 1.12, rotate: -4 } : { scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.25)' }}
                    >
                      <Upload className="w-6 h-6 text-indigo-400" />
                    </motion.div>

                    <p className="text-sm font-semibold text-foreground mb-1">
                      {isDragging ? 'Drop it here!' : 'Drop your curriculum'}
                    </p>
                    <p className="text-xs text-muted-foreground mb-5">or click to browse</p>

                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground"
                      style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}
                    >
                      <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                      ERP screenshots · curriculum tables · course lists
                    </div>

                    <p className="text-[10px] text-muted-foreground/50 mt-3">PNG · JPG · JPEG</p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpg,image/jpeg,image/webp,.pdf"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }}
                    />
                  </div>
                </motion.div>
              )}

              {/* ── SCANNING ─────────────────────────────────────── */}
              {state === 'scanning' && (
                <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  {/* Image with moving scan line */}
                  <div className="relative rounded-xl overflow-hidden h-36" style={{ border: '1px solid var(--divider)' }}>
                    {imagePreview && (
                      <img src={imagePreview} alt="" className="w-full h-full object-cover opacity-50 dark:opacity-35" />
                    )}
                    {/* Ambient glow sweep */}
                    <motion.div
                      className="absolute left-0 right-0 h-12 pointer-events-none"
                      style={{ background: 'linear-gradient(to bottom, transparent, rgba(99,102,241,0.18), transparent)' }}
                      initial={{ top: '-15%' }}
                      animate={{ top: '110%' }}
                      transition={{ duration: 1.7, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* Sharp scan line */}
                    <motion.div
                      className="absolute left-0 right-0 h-px pointer-events-none"
                      style={{ background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.8), rgba(139,92,246,0.8), transparent)' }}
                      initial={{ top: '0%' }}
                      animate={{ top: '100%' }}
                      transition={{ duration: 1.7, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* Corner brackets */}
                    {(['top-2 left-2 border-t-2 border-l-2', 'top-2 right-2 border-t-2 border-r-2', 'bottom-2 left-2 border-b-2 border-l-2', 'bottom-2 right-2 border-b-2 border-r-2'] as const).map(cls => (
                      <div key={cls} className={`absolute w-3.5 h-3.5 ${cls} border-indigo-400/70 rounded-sm`} />
                    ))}
                    {/* Dark overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/10 dark:from-black/40 dark:to-black/20 pointer-events-none" />
                  </div>

                  {/* Progress bar + status */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-foreground">{progressMsg}</span>
                      <span className="text-xs font-mono tabular-nums" style={{ color: 'rgba(99,102,241,0.9)' }}>{progress}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 mt-3">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                          animate={{ opacity: [0.25, 1, 0.25] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.22 }}
                        />
                      ))}
                      <span className="text-[11px] text-muted-foreground ml-1">AI is reading your curriculum…</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── PREVIEW ──────────────────────────────────────── */}
              {state === 'preview' && (
                <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* Summary */}
                  <div
                    className="flex items-center justify-between mb-3 px-3 py-2.5 rounded-xl"
                    style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-xs font-semibold">{parsed.length} subjects detected</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{totalCredits} credits selected</span>
                  </div>

                  {/* Low confidence warning */}
                  {hasLowConf && (
                    <div
                      className="flex items-start gap-2 mb-3 p-3 rounded-xl"
                      style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
                        Some subjects may have low accuracy. Review before importing.
                      </p>
                    </div>
                  )}

                  {/* Subject checklist */}
                  <div className="space-y-1 max-h-52 overflow-y-auto mb-3" style={{ scrollbarWidth: 'thin' }}>
                    {parsed.map((s, i) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.025 }}
                        onClick={() => toggle(s.id)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group"
                        style={{
                          background: s.selected ? 'rgba(99,102,241,0.08)' : 'transparent',
                          border: `1px solid ${s.selected ? 'rgba(99,102,241,0.22)' : 'transparent'}`,
                        }}
                      >
                        {/* Checkbox */}
                        <div
                          className="w-4 h-4 rounded shrink-0 flex items-center justify-center transition-colors"
                          style={{
                            background: s.selected ? '#6366f1' : 'transparent',
                            border: `1.5px solid ${s.selected ? '#6366f1' : 'var(--divider)'}`,
                          }}
                        >
                          {s.selected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>

                        {/* Name */}
                        <span
                          className={`flex-1 text-xs leading-snug ${s.selected ? 'text-foreground' : 'text-muted-foreground'} ${s.confidence === 'low' ? 'italic opacity-80' : ''}`}
                        >
                          {s.name}
                        </span>

                        {/* Credits badge */}
                        <span
                          className="text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded-md shrink-0"
                          style={{ background: 'var(--muted-surface)', color: s.selected ? 'rgba(99,102,241,0.9)' : undefined }}
                        >
                          {s.credits}cr
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Select all */}
                  <button
                    onClick={toggleAll}
                    className="text-[11px] font-medium mb-4 transition-colors"
                    style={{ color: 'rgba(99,102,241,0.85)' }}
                  >
                    {parsed.every(s => s.selected) ? 'Deselect all' : 'Select all'}
                  </button>

                  {/* Action row */}
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 shrink-0">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Re-scan
                    </Button>
                    <Button
                      variant="gradient"
                      size="sm"
                      className="flex-1 gap-1.5"
                      disabled={selectedCount === 0}
                      onClick={handleImport}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Import {selectedCount} Subject{selectedCount !== 1 ? 's' : ''}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── ERROR ────────────────────────────────────────── */}
              {state === 'error' && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-2">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
                  >
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <p className="text-sm font-semibold mb-2">Scan Failed</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-6 max-w-xs mx-auto">{errorMsg}</p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
                    <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Try Again
                    </Button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
