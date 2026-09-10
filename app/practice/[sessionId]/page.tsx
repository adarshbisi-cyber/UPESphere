'use client'

// Deep link for a single session — this is where notification action_urls
// point (`/practice/<id>`). It renders the same shell with that session's
// detail already open, rather than a separate page that would duplicate the
// detail view and its actions.

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/landing/Footer'
import { useAuth } from '@/components/auth/AuthProvider'
import { PracticeTogether } from '@/components/practice/PracticeTogether'

export default function PracticeSessionPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams<{ sessionId: string }>()

  useEffect(() => {
    if (!authLoading && !user) router.push(`/login?redirect=/practice/${params.sessionId}`)
  }, [authLoading, user, router, params.sessionId])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {user && <PracticeTogether userId={user.id} initialSessionId={params.sessionId} />}
      </div>
      <Footer />
    </main>
  )
}
