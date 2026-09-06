'use client'

// Top-level Placement Tracker shell: one data fetch (shared across all three
// tabs — the dataset per student is small enough that client-side derived
// analytics is simpler and just as correct as round-tripping to Supabase per
// view), owns which modal is open, and keeps loading/error/empty states
// distinct (a network failure and "nothing tracked yet" must never look the
// same — same convention as AcademicWorkspace.tsx).

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { AlertTriangle, LayoutGrid } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PlacementTrackerEmptyState } from './EmptyState'
import { DashboardTab } from './DashboardTab'
import { ApplicationsTab } from './ApplicationsTab'
import { InsightsTab } from './InsightsTab'
import { AddApplicationModal } from './AddApplicationModal'
import { ApplicationDetailModal } from './ApplicationDetailModal'
import { getApplications } from '@/lib/placementTracker/api'
import { describeSaveError } from '@/lib/onboarding/errors'
import type { PlacementApplication } from '@/lib/placementTracker/types'

type Status = 'loading' | 'ready' | 'error'
type Tab = 'dashboard' | 'applications' | 'insights'

// Postgres "relation does not exist" — the one error worth a specific
// message rather than the generic fallback, since it means the migration
// (supabase/placement-tracker-migration.sql) was never run, not a transient
// network failure "Try again" would actually fix.
function isMissingTableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { code?: string; message?: string }
  return e.code === '42P01' || /relation .* does not exist/i.test(e.message ?? '')
}

export function PlacementTracker({ userId }: { userId: string }) {
  const [applications, setApplications] = useState<PlacementApplication[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [errorDetail, setErrorDetail] = useState('')
  const [missingTable, setMissingTable] = useState(false)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [showAddModal, setShowAddModal] = useState(false)
  const [openApplicationId, setOpenApplicationId] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setStatus('loading')
    getApplications(userId)
      .then(apps => { setApplications(apps); setStatus('ready') })
      .catch(err => {
        setErrorDetail(describeSaveError(err))
        setMissingTable(isMissingTableError(err))
        setStatus('error')
      })
  }, [userId])

  useEffect(() => { refresh() }, [refresh])

  const handleAdded = () => { setShowAddModal(false); refresh() }

  if (status === 'error') {
    return (
      <GlassCard className="p-10 text-center">
        <AlertTriangle className="w-7 h-7 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-1">Couldn&rsquo;t load your Placement Tracker.</p>
        {missingTable ? (
          <p className="text-xs text-muted-foreground/80 max-w-sm mx-auto mb-4">
            The Placement Tracker database tables haven&rsquo;t been set up yet — run{' '}
            <code className="text-[11px] px-1 py-0.5 rounded" style={{ background: 'var(--muted-surface)' }}>
              supabase/placement-tracker-migration.sql
            </code>{' '}
            in your Supabase SQL editor first.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/80 max-w-sm mx-auto mb-4">{errorDetail}</p>
        )}
        <button onClick={refresh} className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">Try again</button>
      </GlassCard>
    )
  }

  if (status === 'loading') return null

  if (applications.length === 0) {
    return (
      <>
        <PlacementTrackerEmptyState onAddFirst={() => setShowAddModal(true)} />
        <AnimatePresence>
          {showAddModal && <AddApplicationModal userId={userId} onClose={() => setShowAddModal(false)} onSaved={handleAdded} />}
        </AnimatePresence>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
          <LayoutGrid className="w-4 h-4 text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold font-display tracking-tight">Placement Tracker</h1>
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as Tab)}>
        <TabsList className="flex-nowrap w-max sm:w-auto h-11 mb-6">
          <TabsTrigger value="dashboard" className="shrink-0">Dashboard</TabsTrigger>
          <TabsTrigger value="applications" className="shrink-0">My Applications</TabsTrigger>
          <TabsTrigger value="insights" className="shrink-0">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab
            applications={applications}
            onOpen={setOpenApplicationId}
            onViewApplications={() => setTab('applications')}
          />
        </TabsContent>
        <TabsContent value="applications">
          <ApplicationsTab applications={applications} onAdd={() => setShowAddModal(true)} onOpen={setOpenApplicationId} />
        </TabsContent>
        <TabsContent value="insights">
          <InsightsTab applications={applications} />
        </TabsContent>
      </Tabs>

      <AnimatePresence>
        {showAddModal && <AddApplicationModal userId={userId} onClose={() => setShowAddModal(false)} onSaved={handleAdded} />}
        {openApplicationId && (
          <ApplicationDetailModal
            userId={userId}
            applicationId={openApplicationId}
            onClose={() => setOpenApplicationId(null)}
            onChanged={refresh}
          />
        )}
      </AnimatePresence>
    </>
  )
}
