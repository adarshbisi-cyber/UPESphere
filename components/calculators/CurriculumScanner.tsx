'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, X, Sparkles, AlertTriangle, RotateCcw, Check, Zap,
  ImagePlus, CheckCircle2, Loader2, Circle, ClipboardPaste,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateId } from '@/lib/utils'
import type { Subject } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type ScannerState = 'idle' | 'queued' | 'scanning' | 'preview' | 'error'
type FileStatus = 'pending' | 'scanning' | 'done' | 'error'

interface UploadedFile {
  id: string
  file: File
  preview: string
  status: FileStatus
}

interface ParsedSubject {
  id: string
  name: string
  credits: number
  selected: boolean
  confidence: 'high' | 'low'
}

// ─── OCR Text Parser ──────────────────────────────────────────────────────────

const CODE_RE = /[A-Z]{2,8}-?\d+[_-]?\d*/

const TRAILING_TYPE_RE = new RegExp(
  '\\s+(' +
  [
    'Non[\\s-]Time[\\s-]Table',
    'Open\\s+Elective',
    'Professional\\s+Elective',
    'Project\\s+Work',
    'Community\\s+Service',
    'Audit\\s+Course',
    'Value\\s+Added',
    'Dissertation',
    'Internship',
    'Elective',
    'Tutorial',
    'Seminar',
    'Core',
    'Lab',
  ].join('|') +
  ')\\s*$',
  'i'
)

function cleanCourseName(raw: string): string {
  const step1 = raw
    .replace(new RegExp(`^${CODE_RE.source}\\s+`), '')
    .replace(new RegExp(`\\s*\\(${CODE_RE.source}\\)\\s*`, 'g'), ' ')
    .replace(new RegExp(`\\s+${CODE_RE.source}$`), '')
    .replace(/^\d{1,3}[\s.)]+/, '')
    .replace(/\|/g, '')
    .replace(/_+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  const step2 = step1.replace(TRAILING_TYPE_RE, '').trim()
  return step2.length >= 3 ? step2 : step1
}

const SKIP_PATTERNS = [
  /^[-=|+#*]+$/,
  /^(sl\.?\s*no|s\.?\s*no|course\s*code|subject\s*name|credits?|l\s*t\s*p|hours?|subject\s*code|total|remarks|grade|semester|theory|practical)/i,
  /^\d{1,2}\.?\s*$/,
  /^(page\s*\d|www\.|http)/i,
]

function parseSubjectsFromOCR(rawText: string, seen: Set<string>): ParsedSubject[] {
  const lines = rawText
    .split('\n')
    .map(l => l.trim().replace(/\s+/g, ' '))
    .filter(l => l.length >= 4)

  const results: ParsedSubject[] = []

  const addResult = (name: string, credits: number, confidence: 'high' | 'low') => {
    const cleaned = cleanCourseName(name)
    const key = cleaned.toLowerCase().replace(/\s+/g, '')
    if (
      cleaned.length >= 3 &&
      /[a-zA-Z]{2,}/.test(cleaned) &&
      credits >= 1 && credits <= 9 &&
      !seen.has(key)
    ) {
      seen.add(key)
      results.push({ id: generateId(), name: cleaned, credits, selected: true, confidence })
    }
  }

  for (const line of lines) {
    if (SKIP_PATTERNS.some(p => p.test(line))) continue
    const m = line.match(/^(.+?)\s+(\d(?:\.0)?)\s*$/)
    if (m) addResult(m[1], Math.round(parseFloat(m[2])), 'high')
  }

  if (results.length < 2) {
    for (const line of lines) {
      if (SKIP_PATTERNS.some(p => p.test(line))) continue
      const m = line.match(/([A-Za-z][A-Za-z\s&,:()\-–]{3,60}?)\s+(\d)\b/)
      if (m) addResult(m[1], parseInt(m[2]), 'low')
    }
  }

  return results.slice(0, 20)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_FILES = 10

function readAsDataURL(file: File): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.readAsDataURL(file)
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface CurriculumScannerProps {
  onImport: (subjects: Subject[]) => void
  onClose: () => void
}

export function CurriculumScanner({ onImport, onClose }: CurriculumScannerProps) {
  const [state, setState] = useState<ScannerState>('idle')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [overallPct, setOverallPct] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [currentPreview, setCurrentPreview] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedSubject[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [pasteFlash, setPasteFlash] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const addMoreRef = useRef<HTMLInputElement>(null)
  // Ref mirrors state so the paste listener doesn't re-register on every state change
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  const selectedCount = parsed.filter(s => s.selected).length
  const totalCredits = parsed.filter(s => s.selected).reduce((a, s) => a + s.credits, 0)
  const hasLowConf = parsed.some(s => s.confidence === 'low')

  // ── File management ────────────────────────────────────────────────────────

  const addFiles = useCallback(async (incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter(f => f.type.startsWith('image/'))
    if (arr.length === 0) return

    const next: UploadedFile[] = await Promise.all(
      arr.slice(0, MAX_FILES).map(async f => ({
        id: generateId(),
        file: f,
        preview: await readAsDataURL(f),
        status: 'pending' as FileStatus,
      }))
    )

    setFiles(prev => {
      const combined = [...prev, ...next]
      return combined.slice(0, MAX_FILES)
    })
    setState('queued')
  }, [])

  const removeFile = (id: string) => {
    setFiles(prev => {
      const next = prev.filter(f => f.id !== id)
      if (next.length === 0) setState('idle')
      return next
    })
  }

  // ── Clipboard paste ────────────────────────────────────────────────────────

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Don't intercept while scanning or in preview/error — user may be editing text
      const s = stateRef.current
      if (s === 'scanning' || s === 'preview') return

      const items = Array.from(e.clipboardData?.items ?? [])
      const imageItems = items.filter(it => it.type.startsWith('image/'))
      if (imageItems.length === 0) return

      e.preventDefault()
      const imageFiles = imageItems.map(it => it.getAsFile()).filter(Boolean) as File[]

      // Flash feedback before async addFiles resolves
      setPasteFlash(true)
      setTimeout(() => setPasteFlash(false), 1800)

      await addFiles(imageFiles)
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [addFiles])

  // ── OCR processing ─────────────────────────────────────────────────────────

  const startScan = useCallback(async () => {
    setState('scanning')
    setOverallPct(0)
    setCurrentIdx(0)

    const snap = [...files]
    const seen = new Set<string>()
    const allParsed: ParsedSubject[] = []

    try {
      const { createWorker } = await import('tesseract.js')

      // Create one worker, reuse for all files (language data cached after first load)
      let workerReady = false

      const worker = await createWorker('eng', 1, {
        logger: (m: { status: string; progress: number }) => {
          const s = m.status
          if (!workerReady) {
            if (s === 'loading tesseract core')            setProgressMsg('Loading AI engine…')
            else if (s === 'loading language traineddata') setProgressMsg('Loading language model…')
            else if (s === 'initializing api')             setProgressMsg('Preparing scanner…')
          }
        },
      })
      workerReady = true

      for (let i = 0; i < snap.length; i++) {
        const uf = snap[i]
        setCurrentIdx(i)
        setCurrentPreview(uf.preview)
        setProgressMsg(`Scanning screenshot ${i + 1} of ${snap.length}…`)
        setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: 'scanning' } : f))

        const filePct = (i / snap.length) * 100
        const sliceSize = 100 / snap.length

        // Inline progress reporter for this file's recognition
        let lastPct = filePct
        const recognizeWithProgress = async () => {
          // Patch logger temporarily
          const origLogger = (m: { status: string; progress: number }) => {
            if (m.status === 'recognizing text') {
              const pct = Math.round(filePct + m.progress * sliceSize)
              lastPct = pct
              setOverallPct(pct)
            }
          }
          // Tesseract v7 doesn't support per-recognize logger easily,
          // so we animate the progress bar manually during recognition
          const progressInterval = setInterval(() => {
            lastPct = Math.min(lastPct + 1, filePct + sliceSize * 0.9)
            setOverallPct(Math.round(lastPct))
          }, 120)

          const result = await worker.recognize(uf.file)
          clearInterval(progressInterval)
          return result
        }

        try {
          const { data } = await recognizeWithProgress()
          const subjects = parseSubjectsFromOCR(data.text, seen)
          allParsed.push(...subjects)
          setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: 'done' } : f))
        } catch {
          setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: 'error' } : f))
        }

        setOverallPct(Math.round(((i + 1) / snap.length) * 100))
      }

      await worker.terminate()

    } catch {
      setErrorMsg('OCR engine failed to load. Please check your connection and try again.')
      setState('error')
      return
    }

    if (allParsed.length === 0) {
      setErrorMsg(
        snap.length > 1
          ? 'No subjects detected in any screenshot. Make sure your images show a clear curriculum table with a credit column.'
          : 'No subjects detected. Try a higher-resolution screenshot with a visible credit column.'
      )
      setState('error')
      return
    }

    setParsed(allParsed)
    setState('preview')
  }, [files])

  // ── Drag & drop ────────────────────────────────────────────────────────────

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  // ── Actions ────────────────────────────────────────────────────────────────

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
    setFiles([])
    setOverallPct(0)
    setCurrentPreview(null)
    setParsed([])
    setErrorMsg('')
  }

  // ── Status icon for file list ──────────────────────────────────────────────

  function FileStatusIcon({ status }: { status: FileStatus }) {
    if (status === 'done')    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
    if (status === 'error')   return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
    if (status === 'scanning')return (
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
        <Loader2 className="w-3.5 h-3.5 text-indigo-400" />
      </motion.div>
    )
    return <Circle className="w-3.5 h-3.5 text-muted-foreground/30" />
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
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
        className="relative w-full max-w-[480px]"
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
          {/* ── Paste flash notification ───────────────────────── */}
          <AnimatePresence>
            {pasteFlash && (
              <motion.div
                key="paste-flash"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-t-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.9), rgba(139,92,246,0.9))', color: '#fff' }}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                Screenshot detected — adding to queue…
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Header ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/25 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-display leading-tight">AI Curriculum Scanner</h3>
                <p className="text-[11px] text-muted-foreground">
                  {state === 'idle'    && 'Upload screenshots, fill automatically'}
                  {state === 'queued'  && `${files.length} screenshot${files.length !== 1 ? 's' : ''} ready to scan`}
                  {state === 'scanning'&& `Scanning ${currentIdx + 1} of ${files.length}…`}
                  {state === 'preview' && `${parsed.length} subjects extracted`}
                  {state === 'error'   && 'Scan failed'}
                </p>
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
                  <motion.div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileRef.current?.click()}
                    className="relative rounded-xl border-2 border-dashed p-9 text-center cursor-pointer select-none overflow-hidden"
                    animate={isDragging ? 'drag' : 'rest'}
                    whileHover={!isDragging ? 'hover' : undefined}
                    variants={{
                      rest: {
                        borderColor: 'rgba(99,102,241,0.25)',
                        boxShadow: '0 0 0px rgba(99,102,241,0)',
                        backgroundColor: 'transparent',
                        scale: 1,
                      },
                      hover: {
                        borderColor: 'rgba(99,102,241,0.52)',
                        boxShadow: '0 0 22px rgba(99,102,241,0.13), inset 0 0 28px rgba(99,102,241,0.04)',
                        backgroundColor: 'rgba(99,102,241,0.025)',
                        scale: 1.006,
                      },
                      drag: {
                        borderColor: 'rgba(99,102,241,0.88)',
                        boxShadow: '0 0 40px rgba(99,102,241,0.38), 0 0 80px rgba(139,92,246,0.16), inset 0 0 40px rgba(99,102,241,0.1)',
                        backgroundColor: 'rgba(99,102,241,0.07)',
                        scale: 1.018,
                      },
                    }}
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  >
                    {/* Drag radial fill */}
                    <AnimatePresence>
                      {isDragging && (
                        <motion.div
                          key="drag-fill"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 rounded-xl pointer-events-none"
                          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.18) 0%, transparent 70%)' }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Upload icon: ambient pulse ring + float */}
                    <div className="relative mx-auto w-14 h-14 mb-4">
                      <motion.div
                        className="absolute pointer-events-none"
                        style={{ inset: '-8px', background: 'rgba(99,102,241,0.2)', filter: 'blur(8px)', borderRadius: '1.25rem' }}
                        animate={{ scale: [1, 1.22, 1], opacity: [0.55, 0, 0.55] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <motion.div
                        animate={isDragging
                          ? { scale: 1.16, rotate: -6, y: 0 }
                          : { scale: 1, rotate: 0, y: [0, -5, 0] }
                        }
                        transition={isDragging
                          ? { type: 'spring', stiffness: 320, damping: 18 }
                          : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
                        }
                        className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.16))',
                          border: '1px solid rgba(99,102,241,0.3)',
                          boxShadow: isDragging ? '0 8px 24px rgba(99,102,241,0.38)' : '0 4px 12px rgba(99,102,241,0.14)',
                        }}
                      >
                        <Upload className="w-6 h-6 text-indigo-400" />
                      </motion.div>
                    </div>

                    <motion.p
                      animate={isDragging ? { scale: 1.04 } : { scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="text-sm font-semibold text-foreground mb-1"
                    >
                      {isDragging ? 'Drop them here!' : 'Drop your screenshots here'}
                    </motion.p>
                    <p className="text-xs text-muted-foreground mb-4">
                      or click to browse · or press{' '}
                      <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}>
                        Ctrl + V
                      </kbd>{' '}
                      to paste
                    </p>
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground"
                      style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}
                    >
                      <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                      ERP screenshots · curriculum tables · course lists
                    </div>
                    <p className="text-[10px] text-muted-foreground/50 mt-3">PNG · JPG · JPEG · up to {MAX_FILES} files</p>
                    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                      onChange={e => { if (e.target.files) addFiles(e.target.files) }} />
                  </motion.div>
                </motion.div>
              )}

              {/* ── QUEUED ───────────────────────────────────────── */}
              {state === 'queued' && (
                <motion.div key="queued" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* Thumbnail grid */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {files.map((f, i) => (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05, boxShadow: '0 4px 18px rgba(99,102,241,0.32)', borderColor: 'rgba(99,102,241,0.5)' }}
                        transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 28 }}
                        className="relative aspect-video rounded-lg overflow-hidden group"
                        style={{ border: '1px solid var(--divider)' }}
                      >
                        <img src={f.preview} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {/* Remove button */}
                        <button
                          onClick={() => removeFile(f.id)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                        >
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>
                        {/* Index badge */}
                        <div className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white/70 tabular-nums">
                          {i + 1}
                        </div>
                      </motion.div>
                    ))}

                    {/* Add more slot */}
                    {files.length < MAX_FILES && (
                      <button
                        onClick={() => addMoreRef.current?.click()}
                        className="aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/4"
                        style={{ borderColor: 'var(--divider)' }}
                      >
                        <ImagePlus className="w-4 h-4 text-muted-foreground/50" />
                        <span className="text-[9px] text-muted-foreground/50">Add more</span>
                        <input ref={addMoreRef} type="file" accept="image/*" multiple className="hidden"
                          onChange={e => { if (e.target.files) addFiles(e.target.files) }} />
                      </button>
                    )}
                  </div>

                  {/* Summary row */}
                  <div
                    className="flex items-center justify-between px-3 py-2 rounded-lg mb-3 text-xs"
                    style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}
                  >
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-foreground">{files.length}</span> screenshot{files.length !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={() => { setFiles([]); setState('idle') }}
                      className="text-[10px] text-muted-foreground/60 hover:text-red-400 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>

                  {/* Paste hint */}
                  {files.length < MAX_FILES && (
                    <p className="text-[11px] text-muted-foreground/60 text-center mb-3">
                      Press{' '}
                      <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: 'var(--inner-surface)', border: '1px solid var(--divider)' }}>
                        Ctrl + V
                      </kbd>{' '}
                      to paste more screenshots
                    </p>
                  )}

                  {/* CTA */}
                  <Button variant="gradient" className="w-full gap-2 relative overflow-hidden" onClick={startScan}>
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.16) 50%, transparent 70%)' }}
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.5, ease: 'linear' }}
                    />
                    <Sparkles className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Scan {files.length} Screenshot{files.length !== 1 ? 's' : ''}</span>
                  </Button>
                </motion.div>
              )}

              {/* ── SCANNING ─────────────────────────────────────── */}
              {state === 'scanning' && (
                <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  {/* Current image with scan animation */}
                  <div className="relative rounded-xl overflow-hidden h-32" style={{ border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 0 18px rgba(99,102,241,0.12)' }}>
                    <AnimatePresence mode="wait">
                      {currentPreview && (
                        <motion.img
                          key={currentPreview}
                          src={currentPreview} alt=""
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="w-full h-full object-cover opacity-50 dark:opacity-35 absolute inset-0"
                        />
                      )}
                    </AnimatePresence>

                    {/* Subtle grid overlay */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: 'linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                      }}
                    />

                    {/* Primary scan beam */}
                    <motion.div
                      className="absolute left-0 right-0 h-10 pointer-events-none"
                      style={{ background: 'linear-gradient(to bottom, transparent, rgba(99,102,241,0.22), transparent)' }}
                      initial={{ top: '-15%' }} animate={{ top: '110%' }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* Primary scan line */}
                    <motion.div
                      className="absolute left-0 right-0 h-px pointer-events-none"
                      style={{ background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.9), rgba(139,92,246,0.9), transparent)' }}
                      initial={{ top: '0%' }} animate={{ top: '100%' }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* Ghost scan line (offset, dimmer) */}
                    <motion.div
                      className="absolute left-0 right-0 h-px pointer-events-none"
                      style={{ background: 'linear-gradient(to right, transparent, rgba(139,92,246,0.42), rgba(99,102,241,0.42), transparent)' }}
                      initial={{ top: '0%' }} animate={{ top: '100%' }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'linear', delay: 0.28 }}
                    />

                    {/* Corner brackets — spring in on mount */}
                    {([
                      'top-2 left-2 border-t-2 border-l-2',
                      'top-2 right-2 border-t-2 border-r-2',
                      'bottom-2 left-2 border-b-2 border-l-2',
                      'bottom-2 right-2 border-b-2 border-r-2',
                    ] as const).map((cls, idx) => (
                      <motion.div
                        key={cls}
                        className={`absolute w-4 h-4 ${cls} border-indigo-400/80 rounded-sm`}
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 18, delay: idx * 0.07 }}
                      />
                    ))}

                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/10 dark:from-black/40 dark:to-black/20 pointer-events-none" />
                  </div>

                  {/* Overall progress */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-foreground">{progressMsg}</span>
                      <span className="text-xs font-mono tabular-nums" style={{ color: 'rgba(99,102,241,0.9)' }}>{overallPct}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                      <motion.div
                        className="h-full rounded-full relative overflow-hidden"
                        style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)', boxShadow: '0 0 8px rgba(99,102,241,0.5)' }}
                        animate={{ width: `${overallPct}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      >
                        <motion.span
                          aria-hidden="true"
                          className="absolute inset-0 pointer-events-none"
                          style={{ background: 'linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.28) 50%, transparent 80%)' }}
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: 'linear', repeatDelay: 0.3 }}
                        />
                      </motion.div>
                    </div>
                  </div>

                  {/* Per-file status list */}
                  <div className="space-y-1.5">
                    {files.map((f, i) => (
                      <div key={f.id} className="flex items-center gap-2.5">
                        {/* Thumbnail */}
                        <div className="w-8 h-6 rounded overflow-hidden shrink-0" style={{ border: '1px solid var(--divider)' }}>
                          <img src={f.preview} alt="" className="w-full h-full object-cover opacity-70" />
                        </div>
                        <span className="text-[11px] text-muted-foreground flex-1 truncate">
                          {f.file.name.length > 24 ? f.file.name.slice(0, 22) + '…' : f.file.name}
                        </span>
                        <FileStatusIcon status={f.status} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── PREVIEW ──────────────────────────────────────── */}
              {state === 'preview' && (
                <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* Summary bar */}
                  <div
                    className="flex items-center justify-between mb-3 px-3 py-2.5 rounded-xl"
                    style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-xs font-semibold">{parsed.length} subjects found</span>
                      {files.length > 1 && (
                        <span className="text-[10px] text-muted-foreground">across {files.length} screenshots</span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{totalCredits} cr selected</span>
                  </div>

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
                        transition={{ delay: i * 0.02 }}
                        onClick={() => toggle(s.id)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150"
                        style={{
                          background: s.selected ? 'rgba(99,102,241,0.08)' : 'transparent',
                          border: `1px solid ${s.selected ? 'rgba(99,102,241,0.22)' : 'transparent'}`,
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded shrink-0 flex items-center justify-center transition-colors"
                          style={{
                            background: s.selected ? '#6366f1' : 'transparent',
                            border: `1.5px solid ${s.selected ? '#6366f1' : 'var(--divider)'}`,
                          }}
                        >
                          {s.selected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className={`flex-1 text-xs leading-snug ${s.selected ? 'text-foreground' : 'text-muted-foreground'} ${s.confidence === 'low' ? 'italic opacity-75' : ''}`}>
                          {s.name}
                        </span>
                        <span
                          className="text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded-md shrink-0"
                          style={{ background: 'var(--muted-surface)', color: s.selected ? 'rgba(99,102,241,0.9)' : undefined }}
                        >
                          {s.credits}cr
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  <button
                    onClick={toggleAll}
                    className="text-[11px] font-medium mb-4 transition-colors"
                    style={{ color: 'rgba(99,102,241,0.85)' }}
                  >
                    {parsed.every(s => s.selected) ? 'Deselect all' : 'Select all'}
                  </button>

                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 shrink-0">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Re-scan
                    </Button>
                    <Button
                      variant="gradient" size="sm"
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
