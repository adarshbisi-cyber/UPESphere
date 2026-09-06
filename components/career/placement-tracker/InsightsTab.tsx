'use client'

import { Sparkles } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  computeRoundPerformance, computeConversionFunnel, computeBiggestBottleneck,
  computeStrongestStage, computeGroupPatterns, hasEnoughDataForInsights,
} from '@/lib/placementTracker/analytics'
import type { PlacementApplication } from '@/lib/placementTracker/types'

export function InsightsTab({ applications }: { applications: PlacementApplication[] }) {
  if (!hasEnoughDataForInsights(applications)) {
    return (
      <GlassCard className="p-10 text-center">
        <Sparkles className="w-7 h-7 text-indigo-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold font-display mb-2">Keep tracking your applications.</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          We need a few more completed recruitment journeys before meaningful patterns can be identified.
        </p>
      </GlassCard>
    )
  }

  const roundPerformance = computeRoundPerformance(applications)
  const conversionFunnel = computeConversionFunnel(applications)
  const bottleneck = computeBiggestBottleneck(applications)
  const strength = computeStrongestStage(applications)
  const groupPatterns = computeGroupPatterns(applications)

  return (
    <div className="space-y-4">
      {/* Section A — Round Performance */}
      <GlassCard className="p-5">
        <h3 className="text-base font-semibold font-display mb-4">Round Performance</h3>
        <div className="space-y-2">
          {roundPerformance.map(r => (
            <div key={r.category} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--muted-surface)' }}>
              <span className="text-sm text-foreground">{r.label}</span>
              <span className="text-xs text-muted-foreground">
                Reached: <span className="text-foreground font-medium">{r.reached}</span>
                <span className="mx-2">·</span>
                Eliminated: <span className="text-foreground font-medium">{r.eliminated}</span>
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Section B — Application Conversion */}
      <GlassCard className="p-5">
        <h3 className="text-base font-semibold font-display mb-4">Application Conversion</h3>
        <div className="flex flex-wrap items-center gap-2">
          {conversionFunnel.map((stage, i) => (
            <div key={stage.category} className="flex items-center gap-2">
              <div className="text-center px-3 py-2 rounded-xl" style={{ background: 'var(--muted-surface)' }}>
                <div className="text-lg font-bold font-display">{stage.count}</div>
                <div className="text-[10px] text-muted-foreground">{stage.label}</div>
              </div>
              {i < conversionFunnel.length - 1 && <span className="text-muted-foreground">→</span>}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Section C — Strongest and Weakest Areas */}
      <div className="grid sm:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold font-display mb-2">Biggest Drop-off</h3>
          {bottleneck ? (
            <>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base font-bold">{bottleneck.label}</span>
                <Badge variant="red">{bottleneck.confidence.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{bottleneck.supportingData}</p>
            </>
          ) : <p className="text-sm text-muted-foreground">No clear drop-off yet.</p>}
        </GlassCard>
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold font-display mb-2">Strongest Stage</h3>
          {strength ? (
            <>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base font-bold">{strength.label}</span>
                <Badge variant="emerald">{strength.confidence.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{strength.supportingData}</p>
            </>
          ) : <p className="text-sm text-muted-foreground">No standout stage yet.</p>}
        </GlassCard>
      </div>

      {/* Section D — Role / Industry Patterns */}
      {groupPatterns.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="text-base font-semibold font-display mb-3">Role / Industry Patterns</h3>
          <div className="space-y-2">
            {groupPatterns.map(p => (
              <div key={p.dimension} className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'var(--muted-surface)' }}>
                <div className="min-w-0">
                  <p className="text-xs text-foreground">{p.supportingData}</p>
                  <Badge variant="indigo" className="mt-1.5">{p.confidence.label}</Badge>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}
