'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/landing/Footer'
import { useAuth } from '@/components/auth/AuthProvider'
import { PlacementTracker } from '@/components/career/placement-tracker/PlacementTracker'

export default function PlacementTrackerPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // middleware.ts already guarantees only an authenticated, verified user
  // reaches this route (`/career` is in its protected-path list) — this is
  // just the client-side redirect for the moment before that guard's had a
  // chance to run, same pattern as app/dashboard/page.tsx.
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/career/placement-tracker')
    }
  }, [authLoading, user, router])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {user && <PlacementTracker userId={user.id} />}
      </div>
      <Footer />
    </main>
  )
}
