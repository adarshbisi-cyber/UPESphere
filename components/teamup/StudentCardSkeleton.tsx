import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Mirrors StudentCard's layout (avatar + name, interest/skill chip rows, bio,
// footer button) so the discovery page's loading state doesn't jump when
// real cards swap in.
export function StudentCardSkeleton() {
  return (
    <GlassCard className="p-5 flex flex-col h-full animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <div className="space-y-1.5 mb-3 flex-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <Skeleton className="h-3 w-24 mb-4" />
      <Skeleton className="h-8 w-full" />
    </GlassCard>
  )
}
