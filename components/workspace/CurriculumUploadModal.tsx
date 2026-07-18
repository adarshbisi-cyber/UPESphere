'use client'

import { useState } from 'react'
import { CurriculumScanner } from '@/components/calculators/CurriculumScanner'
import { saveCurriculumSubjects } from '@/lib/onboarding/api'
import type { Subject } from '@/types'

export function CurriculumUploadModal({
  userId,
  onClose,
  onSaved,
}: {
  userId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)

  const handleImport = async (subjects: Subject[]) => {
    setSaving(true)
    try {
      await saveCurriculumSubjects(userId, subjects.map(s => ({ name: s.name, credits: s.credits })))
      onSaved()
    } catch {
      // CurriculumScanner has already closed itself at this point — surfacing
      // a save failure here would need its own toast. Rare (network drop
      // right after a successful scan); the Dashboard will simply still show
      // the item as missing, so the user can just retry the upload.
      setSaving(false)
      onClose()
    }
  }

  if (saving) return null
  return <CurriculumScanner onImport={handleImport} onClose={onClose} />
}
