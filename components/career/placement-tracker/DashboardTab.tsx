'use client'

// Dashboard = quick overview plus the two insights worth surfacing without
// being asked (biggest drop-off, strongest stage). Deep analysis lives in
// the Insights tab — see the progressive-disclosure split in the feature
// spec, which is why this file deliberately doesn't repeat the round
// performance table or the observation list.

import { TrendingUp, TrendingDown, Sparkles, ArrowRight, CalendarClock, AlertCircle } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  computeOverview, computeApplicationFunnel, computeUpcomingActions,
  computeStageInsights, computeTrends,
  DROPOFF_EMPTY_MESSAGE, STRENGTH_EMPTY_MESSAGE,
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

function MoreDataNeeded({ children }: { children: React.ReactNode }) {
  return (
    <>
      <p className="text-sm font-medium text-foreground/80 mb-1">More data needed</p>
      <p className="text-xs text-muted-foreground">{children}</p>
    </>
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
  const { bottleneck, strength } = computeStageInsights(applications)
  const trends = computeTrends(applications)
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

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Application Funnel */}
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

        <div className="space-y-4">
          {/* Biggest drop-off */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold font-display">Your Biggest Drop-off</h3>
            </div>
            {bottleneck.status === 'ok' ? (
              <>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-base font-bold text-foreground">{bottleneck.insight.label}</span>
                  <Badge variant="red">{bottleneck.insight.confidence.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Eliminated: {bottleneck.insight.eliminated} of {bottleneck.insight.reached} times
                  ({Math.round(bottleneck.insight.eliminationRate * 100)}%)
                </p>
                <p className="text-xs text-foreground/80 mb-2">{bottleneck.insight.recommendation}</p>
                <p className="text-[11px] font-medium text-muted-foreground mb-1">Suggested focus</p>
                <ul className="space-y-0.5">
                  {bottleneck.insight.suggestedFocus.map(f => (
                    <li key={f} className="text-xs text-muted-foreground flex gap-1.5">
                      <span aria-hidden="true" className="text-indigo-400">&bull;</span>{f}
                    </li>
                  ))}
                </ul>
              </>
            ) : bottleneck.status === 'no_dropoff' ? (
              <p className="text-sm text-muted-foreground">You haven&rsquo;t been eliminated at any stage yet.</p>
            ) : (
              <MoreDataNeeded>{DROPOFF_EMPTY_MESSAGE}</MoreDataNeeded>
            )}
          </GlassCard>

          {/* Strongest stage */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold font-display">Your Strongest Stage</h3>
            </div>
            {strength.status === 'ok' ? (
              <>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-base font-bold text-foreground">{strength.insight.label}</span>
                  <Badge variant="emerald">{strength.insight.confidence.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  Progression Rate: <span className="text-foreground font-medium">{Math.round(strength.insight.progressionRate * 100)}%</span>
                </p>
                <p className="text-xs text-muted-foreground">{strength.insight.supportingData}</p>
              </>
            ) : strength.status === 'no_strength' ? (
              <p className="text-sm text-muted-foreground">No stage has a clear progression rate yet.</p>
            ) : (
              <MoreDataNeeded>{STRENGTH_EMPTY_MESSAGE}</MoreDataNeeded>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Progress over time */}
      {trends.length > 0 && (
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h3 className="text-base font-semibold font-display">Progress Over Time</h3>
          </div>
          <div className="space-y-2">
            {trends.map(t => (
              <div key={t.category} className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'var(--muted-surface)' }}>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-foreground">{t.supportingData}</p>
                  <Badge variant="emerald" className="mt-1.5">{t.confidence.label}</Badge>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}
