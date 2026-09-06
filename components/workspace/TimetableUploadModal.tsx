'use client'

import { useRef, useState } from 'react'
import { CalendarClock, ArrowRight, Loader2, Check, AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/onboarding/FileDropzone'
import { UploadModalShell } from '@/components/workspace/UploadModalShell'
import { createTimetableRenderSampler, extractPdfTextItems, hasExtractableText } from '@/lib/parsers/pdfText'
import { looksLikeTimetableMissingClassNames, parseTimetableItems, type TimetableSlot } from '@/lib/parsers/timetableParser'
import { saveTimetableVersion } from '@/lib/onboarding/api'
import { describeSaveError } from '@/lib/onboarding/errors'
import { generateId } from '@/lib/utils'

type Status = 'idle' | 'parsing' | 'reviewing' | 'error'
type EffectiveChoice = 'immediate' | 'nextWeek' | 'custom'

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// The upcoming Monday, strictly after today — "start next week" always means
// at least 7 days out even if today happens to be a Monday.
function nextMonday(from: Date): Date {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  const diff = ((8 - d.getDay()) % 7) || 7
  d.setDate(d.getDate() + diff)
  return d
}

export function TimetableUploadModal({
  userId,
  hasExisting,
  onClose,
  onSaved,
}: {
  userId: string
  hasExisting: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [slots, setSlots] = useState<(TimetableSlot & { id: string })[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [effectiveChoice, setEffectiveChoice] = useState<EffectiveChoice>('immediate')
  const [customDate, setCustomDate] = useState(toDateInputValue(nextMonday(new Date())))

  const handleFile = async (f: File) => {
    setFile(f)
    setStatus('parsing')
    try {
      if (f.type !== 'application/pdf') {
        setErrorMsg('For now, timetable auto-fill works best with a PDF export of your weekly schedule.')
        setStatus('error')
        return
      }
      const pages = await extractPdfTextItems(f)
      if (!hasExtractableText(pages)) {
        setErrorMsg("This PDF doesn't have selectable text (it may be a scanned image). Try exporting your timetable as a PDF.")
        setStatus('error')
        return
      }
      const parsed = await parseTimetableItems(pages, { sampler: createTimetableRenderSampler(f) })
      if (parsed.length === 0) {
        setErrorMsg(
          looksLikeTimetableMissingClassNames(pages)
            ? "This export has your days and times, but no class names or rooms anywhere in the file — there's nothing to import. Try a different export from your timetable portal."
            : 'No class slots detected. Try a different export.'
        )
        setStatus('error')
        return
      }
      setSlots(parsed.map(s => ({ ...s, id: generateId() })))
      setStatus('reviewing')
    } catch {
      setErrorMsg('Something went wrong reading that file. Try again.')
      setStatus('error')
    }
  }

  const removeSlot = (id: string) => setSlots(s => s.filter(x => x.id !== id))

  // A ref-based lock, not just the `saving` state: two rapid clicks can both
  // read `saving === false` before React re-renders with the button disabled,
  // which would otherwise fire saveTimetableVersion twice and duplicate every
  // slot. A ref updates synchronously within the same tick, so the second
  // click is blocked immediately regardless of render timing.
  const savingRef = useRef(false)

  const handleSave = async () => {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setSaveError('')
    try {
      const effectiveFrom =
        effectiveChoice === 'immediate' ? new Date()
        : effectiveChoice === 'nextWeek' ? nextMonday(new Date())
        : new Date(customDate)
      await saveTimetableVersion(userId, slots, effectiveFrom)
      onSaved()
    } catch (err) {
      setSaveError(describeSaveError(err))
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <UploadModalShell onClose={onClose}>
      <h2 className="text-xl font-bold font-display tracking-tight mb-1.5 text-center pr-6">
        {hasExisting ? 'Update your Timetable' : 'Add your Timetable'}
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        {hasExisting ? 'Your current schedule stays in history — choose when the new one starts.' : 'Upload your weekly schedule as a PDF.'}
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
          <span className="text-xs font-semibold text-emerald-400 block mb-2 px-1">
            {slots.length} class{slots.length !== 1 ? 'es' : ''} found
          </span>
          <div className="space-y-1.5 max-h-56 overflow-y-auto mb-4">
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

          {hasExisting && (
            <div className="rounded-xl p-3 mb-2" style={{ background: 'var(--muted-surface)' }}>
              <p className="text-xs font-semibold text-muted-foreground mb-2 px-0.5">Replace current timetable</p>
              <div className="space-y-1.5">
                {([
                  ['immediate', 'Effective immediately'],
                  ['nextWeek', 'Start next week'],
                  ['custom', 'Custom date'],
                ] as [EffectiveChoice, string][]).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-xs text-foreground/90 cursor-pointer">
                    <input
                      type="radio"
                      name="effective"
                      checked={effectiveChoice === value}
                      onChange={() => setEffectiveChoice(value)}
                      className="accent-indigo-500"
                    />
                    {label}
                  </label>
                ))}
                {effectiveChoice === 'custom' && (
                  <input
                    type="date"
                    value={customDate}
                    onChange={e => setCustomDate(e.target.value)}
                    className="mt-1 h-8 rounded-lg border px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                    style={{ borderColor: 'var(--divider)', background: 'var(--background)' }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {saveError && (
        <div className="flex items-start gap-2 mt-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300">{saveError}</p>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          variant="gradient"
          className="flex-1 gap-2"
          disabled={status !== 'reviewing' || slots.length === 0 || saving}
          onClick={handleSave}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save <ArrowRight className="w-4 h-4" /></>}
        </Button>
      </div>
    </UploadModalShell>
  )
}
