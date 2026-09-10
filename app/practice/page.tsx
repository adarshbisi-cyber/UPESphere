'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/landing/Footer'
import { useAuth } from '@/components/auth/AuthProvider'
import { PracticeTogether } from '@/components/practice/PracticeTogether'
import { PRACTICE_TYPES } from '@/lib/practiceTogether/constants'
import type { PracticeType } from '@/lib/practiceTogether/types'

// `?practiceType=group_discussion` arrives from a Placement Tracker
// recommendation, so the student lands with that filter already applied
// rather than being asked to pick the thing they just clicked (§11).
// Validated against the known types so a hand-edited URL can't put the
// filter into a state the UI can't render.
function usePracticeTypeParam(): PracticeType | undefined {
  const params = useSearchParams()
  const raw = params.get('practiceType')
  return PRACTICE_TYPES.some(t => t.value === raw) ? (raw as PracticeType) : undefined
}

export default function PracticePage() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense fallback={null}>
      <PracticePageInner />
    </Suspense>
  )
}

function PracticePageInner() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const practiceType = usePracticeTypeParam()

  // middleware.ts already guards /practice; this is the client-side redirect
  // for the moment before that runs, same pattern as the other app pages.
  useEffect(() => {
    if (!authLoading && !user) router.push('/login?redirect=/practice')
  }, [authLoading, user, router])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {user && <PracticeTogether userId={user.id} initialPracticeType={practiceType} />}
      </div>
      <Footer />
    </main>
  )
}
