'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Library } from 'lucide-react'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/landing/Footer'
import { useAuth } from '@/components/auth/AuthProvider'
import { ResourcesLibrary } from '@/components/career/resources/ResourcesLibrary'

export default function CareerResourcesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // middleware.ts already guarantees only an authenticated, verified user
  // reaches this route (`/career` is in its protected-path list) — this is
  // just the client-side redirect for the moment before that guard's had a
  // chance to run, same pattern as app/dashboard/page.tsx and
  // app/career/placement-tracker/page.tsx.
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/career/resources')
    }
  }, [authLoading, user, router])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {user && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                <Library className="w-4 h-4 text-indigo-400" />
              </div>
              <h1 className="text-2xl font-bold font-display tracking-tight">Career Resources</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Explore curated resources, templates, guides, and tools to support your career journey.
            </p>
            <ResourcesLibrary />
          </>
        )}
      </div>
      <Footer />
    </main>
  )
}
