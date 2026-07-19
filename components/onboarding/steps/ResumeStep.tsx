'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { EASE_OUT } from '@/lib/utils'
import { FileText, ArrowRight, Loader2, AlertTriangle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/onboarding/FileDropzone'

const BENEFITS = ['ATS Analysis', 'Resume Score', 'Missing Skills', 'Recruiter Feedback']

export function ResumeStep({
  onContinue,
  onSkip,
}: {
  onContinue: (file: File) => Promise<void>
  onSkip: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleContinue = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      await onContinue(file)
    } catch {
      setError('Upload failed. Check your connection and try again, or skip for now.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className="max-w-md mx-auto w-full"
    >
      <h2 className="text-2xl font-bold font-display tracking-tight mb-1.5 text-center">Unlock AI Career Assistant</h2>
      <p className="text-sm text-muted-foreground text-center mb-4">Upload your resume.</p>

      <div className="flex flex-wrap gap-1.5 justify-center mb-6">
        {BENEFITS.map(b => (
          <span key={b} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-foreground/80 border border-white/10 bg-white/[0.03]">
            <Sparkles className="w-3 h-3 text-indigo-400" /> {b}
          </span>
        ))}
      </div>

      <FileDropzone
        accept="application/pdf,.doc,.docx"
        icon={FileText}
        label="Drop your resume here"
        sublabel="PDF or Word document"
        file={file}
        onClear={() => setFile(null)}
        onFile={setFile}
      />

      {error && (
        <div className="flex items-start gap-2 mt-4 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">{error}</p>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <Button variant="ghost" onClick={onSkip} disabled={uploading}>Skip</Button>
        <Button variant="gradient" className="flex-1 gap-2" disabled={!file || uploading} onClick={handleContinue}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
        </Button>
      </div>
    </motion.div>
  )
}
