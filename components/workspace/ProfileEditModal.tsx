'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UploadModalShell } from '@/components/workspace/UploadModalShell'
import { getBasicInfo, saveBasicInfo } from '@/lib/onboarding/api'
import { describeSaveError } from '@/lib/onboarding/errors'

const SEMESTERS = Array.from({ length: 10 }, (_, i) => i + 1)
const PROGRAM_LENGTHS = [2, 4, 6, 8, 10, 12]

export function ProfileEditModal({
  userId,
  onClose,
  onSaved,
}: {
  userId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [fullName, setFullName] = useState('')
  const [university, setUniversity] = useState('')
  const [course, setCourse] = useState('')
  const [semester, setSemester] = useState(1)
  const [totalSemesters, setTotalSemesters] = useState(8)
  const [graduationYear, setGraduationYear] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const savingRef = useRef(false)

  useEffect(() => {
    getBasicInfo(userId)
      .then(info => {
        setFullName(info.fullName)
        setUniversity(info.university)
        setCourse(info.course)
        setSemester(info.semester)
        setTotalSemesters(info.totalSemesters)
        setGraduationYear(info.graduationYear?.toString() ?? '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  const canSave = fullName.trim() && university.trim() && course.trim()

  const handleSave = async () => {
    if (savingRef.current || !canSave) return
    savingRef.current = true
    setSaving(true)
    setSaveError('')
    try {
      await saveBasicInfo(userId, {
        fullName: fullName.trim(),
        university: university.trim(),
        course: course.trim(),
        semester,
        totalSemesters,
        graduationYear: graduationYear ? parseInt(graduationYear, 10) : null,
      })
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
      <h2 className="text-xl font-bold font-display tracking-tight mb-1.5 text-center pr-6">Edit your Profile</h2>
      <p className="text-sm text-muted-foreground text-center mb-6">Keep your academic details up to date.</p>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pf-name" className="mb-1.5 block">Full Name</Label>
              <Input id="pf-name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <Label htmlFor="pf-university" className="mb-1.5 block">University</Label>
              <Input id="pf-university" value={university} onChange={e => setUniversity(e.target.value)} placeholder="UPES" />
            </div>
            <div>
              <Label htmlFor="pf-course" className="mb-1.5 block">Course / Program</Label>
              <Input id="pf-course" value={course} onChange={e => setCourse(e.target.value)} placeholder="MBA (Strategy & Consulting)" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pf-semester" className="mb-1.5 block">Current Semester</Label>
                <select
                  id="pf-semester"
                  value={semester}
                  onChange={e => setSemester(Number(e.target.value))}
                  className="flex h-10 w-full rounded-xl border px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                  style={{ borderColor: 'var(--divider)', background: 'var(--muted-surface)' }}
                >
                  {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="pf-total" className="mb-1.5 block">Program Length</Label>
                <select
                  id="pf-total"
                  value={totalSemesters}
                  onChange={e => setTotalSemesters(Number(e.target.value))}
                  className="flex h-10 w-full rounded-xl border px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                  style={{ borderColor: 'var(--divider)', background: 'var(--muted-surface)' }}
                >
                  {PROGRAM_LENGTHS.map(n => <option key={n} value={n}>{n} semesters</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="pf-grad" className="mb-1.5 block text-muted-foreground/70">Graduation Year <span className="text-muted-foreground/50">(optional)</span></Label>
              <Input id="pf-grad" type="number" value={graduationYear} onChange={e => setGraduationYear(e.target.value)} placeholder="2027" />
            </div>
          </div>

          {saveError && (
            <div className="flex items-start gap-2 mt-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-300">{saveError}</p>
            </div>
          )}

          <div className="flex gap-2 mt-6">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="gradient" className="flex-1 gap-2" disabled={!canSave || saving} onClick={handleSave}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </div>
        </>
      )}
    </UploadModalShell>
  )
}
