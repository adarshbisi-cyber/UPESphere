'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { BasicInfo } from '@/lib/onboarding/api'

const SEMESTERS = Array.from({ length: 10 }, (_, i) => i + 1)
const PROGRAM_LENGTHS = [2, 4, 6, 8, 10, 12]

export function BasicInfoStep({
  initial,
  onContinue,
}: {
  initial: Partial<BasicInfo>
  onContinue: (info: BasicInfo) => void
}) {
  const [fullName, setFullName] = useState(initial.fullName ?? '')
  const [university, setUniversity] = useState(initial.university ?? '')
  const [course, setCourse] = useState(initial.course ?? '')
  const [semester, setSemester] = useState(initial.semester ?? 1)
  const [totalSemesters, setTotalSemesters] = useState(initial.totalSemesters ?? 8)
  const [graduationYear, setGraduationYear] = useState(initial.graduationYear?.toString() ?? '')

  const canContinue = fullName.trim() && university.trim() && course.trim()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-md mx-auto w-full"
    >
      <h2 className="text-2xl font-bold font-display tracking-tight mb-1.5 text-center">Tell us about yourself</h2>
      <p className="text-sm text-muted-foreground text-center mb-8">Just the basics — everything else comes from your documents.</p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName" className="mb-1.5 block">Full Name</Label>
          <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Doe" />
        </div>
        <div>
          <Label htmlFor="university" className="mb-1.5 block">University</Label>
          <Input id="university" value={university} onChange={e => setUniversity(e.target.value)} placeholder="UPES" />
        </div>
        <div>
          <Label htmlFor="course" className="mb-1.5 block">Course / Program</Label>
          <Input id="course" value={course} onChange={e => setCourse(e.target.value)} placeholder="MBA (Strategy & Consulting)" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="semester" className="mb-1.5 block">Current Semester</Label>
            <select
              id="semester"
              value={semester}
              onChange={e => setSemester(Number(e.target.value))}
              className="flex h-10 w-full rounded-xl border px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
              style={{ borderColor: 'var(--divider)', background: 'var(--muted-surface)' }}
            >
              {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="totalSemesters" className="mb-1.5 block">Program Length</Label>
            <select
              id="totalSemesters"
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
          <Label htmlFor="gradYear" className="mb-1.5 block text-muted-foreground/70">Graduation Year <span className="text-muted-foreground/50">(optional)</span></Label>
          <Input id="gradYear" type="number" value={graduationYear} onChange={e => setGraduationYear(e.target.value)} placeholder="2027" />
        </div>
      </div>

      <Button
        variant="gradient"
        className="w-full mt-8 gap-2"
        disabled={!canContinue}
        onClick={() => onContinue({
          fullName: fullName.trim(),
          university: university.trim(),
          course: course.trim(),
          semester,
          totalSemesters,
          graduationYear: graduationYear ? parseInt(graduationYear, 10) : null,
        })}
      >
        Continue <ArrowRight className="w-4 h-4" />
      </Button>
    </motion.div>
  )
}
