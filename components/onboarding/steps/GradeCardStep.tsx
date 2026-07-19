'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, ArrowRight, Loader2, AlertTriangle, RotateCcw, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileDropzone } from '@/components/onboarding/FileDropzone'
import { extractPdfTextItems, hasExtractableText } from '@/lib/parsers/pdfText'
import { parseGradeCardItems, type ParsedSemesterBlock } from '@/lib/parsers/gradeCardParser'
import { generateId, EASE_OUT } from '@/lib/utils'

type Status = 'idle' | 'parsing' | 'reviewing' | 'error'

const MAX_SEMESTERS = 8
const SEMESTER_OPTIONS = Array.from({ length: MAX_SEMESTERS }, (_, i) => i + 1)

interface EditableSubject {
  id: string
  code: string
  name: string
  credits: number
  grade: string
}

interface EditableSemester {
  id: string
  semesterNumber: number
  subjects: EditableSubject[]
  sgpa: number
}

// Semester labels in real grade cards are usually reliable ("Semester 3"),
// but we still let the user confirm/override rather than trust the guess
// blindly — OCR/label mismatches happen, and two blocks can't share a number.
function guessSemesterNumbers(blocks: ParsedSemesterBlock[]): number[] {
  const used = new Set<number>()
  return blocks.map((b, i) => {
    const match = b.semesterLabel?.match(/(\d+)/)
    let n = match ? parseInt(match[1], 10) : i + 1
    n = Math.min(Math.max(n, 1), MAX_SEMESTERS)
    while (used.has(n) && n < MAX_SEMESTERS) n++
    used.add(n)
    return n
  })
}

function toEditable(blocks: ParsedSemesterBlock[]): EditableSemester[] {
  const numbers = guessSemesterNumbers(blocks)
  return blocks.slice(0, MAX_SEMESTERS).map((b, i) => ({
    id: generateId(),
    semesterNumber: numbers[i],
    sgpa: b.sgpa ?? 0,
    subjects: b.subjects.map(s => ({ id: generateId(), code: s.code, name: s.name, credits: s.credits, grade: s.grade })),
  }))
}

function toParsedSemesterBlocks(editable: EditableSemester[]): ParsedSemesterBlock[] {
  return editable.map(e => ({
    semesterLabel: `Semester ${e.semesterNumber}`,
    subjects: e.subjects.map(s => ({ code: s.code, name: s.name, credits: s.credits, grade: s.grade })),
    totalCredits: e.subjects.reduce((sum, s) => sum + (s.credits || 0), 0),
    sgpa: e.sgpa,
  }))
}

export function GradeCardStep({
  onContinue,
  onSkip,
}: {
  onContinue: (semesters: ParsedSemesterBlock[]) => void
  onSkip: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [semesters, setSemesters] = useState<EditableSemester[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [truncated, setTruncated] = useState(false)

  const handleFile = async (f: File) => {
    setFile(f)
    setStatus('parsing')
    try {
      if (f.type !== 'application/pdf') {
        setErrorMsg('For now, grade card auto-fill works best with a PDF export. You can skip and add your GPA manually later.')
        setStatus('error')
        return
      }
      const pages = await extractPdfTextItems(f)
      if (!hasExtractableText(pages)) {
        setErrorMsg("This PDF doesn't have selectable text (it may be a scanned image). Try the official PDF export, or skip for now.")
        setStatus('error')
        return
      }
      const result = parseGradeCardItems(pages)
      if (result.semesters.length === 0) {
        setErrorMsg('No semester results detected. Try a different export, or skip and add it later.')
        setStatus('error')
        return
      }
      setTruncated(result.semesters.length > MAX_SEMESTERS)
      setSemesters(toEditable(result.semesters))
      setStatus('reviewing')
    } catch {
      setErrorMsg('Something went wrong reading that file. Try again, or skip for now.')
      setStatus('error')
    }
  }

  const changeFile = () => { setFile(null); setSemesters([]); setStatus('idle') }

  const updateSemester = (id: string, patch: Partial<EditableSemester>) =>
    setSemesters(list => list.map(s => (s.id === id ? { ...s, ...patch } : s)))

  const removeSemester = (id: string) => setSemesters(list => list.filter(s => s.id !== id))

  const updateSubject = (semId: string, subId: string, patch: Partial<EditableSubject>) =>
    setSemesters(list => list.map(s => (
      s.id === semId
        ? { ...s, subjects: s.subjects.map(sub => (sub.id === subId ? { ...sub, ...patch } : sub)) }
        : s
    )))

  const removeSubject = (semId: string, subId: string) =>
    setSemesters(list => list.map(s => (
      s.id === semId ? { ...s, subjects: s.subjects.filter(sub => sub.id !== subId) } : s
    )))

  const addSubject = (semId: string) =>
    setSemesters(list => list.map(s => (
      s.id === semId
        ? { ...s, subjects: [...s.subjects, { id: generateId(), code: '', name: '', credits: 0, grade: '' }] }
        : s
    )))

  const semesterNumbers = semesters.map(s => s.semesterNumber)
  const hasDuplicateSemesters = new Set(semesterNumbers).size !== semesterNumbers.length
  const hasEmptySemester = semesters.some(s => s.subjects.length === 0)
  const hasIncompleteSubject = semesters.some(s => s.subjects.some(sub => !sub.name.trim() || !sub.grade.trim()))
  const canContinue = semesters.length > 0 && !hasDuplicateSemesters && !hasEmptySemester && !hasIncompleteSubject

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className="max-w-md mx-auto w-full"
    >
      <h2 className="text-2xl font-bold font-display tracking-tight mb-1.5 text-center">Import Academic Results</h2>
      <p className="text-sm text-muted-foreground text-center mb-2">Upload your latest grade card.</p>
      <p className="text-xs text-muted-foreground/70 text-center mb-6">
        AI will automatically extract your SGPA, calculate CGPA, and import subject grades.
      </p>

      {status !== 'reviewing' && (
        <>
          <FileDropzone
            accept="application/pdf"
            icon={GraduationCap}
            label="Drop your grade card PDF here"
            sublabel="PDF export works best"
            file={file}
            onClear={() => { setFile(null); setStatus('idle') }}
            onFile={handleFile}
          />

          {status === 'parsing' && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Reading your grade card…
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
            <span className="text-xs font-semibold text-emerald-400">
              {semesters.length} semester{semesters.length !== 1 ? 's' : ''} found
            </span>
            <button
              onClick={changeFile}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Change file
            </button>
          </div>

          {truncated && (
            <div className="flex items-start gap-2 mb-2 p-2.5 rounded-xl" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">Only the first {MAX_SEMESTERS} semesters found in this file are shown — you can add the rest later from your Dashboard.</p>
            </div>
          )}

          {hasDuplicateSemesters && (
            <div className="flex items-start gap-2 mb-2 p-2.5 rounded-xl" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-300">Two semesters are set to the same number — pick a different one for each before continuing.</p>
            </div>
          )}

          <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-0.5">
            {semesters.map(sem => (
              <div key={sem.id} className="rounded-xl p-3.5" style={{ background: 'var(--muted-surface)' }}>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Semester</label>
                    <select
                      value={sem.semesterNumber}
                      onChange={e => updateSemester(sem.id, { semesterNumber: Number(e.target.value) })}
                      className="h-7 rounded-lg border px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                      style={{ borderColor: 'var(--divider)', background: 'var(--background)' }}
                    >
                      {SEMESTER_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">SGPA</label>
                    <input
                      type="number" min={0} max={10} step={0.01}
                      value={sem.sgpa}
                      onChange={e => updateSemester(sem.id, { sgpa: Number(e.target.value) })}
                      className="h-7 w-16 rounded-lg border px-2 text-xs font-mono text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                      style={{ borderColor: 'var(--divider)', background: 'var(--background)' }}
                    />
                    <button onClick={() => removeSemester(sem.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {sem.subjects.map(s => (
                    <div key={s.id} className="flex items-center gap-1.5">
                      <Input
                        value={s.name}
                        onChange={e => updateSubject(sem.id, s.id, { name: e.target.value })}
                        placeholder="Subject name"
                        className="h-7 flex-1 text-xs px-2"
                      />
                      <input
                        type="number" min={0} step={1}
                        value={s.credits}
                        onChange={e => updateSubject(sem.id, s.id, { credits: Number(e.target.value) })}
                        className="h-7 w-12 rounded-lg border px-1.5 text-xs font-mono text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                        style={{ borderColor: 'var(--divider)', background: 'var(--background)' }}
                      />
                      <input
                        value={s.grade}
                        onChange={e => updateSubject(sem.id, s.id, { grade: e.target.value.toUpperCase() })}
                        className="h-7 w-11 rounded-lg border px-1.5 text-xs font-semibold text-indigo-400 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                        style={{ borderColor: 'var(--divider)', background: 'var(--background)' }}
                      />
                      <button onClick={() => removeSubject(sem.id, s.id)} className="text-muted-foreground hover:text-red-400 transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={() => addSubject(sem.id)}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add subject
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {sem.subjects.reduce((sum, s) => sum + (s.credits || 0), 0)} cr
                  </span>
                </div>
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
          disabled={status === 'reviewing' ? !canContinue : true}
          onClick={() => onContinue(toParsedSemesterBlocks(semesters))}
        >
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}
