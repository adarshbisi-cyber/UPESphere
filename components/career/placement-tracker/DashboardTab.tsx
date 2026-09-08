'use client'

// Dashboard = operational information only: where you stand, what's next,
// how consistently you've been applying, and one funnel. Every
// interpretation of that data — biggest drop-off, strongest stage, exit
// reasons, trends — lives in the Insights tab, so the same stage numbers
// are never restated in two places wearing different hats.

import { ArrowRight, CalendarClock, AlertCircle } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { ActivityHeatmap } from './ActivityHeatmap'
import {
  computeOverview, computeApplicationFunnel, computeUpcomingActions,
} from '@/lib/placementTracker/analytics'
import type { PlacementApplication } from '@/lib/placementTracker/types'

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <GlassCard className="p-4">
      <div className="text-2xl font-bold font-display">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </GlassCard>
  )
}

export function DashboardTab({
  applications,
  onOpen,
  onViewApplications,
}: {
  applications: PlacementApplication[]
  onOpen: (applicationId: string) => void
  onViewApplications: () => void
}) {
  const overview = computeOverview(applications)
  const upcomingActions = computeUpcomingActions(applications)
  const funnel = computeApplicationFunnel(applications)
  // Every bar is measured against the top of the funnel, so the widths read
  // as "share of all applications" rather than being renormalised per chart.
  const funnelBase = Math.max(1, funnel[0]?.count ?? 1)

  return (
    <div className="space-y-6">
      {/* Placement overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Applications" value={overview.totalApplications} />
        <StatCard label="Active Applications" value={overview.activeApplications} />
        <StatCard label="Upcoming Rounds" value={overview.upcomingRounds} />
        <StatCard label="Offers Received" value={overview.offersReceived} />
      </div>

      {/* Application Activity */}
      <ActivityHeatmap applications={applications} />

      {/* Upcoming Actions */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold font-display">Upcoming Actions</h3>
          <button onClick={onViewApplications} className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {upcomingActions.length === 0 ? (
          <div className="text-center py-6">
            <CalendarClock className="w-6 h-6 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nothing scheduled right now.</p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              Add an application or update a round to see what&rsquo;s coming up next.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingActions.slice(0, 5).map(action => (
              <button
                key={action.applicationId}
                onClick={() => onOpen(action.applicationId)}
                className="w-full text-left flex items-center justify-between gap-3 p-3 rounded-xl transition-colors hover:border-indigo-500/30 border border-transparent"
                style={{ background: 'var(--muted-surface)' }}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{action.companyName}</div>
                  <div className={`text-xs truncate inline-flex items-center gap-1 ${action.kind === 'needs_update' ? 'text-amber-500 dark:text-amber-400' : 'text-muted-foreground'}`}>
                    {action.kind === 'needs_update' && <AlertCircle className="w-3 h-3 shrink-0" />}
                    {action.detail}
                  </div>
                </div>
                {action.scheduledDate && (
                  <div className="text-xs text-muted-foreground shrink-0">
                    {new Date(action.scheduledDate).toLocaleDateString()}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </GlassCard>

      {/* One compact funnel. Drop-off, strongest stage and trends live in
          Insights — repeating them here was the same stage data three times. */}
      <div>
        <GlassCard className="p-5">
          <h3 className="text-base font-semibold font-display mb-4">Application Funnel</h3>
          {funnel.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Add recruitment rounds to see your funnel here.</p>
          ) : (
            <div className="space-y-2.5">
              {funnel.map(stage => (
                <div key={stage.key}>
                  <div className="flex items-center justify-between text-xs mb-1 gap-2">
                    <span className="text-muted-foreground truncate">{stage.label}</span>
                    <span className="font-medium text-foreground shrink-0">{stage.count}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-500"
                      style={{ width: `${(stage.count / funnelBase) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

      </div>

    </div>
  )
}
