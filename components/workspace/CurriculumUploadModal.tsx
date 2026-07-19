'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { CurriculumScanner } from '@/components/calculators/CurriculumScanner'
import { UploadModalShell } from '@/components/workspace/UploadModalShell'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getBasicInfo, saveCurriculumSubjects, updateCurrentSemester } from '@/lib/onboarding/api'
import type { Subject } from '@/types'

export function CurriculumUploadModal({
  userId,
  onClose,
  onSaved,
  initialSemester,
  syncCurrentSemester = true,
}: {
  userId: string
  onClose: () => void
  onSaved: () => void
  // Pre-selects the semester instead of defaulting to the student's stored
  // current semester — used when updating a specific semester's curriculum
  // from the Full Curriculum browse view.
  initialSemester?: number
  // Whether confirming a semester here should also update
  // profiles.current_semester. True for the primary upload entry points
  // (uploading curriculum reasonably means "this is the semester I'm in
  // now"). False when editing one specific past/future semester's record
  // from the Full Curriculum view — that's a historical correction, not a
  // declaration of what semester the student is currently in.
  syncCurrentSemester?: boolean
}) {
  // Curriculum is saved per-semester, so a re-upload needs to know which
  // semester it's replacing — default to the student's stored current
  // semester (the common case), but let them override for a different one.
  const [loadingInfo, setLoadingInfo] = useState(initialSemester === undefined)
  const [totalSemesters, setTotalSemesters] = useState(8)
  const [semester, setSemester] = useState(initialSemester ?? 1)
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getBasicInfo(userId)
      .then(info => {
        if (initialSemester === undefined) setSemester(info.semester)
        setTotalSemesters(info.totalSemesters)
      })
      .catch(() => {})
      .finally(() => setLoadingInfo(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const handleImport = async (subjects: Subject[]) => {
    setSaving(true)
    try {
      const saves = [saveCurriculumSubjects(userId, semester, subjects.map(s => ({ name: s.name, credits: s.credits })))]
      if (syncCurrentSemester) saves.push(updateCurrentSemester(userId, semester))
      await Promise.all(saves)
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
  if (confirmed) return <CurriculumScanner onImport={handleImport} onClose={onClose} />

  const SEMESTERS = Array.from({ length: totalSemesters }, (_, i) => i + 1)

  return (
    <UploadModalShell onClose={onClose}>
      <h2 className="text-xl font-bold font-display tracking-tight mb-1.5 text-center pr-6">
        Which semester is this curriculum for?
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Uploading replaces the saved courses for that semester only — other semesters stay untouched.
      </p>

      <Label htmlFor="curriculum-semester" className="mb-1.5 block">Semester</Label>
      <select
        id="curriculum-semester"
        value={semester}
        disabled={loadingInfo}
        onChange={e => setSemester(Number(e.target.value))}
        className="flex h-10 w-full rounded-xl border px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:opacity-50"
        style={{ borderColor: 'var(--divider)', background: 'var(--muted-surface)' }}
      >
        {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
      </select>

      <div className="flex gap-2 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="gradient" className="flex-1 gap-2" disabled={loadingInfo} onClick={() => setConfirmed(true)}>
          {loadingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
        </Button>
      </div>
    </UploadModalShell>
  )
}
