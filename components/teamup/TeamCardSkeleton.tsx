import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Mirrors TeamCard's layout (header + badge, member count, skill chips,
// description, footer buttons) so the feed's loading state doesn't jump when
// real cards swap in.
export function TeamCardSkeleton() {
  return (
    <GlassCard className="p-5 flex flex-col h-full animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full shrink-0" />
      </div>
      <Skeleton className="h-4 w-32 mb-3" />
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="space-y-1.5 mb-3 flex-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <Skeleton className="h-3 w-28 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-24" />
      </div>
    </GlassCard>
  )
}
