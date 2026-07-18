'use client'

import { useRef, useState } from 'react'
import { FileText, ArrowRight, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/onboarding/FileDropzone'
import { UploadModalShell } from '@/components/workspace/UploadModalShell'
import { uploadResume } from '@/lib/onboarding/api'
import { describeSaveError } from '@/lib/onboarding/errors'

export function ResumeUploadModal({
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
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const savingRef = useRef(false)

  const handleSave = async () => {
    if (!file || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setSaveError('')
    try {
      await uploadResume(userId, file)
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
        {hasExisting ? 'Replace your Resume' : 'Add your Resume'}
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        {hasExisting ? 'Uploading a new file replaces your current resume.' : 'Upload your resume as a PDF or Word document.'}
      </p>

      <FileDropzone
        accept="application/pdf,.doc,.docx"
        icon={FileText}
        label="Drop your resume here"
        sublabel="PDF or Word document"
        file={file}
        onClear={() => setFile(null)}
        onFile={setFile}
      />

      {saveError && (
        <div className="flex items-start gap-2 mt-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300">{saveError}</p>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="gradient" className="flex-1 gap-2" disabled={!file || saving} onClick={handleSave}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save <ArrowRight className="w-4 h-4" /></>}
        </Button>
      </div>
    </UploadModalShell>
  )
}
