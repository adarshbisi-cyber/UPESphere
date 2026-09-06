import { ExternalLink } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RESOURCE_TYPE_META } from '@/lib/careerResources/constants'
import type { CareerResource } from '@/lib/careerResources/types'

export function ResourceCard({ resource }: { resource: CareerResource }) {
  const meta = RESOURCE_TYPE_META[resource.resourceType]
  const Icon = meta.icon
  const actionLabel = resource.actionLabel || meta.defaultActionLabel

  return (
    <GlassCard className="p-5 flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5">
      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 shrink-0">
        <Icon className="w-5 h-5" />
      </div>

      <h3 className="text-base font-semibold font-display text-foreground mb-1.5 leading-snug">{resource.title}</h3>

      {resource.description && (
        <p className="text-sm text-muted-foreground mb-3 leading-relaxed flex-1">{resource.description}</p>
      )}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 flex-wrap">
        <Badge variant="indigo" className="text-[10px] px-2 py-0">{meta.label}</Badge>
        <span aria-hidden="true">•</span>
        <span>{resource.category}</span>
      </div>

      {resource.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {resource.tags.map(tag => (
            <span
              key={tag}
              className="text-[11px] text-muted-foreground px-2 py-0.5 rounded-full"
              style={{ background: 'var(--muted-surface)' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <Button asChild variant="gradient-outline" size="sm" className="gap-1.5 mt-auto w-full">
        <a href={resource.externalUrl} target="_blank" rel="noopener noreferrer">
          {actionLabel}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </Button>
    </GlassCard>
  )
}
