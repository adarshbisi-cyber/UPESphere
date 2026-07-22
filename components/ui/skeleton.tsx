import { cn } from '@/lib/utils'

// A single placeholder block — compose several inside a parent with
// `animate-pulse` (matching this app's existing auth-loading convention in
// gradebook/dashboard/mine) so the whole group shimmers as one coherent unit
// rather than each block pulsing independently.
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('rounded-xl bg-white/5', className)} />
}
