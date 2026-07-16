'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
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

  const stepIndex = COUNTED.indexOf(step)
  const history: StepId[] = ['welcome', 'basicInfo', 'curriculum', 'timetable', 'gradeCard', 'resume', 'final']
  const goBack = () => {
    const idx = history.indexOf(step)
    if (idx > 0) setStep(history[idx - 1])
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
              onContinue={async info => {
                setBasicInfo(info)
                await saveBasicInfo(userId, info)
                setStep('curriculum')
              }}
            />
          )}

          {step === 'curriculum' && (
            <CurriculumStep
              onSkip={() => setStep('timetable')}
              onContinue={async subjects => {
                await saveCurriculumSubjects(userId, subjects)
                setStep('timetable')
              }}
            />
          )}

          {step === 'timetable' && (
            <TimetableStep
              onSkip={() => setStep('gradeCard')}
              onContinue={async (slots: TimetableSlot[]) => {
                await saveTimetableSlots(userId, slots)
                setStep('gradeCard')
              }}
            />
          )}

          {step === 'gradeCard' && (
            <GradeCardStep
              onSkip={() => setStep('resume')}
              onContinue={async (semesters: ParsedSemesterBlock[]) => {
                await saveGradeCardSemesters(userId, semesters)
                setStep('resume')
              }}
            />
          )}

          {step === 'resume' && (
            <ResumeStep
              onSkip={finish}
              onContinue={async file => {
                await uploadResume(userId, file)
                await finish()
              }}
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
    </div>
  )
}
