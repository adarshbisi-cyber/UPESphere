'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, ArrowRight, Loader2, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/onboarding/FileDropzone'
import { extractPdfTextItems, hasExtractableText } from '@/lib/parsers/pdfText'
import { parseGradeCardItems, type ParsedSemesterBlock } from '@/lib/parsers/gradeCardParser'

type Status = 'idle' | 'parsing' | 'reviewing' | 'error'

export function GradeCardStep({
  onContinue,
  onSkip,
}: {
  onContinue: (semesters: ParsedSemesterBlock[]) => void
  onSkip: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [semesters, setSemesters] = useState<ParsedSemesterBlock[]>([])
  const [errorMsg, setErrorMsg] = useState('')

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
      setSemesters(result.semesters)
      setStatus('reviewing')
    } catch {
      setErrorMsg('Something went wrong reading that file. Try again, or skip for now.')
      setStatus('error')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
        <div className="space-y-3 max-h-72 overflow-y-auto mb-2">
          {semesters.map((sem, i) => (
            <div key={i} className="rounded-xl p-3.5" style={{ background: 'var(--muted-surface)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{sem.semesterLabel ?? `Semester ${i + 1}`}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {sem.sgpa !== null && <span className="text-emerald-400 font-mono">{sem.sgpa} SGPA</span>}
                  {sem.totalCredits !== null && <span>{sem.totalCredits} cr</span>}
                </div>
              </div>
              <div className="space-y-1">
                {sem.subjects.map((s, j) => (
                  <div key={j} className="flex items-center gap-2 text-xs">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="flex-1 truncate text-foreground/80">{s.name}</span>
                    <span className="font-mono text-muted-foreground">{s.credits}cr</span>
                    <span className="font-semibold text-indigo-400 w-6 text-right">{s.grade}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <Button variant="ghost" onClick={onSkip}>Skip for now</Button>
        <Button
          variant="gradient"
          className="flex-1 gap-2"
          disabled={status === 'reviewing' ? semesters.length === 0 : true}
          onClick={() => onContinue(semesters)}
        >
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}
