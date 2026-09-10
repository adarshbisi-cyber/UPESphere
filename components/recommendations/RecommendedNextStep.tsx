'use client'

// The bridge from "what happened" to "what should I do next". One card,
// used on the Placement Tracker dashboard and again inside Insights next to
// the weakness it came from, so the two can never disagree about what's
// being recommended.

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { practiceTypeLabel } from '@/lib/practiceTogether/constants'
import type { Recommendation } from '@/lib/recommendations/types'

const CONFIDENCE_BADGE: Record<Recommendation['confidence'], { label: string; variant: 'red' | 'amber' | 'indigo' }> = {
  ESTABLISHED: { label: 'Established Pattern', variant: 'red' },
  EMERGING: { label: 'Emerging Pattern', variant: 'amber' },
  LIMITED: { label: 'Early Signal', variant: 'indigo' },
}

/** Deep link into Practice Together with the right filter already applied. */
export function practiceHref(recommendation: Recommendation): string {
  return `/practice?practiceType=${recommendation.practiceType}`
}

export function RecommendedNextStep({
  recommendation,
  onDismiss,
  variant = 'card',
}: {
  recommendation: Recommendation
  onDismiss?: () => void
  /** 'card' stands alone on the dashboard; 'inline' sits under an insight. */
  variant?: 'card' | 'inline'
}) {
  const badge = CONFIDENCE_BADGE[recommendation.confidence]
  const practiceLabel = practiceTypeLabel(recommendation.practiceType)

  const body = (
    <>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
            {variant === 'card' ? 'Recommended Next Step' : 'What you can do next'}
          </span>
        </div>
        <Badge variant={badge.variant} className="shrink-0">{badge.label}</Badge>
      </div>

      <h3 className="text-base font-semibold font-display text-foreground mb-1.5">{recommendation.title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{recommendation.description}</p>

      {/* Buttons stack on a narrow screen rather than overflowing (§20). */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button asChild variant="gradient" size="sm" className="gap-1.5">
          <Link href={practiceHref(recommendation)}>
            Find {practiceLabel} Practice
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
        {onDismiss && (
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onDismiss}>
            Maybe Later
          </Button>
        )}
      </div>
    </>
  )

  if (variant === 'inline') {
    return (
      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--divider)' }}>{body}</div>
    )
  }
  return <GlassCard className="p-5">{body}</GlassCard>
}
