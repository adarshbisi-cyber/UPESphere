'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, ArrowRight, Loader2, Check, AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/onboarding/FileDropzone'
import { extractCurriculumSubjects } from '@/lib/parsers/curriculumExtract'
import type { ParsedSubject } from '@/lib/curriculum-parser'

type Status = 'idle' | 'parsing' | 'reviewing' | 'error'

export function CurriculumStep({
  onContinue,
  onSkip,
}: {
  onContinue: (subjects: { name: string; credits: number }[]) => void
  onSkip: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [subjects, setSubjects] = useState<ParsedSubject[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  const handleFile = async (f: File) => {
    setFile(f)
    setStatus('parsing')
    try {
      const { subjects: parsed } = await extractCurriculumSubjects(f)
      if (parsed.length === 0) {
        setErrorMsg('No subjects detected. Try a clearer file, or skip and add them later.')
        setStatus('error')
        return
      }
      setSubjects(parsed)
      setStatus('reviewing')
    } catch {
      setErrorMsg('Something went wrong reading that file. Try again, or skip for now.')
      setStatus('error')
    }
  }

  const removeSubject = (id: string) => setSubjects(s => s.filter(x => x.id !== id))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-md mx-auto w-full"
    >
      <h2 className="text-2xl font-bold font-display tracking-tight mb-1.5 text-center">Set up your Subjects</h2>
      <p className="text-sm text-muted-foreground text-center mb-2">Upload your curriculum PDF or screenshot.</p>
      <p className="text-xs text-muted-foreground/70 text-center mb-6">
        Our AI will automatically detect subjects, detect credits, and prepare your GPA Calculator.
      </p>

      {status !== 'reviewing' && (
        <>
          <FileDropzone
            accept="application/pdf,image/*"
            icon={BookOpen}
            label="Drop your curriculum here"
            file={file}
            onClear={() => { setFile(null); setStatus('idle') }}
            onFile={handleFile}
          />

          {status === 'parsing' && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Reading your curriculum…
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
        <div className="space-y-1.5 max-h-64 overflow-y-auto mb-2">
          {subjects.map(s => (
            <div key={s.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg" style={{ background: 'var(--muted-surface)' }}>
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="flex-1 text-sm truncate">{s.name}</span>
              <span className="text-xs font-mono text-muted-foreground">{s.credits}cr</span>
              <button onClick={() => removeSubject(s.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <Button variant="ghost" onClick={onSkip}>Skip for now</Button>
        <Button
          variant="gradient"
          className="flex-1 gap-2"
          disabled={status === 'reviewing' ? subjects.length === 0 : true}
          onClick={() => onContinue(subjects.map(s => ({ name: s.name, credits: s.credits })))}
        >
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}
