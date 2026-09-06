'use client'

import { TrendingUp, TrendingDown, Sparkles, ArrowRight } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ApplicationStatusBadge } from './StatusBadge'
import {
  computeOverview, computeActiveApplicationSummaries, computeFunnel,
  computeBiggestBottleneck, computeStrongestStage, computeTrends,
} from '@/lib/placementTracker/analytics'
import { currentRound } from '@/lib/placementTracker/status'
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
  const activeSummaries = computeActiveApplicationSummaries(applications)
  const funnel = computeFunnel(applications)
  const bottleneck = computeBiggestBottleneck(applications)
  const strength = computeStrongestStage(applications)
  const trends = computeTrends(applications)
  const maxFunnelCount = Math.max(1, ...funnel.map(f => f.count))

  return (
    <div className="space-y-6">
      {/* Section A — Placement Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Applications" value={overview.totalApplications} />
        <StatCard label="Active Applications" value={overview.activeApplications} />
        <StatCard label="Upcoming Rounds" value={overview.upcomingRounds} />
        <StatCard label="Offers Received" value={overview.offersReceived} />
      </div>

      {/* Section B — Active Applications */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold font-display">Active Applications</h3>
          <button onClick={onViewApplications} className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {activeSummaries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No active opportunities right now.</p>
        ) : (
          <div className="space-y-2">
            {activeSummaries.slice(0, 5).map(({ application, currentStage, nextRound }) => (
              <button
                key={application.id}
                onClick={() => onOpen(application.id)}
                className="w-full text-left flex items-center justify-between gap-3 p-3 rounded-xl transition-colors hover:border-indigo-500/30 border border-transparent"
                style={{ background: 'var(--muted-surface)' }}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{application.companyName}</div>
                  <div className="text-xs text-muted-foreground truncate">{application.role}</div>
                </div>
                <div className="text-xs text-right shrink-0">
                  {currentStage && <div className="text-foreground font-medium">{currentStage}</div>}
                  {nextRound?.scheduledDate && (
                    <div className="text-muted-foreground">{new Date(nextRound.scheduledDate).toLocaleDateString()}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </GlassCard>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Section C — Placement Funnel */}
        <GlassCard className="p-5">
          <h3 className="text-base font-semibold font-display mb-4">Placement Funnel</h3>
          {funnel.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Add recruitment rounds to see your funnel here.</p>
          ) : (
            <div className="space-y-2">
              {funnel.map(stage => (
                <div key={stage.category}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{stage.label}</span>
                    <span className="font-medium text-foreground">{stage.count}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      style={{ width: `${(stage.count / maxFunnelCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <div className="space-y-4">
          {/* Section D — Biggest Bottleneck */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold font-display">Your Biggest Drop-Off</h3>
            </div>
            {bottleneck ? (
              <>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base font-bold text-foreground">{bottleneck.label}</span>
                  <Badge variant="red">{bottleneck.confidence.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{bottleneck.supportingData}</p>
                <p className="text-xs text-foreground/80">{bottleneck.recommendation}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not enough data yet to spot a pattern here.</p>
            )}
          </GlassCard>

          {/* Section E — Strengths */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold font-display">Your Strongest Stage</h3>
            </div>
            {strength ? (
              <>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base font-bold text-foreground">{strength.label}</span>
                  <Badge variant="emerald">{strength.confidence.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{strength.supportingData}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not enough data yet to spot a pattern here.</p>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Section F — Progress Over Time */}
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
