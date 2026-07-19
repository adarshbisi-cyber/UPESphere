'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, ArrowRight, Loader2, Check, AlertTriangle, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/onboarding/FileDropzone'
import { extractPdfTextItems, hasExtractableText } from '@/lib/parsers/pdfText'
import { parseTimetableItems, type TimetableSlot } from '@/lib/parsers/timetableParser'
import { generateId, EASE_OUT } from '@/lib/utils'

type Status = 'idle' | 'parsing' | 'reviewing' | 'error'

export function TimetableStep({
  onContinue,
  onSkip,
}: {
  onContinue: (slots: TimetableSlot[]) => void
  onSkip: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [slots, setSlots] = useState<(TimetableSlot & { id: string })[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  const handleFile = async (f: File) => {
    setFile(f)
    setStatus('parsing')
    try {
      if (f.type !== 'application/pdf') {
        setErrorMsg('For now, timetable auto-fill works best with a PDF export of your weekly schedule. You can skip and add it later.')
        setStatus('error')
        return
      }
      const pages = await extractPdfTextItems(f)
      if (!hasExtractableText(pages)) {
        setErrorMsg("This PDF doesn't have selectable text (it may be a scanned image). Try exporting your timetable as a PDF, or skip for now.")
        setStatus('error')
        return
      }
      const parsed = parseTimetableItems(pages)
      if (parsed.length === 0) {
        setErrorMsg('No class slots detected. Try a different export, or skip and add it later.')
        setStatus('error')
        return
      }
      setSlots(parsed.map(s => ({ ...s, id: generateId() })))
      setStatus('reviewing')
    } catch {
      setErrorMsg('Something went wrong reading that file. Try again, or skip for now.')
      setStatus('error')
    }
  }

  const removeSlot = (id: string) => setSlots(s => s.filter(x => x.id !== id))
  const changeFile = () => { setFile(null); setSlots([]); setStatus('idle') }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className="max-w-md mx-auto w-full"
    >
      <h2 className="text-2xl font-bold font-display tracking-tight mb-1.5 text-center">Build your Weekly Schedule</h2>
      <p className="text-sm text-muted-foreground text-center mb-2">Upload your timetable.</p>
      <p className="text-xs text-muted-foreground/70 text-center mb-6">
        AI will automatically create your weekly calendar, today&rsquo;s classes, and classroom details.
      </p>

      {status !== 'reviewing' && (
        <>
          <FileDropzone
            accept="application/pdf"
            icon={CalendarClock}
            label="Drop your timetable PDF here"
            sublabel="PDF export works best"
            file={file}
            onClear={() => { setFile(null); setStatus('idle') }}
            onFile={handleFile}
          />

          {status === 'parsing' && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Reading your schedule…
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-2 mt-4 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">{errorMsg}</p>
            </div>
          )}
        </>
      )}

      {status === 'reviewing' && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold text-emerald-400">{slots.length} class{slots.length !== 1 ? 'es' : ''} found</span>
            <button
              onClick={changeFile}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Change file
            </button>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {slots.map(s => (
              <div key={s.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg" style={{ background: 'var(--muted-surface)' }}>
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{s.subject}</div>
                  <div className="text-[11px] text-muted-foreground">{s.day} · {s.startTime}–{s.endTime}{s.room ? ` · ${s.room}` : ''}</div>
                </div>
                <button onClick={() => removeSlot(s.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
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
          disabled={status === 'reviewing' ? slots.length === 0 : true}
          onClick={() => onContinue(slots)}
        >
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}
