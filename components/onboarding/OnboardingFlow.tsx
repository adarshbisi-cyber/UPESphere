'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, Loader2, AlertTriangle } from 'lucide-react'
import { ProgressBar } from '@/components/onboarding/ProgressBar'
import { WelcomeStep } from '@/components/onboarding/steps/WelcomeStep'
import { BasicInfoStep } from '@/components/onboarding/steps/BasicInfoStep'
import { CurriculumStep } from '@/components/onboarding/steps/CurriculumStep'
import { TimetableStep } from '@/components/onboarding/steps/TimetableStep'
import { GradeCardStep } from '@/components/onboarding/steps/GradeCardStep'
import { ResumeStep } from '@/components/onboarding/steps/ResumeStep'
import { FinalStep } from '@/components/onboarding/steps/FinalStep'
import {
  saveBasicInfo, saveCurriculumSubjects, saveTimetableSlots, saveGradeCardSemesters,
  uploadResume, getWorkspaceStatus, markOnboardingComplete, type BasicInfo,
} from '@/lib/onboarding/api'
import type { TimetableSlot } from '@/lib/parsers/timetableParser'
import type { ParsedSemesterBlock } from '@/lib/parsers/gradeCardParser'

// Real, counted steps (Welcome and Final bookend the flow but aren't counted).
type StepId = 'welcome' | 'basicInfo' | 'curriculum' | 'timetable' | 'gradeCard' | 'resume' | 'final'
const COUNTED: StepId[] = ['basicInfo', 'curriculum', 'timetable', 'gradeCard', 'resume']

export function OnboardingFlow({ userId }: { userId: string }) {
  const router = useRouter()
  const [step, setStep] = useState<StepId>('welcome')
  const [basicInfo, setBasicInfo] = useState<Partial<BasicInfo>>({})
  const [finalStatus, setFinalStatus] = useState<Awaited<ReturnType<typeof getWorkspaceStatus>> | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const stepIndex = COUNTED.indexOf(step)
  const history: StepId[] = ['welcome', 'basicInfo', 'curriculum', 'timetable', 'gradeCard', 'resume', 'final']
  const goBack = () => {
    setSaveError(null)
    const idx = history.indexOf(step)
    if (idx > 0) setStep(history[idx - 1])
  }

  // Every step's Continue button ultimately awaits a Supabase write. Without
  // this wrapper, a thrown error (RLS rejection, a table/column that doesn't
  // exist yet, a dropped connection) became an unhandled promise rejection —
  // completely silent, so clicking Continue looked like it just did nothing.
  // This guarantees every failure surfaces a visible, dismissable message,
  // and blocks re-entrant clicks while a save is already in flight.
  function runStep<Args extends unknown[]>(fn: (...args: Args) => Promise<void>) {
    return async (...args: Args) => {
      if (saving) return
      setSaveError(null)
      setSaving(true)
      try {
        await fn(...args)
      } catch (err) {
        console.error(err)
        setSaveError("Couldn't save that — check your connection and try again.")
      } finally {
        setSaving(false)
      }
    }
  }

  const finish = async () => {
    const status = await getWorkspaceStatus(userId)
    await markOnboardingComplete(userId)
    setFinalStatus(status)
    setStep('final')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/3 w-[520px] h-[520px] rounded-full bg-indigo-600/12 blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] rounded-full bg-violet-600/10 blur-[130px]" />
      </div>

      {stepIndex >= 0 && <ProgressBar step={stepIndex + 1} total={COUNTED.length} />}

      {stepIndex > 0 && (
        <button
          onClick={goBack}
          className="fixed top-6 left-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={step} className="w-full">
          {step === 'welcome' && (
            <WelcomeStep onStart={() => setStep('basicInfo')} />
          )}

          {step === 'basicInfo' && (
            <BasicInfoStep
              initial={basicInfo}
              onContinue={runStep(async info => {
                setBasicInfo(info)
                await saveBasicInfo(userId, info)
                setStep('curriculum')
              })}
            />
          )}

          {step === 'curriculum' && (
            <CurriculumStep
              onSkip={() => setStep('timetable')}
              onContinue={runStep(async subjects => {
                await saveCurriculumSubjects(userId, subjects)
                setStep('timetable')
              })}
            />
          )}

          {step === 'timetable' && (
            <TimetableStep
              onSkip={() => setStep('gradeCard')}
              onContinue={runStep(async (slots: TimetableSlot[]) => {
                await saveTimetableSlots(userId, slots)
                setStep('gradeCard')
              })}
            />
          )}

          {step === 'gradeCard' && (
            <GradeCardStep
              onSkip={() => setStep('resume')}
              onContinue={runStep(async (semesters: ParsedSemesterBlock[]) => {
                await saveGradeCardSemesters(userId, semesters)
                setStep('resume')
              })}
            />
          )}

          {step === 'resume' && (
            <ResumeStep
              onSkip={finish}
              onContinue={runStep(async file => {
                await uploadResume(userId, file)
                await finish()
              })}
            />
          )}

          {step === 'final' && finalStatus && (
            <FinalStep
              status={finalStatus}
              onGoToDashboard={() => router.push('/dashboard')}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Saving overlay — blocks re-entrant clicks and shows something is happening */}
      <AnimatePresence>
        {saving && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
          >
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl" style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}>
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span className="text-sm text-foreground">Saving…</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save-error banner — every step's Continue routes through runStep, so any
          failed write (RLS, network, a migration not yet applied) surfaces here
          instead of the button silently doing nothing. */}
      <AnimatePresence>
        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl max-w-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-sm text-red-700 dark:text-red-300">{saveError}</span>
            <button onClick={() => setSaveError(null)} className="text-red-400 hover:text-red-300 text-xs ml-1">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
