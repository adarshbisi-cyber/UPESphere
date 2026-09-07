'use client'

// Insights = the deep-analysis tab. Everything here is computed from the
// same application array the other two tabs render, so no number on this
// page can disagree with the dashboard.

import { Sparkles, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  computeRoundPerformance, computeApplicationFunnel, computeConversionSteps,
  computeStageInsights, computeGroupPatterns, computePlacementPattern,
  computeObservations, hasEnoughDataForInsights,
  DROPOFF_EMPTY_MESSAGE, STRENGTH_EMPTY_MESSAGE,
} from '@/lib/placementTracker/analytics'
import type { Confidence } from '@/lib/placementTracker/analytics'
import type { PlacementApplication } from '@/lib/placementTracker/types'

const NOT_ENOUGH = 'More data needed'

function PatternField({ label, value, confidence }: { label: string; value: string | null; confidence?: Confidence }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground mb-0.5">{label}</div>
      <div className={`text-sm font-semibold ${value ? 'text-foreground' : 'text-muted-foreground/70 font-normal'}`}>
        {value ?? NOT_ENOUGH}
      </div>
      {value && confidence && (
        <Badge variant={confidence.level === 'established' ? 'emerald' : 'indigo'} className="mt-1">
          {confidence.label}
        </Badge>
      )}
    </div>
  )
}

function InsufficientCard({ message }: { message: string }) {
  return (
    <>
      <p className="text-sm font-medium text-foreground/80 mb-1">{NOT_ENOUGH}</p>
      <p className="text-xs text-muted-foreground">{message}</p>
    </>
  )
}

// Progression is good, elimination is bad — colour the bar accordingly so
// strengths and weaknesses are separable at a glance rather than needing
// the numbers read.
function rateTone(rate: number, qualifies = true): { bar: string; text: string } {
  // A percentage from one or two applications gets a deliberately neutral
  // treatment: colouring it green or red would imply a verdict the sample
  // size can't support.
  if (!qualifies) return { bar: 'from-slate-500 to-slate-400', text: 'text-muted-foreground' }
  if (rate >= 0.7) return { bar: 'from-emerald-500 to-emerald-400', text: 'text-emerald-500 dark:text-emerald-400' }
  if (rate >= 0.4) return { bar: 'from-amber-500 to-amber-400', text: 'text-amber-600 dark:text-amber-400' }
  return { bar: 'from-red-500 to-red-400', text: 'text-red-500 dark:text-red-400' }
}

export function InsightsTab({ applications }: { applications: PlacementApplication[] }) {
  if (!hasEnoughDataForInsights(applications)) {
    return (
      <GlassCard className="p-10 text-center">
        <Sparkles className="w-7 h-7 text-indigo-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold font-display mb-2">We&rsquo;re still learning about your placement journey.</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Track more applications and update your recruitment progress to unlock meaningful insights.
        </p>
      </GlassCard>
    )
  }

  const pattern = computePlacementPattern(applications)
  const observations = computeObservations(applications)
  const roundPerformance = computeRoundPerformance(applications)
  const funnel = computeApplicationFunnel(applications)
  const conversionSteps = computeConversionSteps(applications)
  const { bottleneck, strength } = computeStageInsights(applications)
  const groupPatterns = computeGroupPatterns(applications)

  return (
    <div className="space-y-4">
      {/* Your Placement Pattern — at a glance */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <h3 className="text-base font-semibold font-display">Your Placement Pattern</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <PatternField label="Applications tracked" value={String(pattern.applicationsTracked)} />
          <PatternField
            label="Most common exit point"
            value={pattern.mostCommonExitPoint?.label ?? null}
            confidence={pattern.mostCommonExitPoint?.confidence}
          />
          <PatternField
            label="Strongest stage"
            value={pattern.strongestStage?.label ?? null}
            confidence={pattern.strongestStage?.confidence}
          />
          <PatternField
            label="Interview conversion"
            value={pattern.interviewConversion === null
              ? null
              : `${Math.round(pattern.interviewConversion.rate * 100)}% (${pattern.interviewConversion.cleared} of ${pattern.interviewConversion.reached})`}
          />
        </div>
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--divider)' }}>
          <div className="text-[11px] text-muted-foreground mb-0.5">Current focus</div>
          <p className="text-sm text-foreground">{pattern.currentFocus}</p>
        </div>
      </GlassCard>

      {/* Observations */}
      {observations.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="text-base font-semibold font-display mb-3">What we&rsquo;re seeing</h3>
          <div className="space-y-2">
            {observations.map(o => {
              const Icon = o.tone === 'positive' ? TrendingUp : o.tone === 'concern' ? TrendingDown : Minus
              const iconClass = o.tone === 'positive' ? 'text-emerald-400' : o.tone === 'concern' ? 'text-red-400' : 'text-muted-foreground'
              return (
                <div key={o.id} className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'var(--muted-surface)' }}>
                  <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${iconClass}`} />
                  <div className="min-w-0">
                    <p className="text-xs text-foreground">{o.text}</p>
                    <Badge variant={o.tone === 'positive' ? 'emerald' : o.tone === 'concern' ? 'red' : 'indigo'} className="mt-1.5">
                      {o.confidence.label}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>
      )}

      {/* Round Performance */}
      <GlassCard className="p-5">
        <h3 className="text-base font-semibold font-display mb-4">Round Performance</h3>
        <div className="space-y-4">
          {roundPerformance.map(r => {
            const tone = rateTone(r.progressionRate, r.confidence.qualifies)
            return (
              <div key={r.category}>
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <span className="text-sm font-medium text-foreground inline-flex items-center gap-2 flex-wrap">
                    {r.label}
                    {/* "Limited Data" stays deliberately colourless — a
                        green or red badge here would imply the verdict the
                        sample size can't support. */}
                    <Badge
                      variant={r.confidence.level === 'established' ? 'emerald' : r.confidence.level === 'emerging' ? 'indigo' : 'outline'}
                      className={r.confidence.qualifies ? '' : 'text-muted-foreground border-muted-foreground/30'}
                    >
                      {r.confidence.label}
                    </Badge>
                  </span>
                  <span className={`text-sm font-semibold ${tone.text}`}>{Math.round(r.progressionRate * 100)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ background: 'var(--divider)' }}>
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${tone.bar} transition-[width] duration-500`}
                    style={{ width: `${r.progressionRate * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
                  <span>Reached: <span className="text-foreground font-medium">{r.reached}</span></span>
                  <span>Progressed: <span className="text-foreground font-medium">{r.progressed}</span></span>
                  <span>Eliminated: <span className="text-foreground font-medium">{r.eliminated}</span></span>
                </div>
              </div>
            )
          })}
        </div>
      </GlassCard>

      {/* Application Conversion */}
      <GlassCard className="p-5">
        <h3 className="text-base font-semibold font-display mb-4">Application Conversion</h3>
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {funnel.map((stage, i) => (
            <div key={stage.key} className="flex items-center gap-2">
              <div className="text-center px-3 py-2 rounded-xl min-w-[5rem]" style={{ background: 'var(--muted-surface)' }}>
                <div className="text-lg font-bold font-display">{stage.count}</div>
                <div className="text-[10px] text-muted-foreground">{stage.label}</div>
              </div>
              {i < funnel.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" aria-hidden="true" />}
            </div>
          ))}
        </div>
        {!funnel.some(st => st.key === 'interview') && (
          <p className="text-xs text-muted-foreground mb-4">
            No interview data yet — conversion beyond this point will appear once an application reaches an interview.
          </p>
        )}
        {conversionSteps.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-2">
            {conversionSteps.map(step => (
              <div key={`${step.fromLabel}-${step.toLabel}`} className="flex items-center justify-between gap-2 p-2.5 rounded-xl" style={{ background: 'var(--muted-surface)' }}>
                <span className="text-[11px] text-muted-foreground truncate">
                  {step.fromLabel} <span aria-hidden="true">&rarr;</span> {step.toLabel}
                </span>
                <span className="text-xs font-semibold shrink-0 text-foreground">
                  {(step.rate * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Strongest and weakest areas */}
      <div className="grid sm:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold font-display mb-2">Biggest Drop-off</h3>
          {bottleneck.status === 'ok' ? (
            <>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-base font-bold">{bottleneck.insight.label}</span>
                <Badge variant="red">{bottleneck.insight.confidence.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{bottleneck.insight.supportingData}</p>
            </>
          ) : bottleneck.status === 'no_dropoff' ? (
            <p className="text-sm text-muted-foreground">You haven&rsquo;t been eliminated at any stage yet.</p>
          ) : (
            <InsufficientCard message={DROPOFF_EMPTY_MESSAGE} />
          )}
        </GlassCard>
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold font-display mb-2">Strongest Stage</h3>
          {strength.status === 'ok' ? (
            <>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-base font-bold">{strength.insight.label}</span>
                <Badge variant="emerald">{strength.insight.confidence.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Progression Rate: <span className="text-foreground font-medium">{Math.round(strength.insight.progressionRate * 100)}%</span>
              </p>
              <p className="text-xs text-muted-foreground">{strength.insight.supportingData}</p>
            </>
          ) : strength.status === 'no_strength' ? (
            <p className="text-sm text-muted-foreground">No stage has a clear progression rate yet.</p>
          ) : (
            <InsufficientCard message={STRENGTH_EMPTY_MESSAGE} />
          )}
        </GlassCard>
      </div>

      {/* Role / industry patterns */}
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
