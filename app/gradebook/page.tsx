'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpenCheck, AlertTriangle, Plus } from 'lucide-react'
import { Navbar } from '@/components/shared/Navbar'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { CGPATrend } from '@/components/dashboard/CGPATrend'
import { InsightsPanel } from '@/components/dashboard/InsightsPanel'
import { AcademicSummaryCards } from '@/components/gradebook/AcademicSummaryCards'
import { SemesterGradebookTable } from '@/components/gradebook/SemesterGradebookTable'
import { GradeDistribution } from '@/components/gradebook/GradeDistribution'
import { SemesterComparison } from '@/components/gradebook/SemesterComparison'
import { GradeSheetsSection } from '@/components/gradebook/GradeSheetsSection'
import { GradeSheetsManagerModal } from '@/components/workspace/GradeSheetsManagerModal'
import { useAuth } from '@/components/auth/AuthProvider'
import { getGradebookSemesters, type GradebookSemester } from '@/lib/gradebook/api'
import { buildTrendData } from '@/lib/calculations/cgpa'
import { buildPerformanceInsights } from '@/lib/calculations/gradebookInsights'

export default function GradebookPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [semesters, setSemesters] = useState<GradebookSemester[] | null>(null)
  const [fetchError, setFetchError] = useState(false)
  const [showEmptyUpload, setShowEmptyUpload] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/gradebook')
    }
  }, [authLoading, user, router])

  const refresh = useCallback(() => {
    if (!user) return
    setFetchError(false)
    getGradebookSemesters(user.id)
      .then(setSemesters)
      .catch(() => setFetchError(true))
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  const loading = authLoading || (!!user && semesters === null && !fetchError)

  // Still authenticating (middleware guarantees a user reaches this route) —
  // hold on `loading` so the skeleton shows rather than a blank flash.
  if (!user) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        {loading && (
          <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-64 rounded-xl bg-white/5" />
              <div className="h-6 w-96 rounded-xl bg-white/5" />
            </div>
          </div>
        )}
      </main>
    )
  }

  const validSemesters = (semesters ?? []).filter(s => s.sgpa != null && s.totalCredits != null)
  const hasSemesters = validSemesters.length > 0
  const trendData = buildTrendData(validSemesters.map(s => ({ semesterNumber: s.semesterNumber, sgpa: s.sgpa as number, totalCredits: s.totalCredits as number })))
  const insights = buildPerformanceInsights(validSemesters)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
          >
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-64 rounded-xl bg-white/5" />
              <div className="h-6 w-96 rounded-xl bg-white/5" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-xl bg-white/5" />
                ))}
              </div>
              <div className="h-72 rounded-2xl bg-white/5 mt-6" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
          >
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-3">
            <BookOpenCheck className="w-3.5 h-3.5" />
            Academic Performance
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight mb-2">Gradebook</h1>
          <p className="text-muted-foreground">Your complete academic performance record</p>
        </div>

        {fetchError ? (
          <GlassCard className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold font-display mb-2">Couldn&rsquo;t load your Gradebook</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">Check your connection and try again.</p>
            <Button variant="gradient" onClick={refresh}>Retry</Button>
          </GlassCard>
        ) : !hasSemesters ? (
          <GlassCard className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center mx-auto mb-4">
              <BookOpenCheck className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold font-display mb-2">Your Gradebook is waiting for your first semester.</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Upload a grade sheet to automatically build your academic performance history.
            </p>
            <Button variant="gradient" className="gap-2" onClick={() => setShowEmptyUpload(true)}>
              <Plus className="w-4 h-4" /> Upload Grade Sheet
            </Button>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            <AcademicSummaryCards userId={user.id} semesters={semesters ?? []} />

            <CGPATrend
              data={trendData}
              title="Academic Performance"
              subtitle="Track your SGPA and CGPA progression across semesters"
            />

            <SemesterGradebookTable semesters={validSemesters} />

            {insights.length > 0 && (
              <InsightsPanel insights={insights} title="Performance Insights" badge="" />
            )}

            <GradeDistribution semesters={validSemesters} />

            <SemesterComparison semesters={validSemesters} />

            <GradeSheetsSection userId={user.id} semesters={validSemesters} onChanged={refresh} />
          </div>
        )}
          </motion.div>
        )}
      </AnimatePresence>

      {showEmptyUpload && (
        <GradeSheetsManagerModal
          userId={user.id}
          onClose={() => setShowEmptyUpload(false)}
          onSaved={() => { setShowEmptyUpload(false); refresh() }}
        />
      )}
    </main>
  )
}
