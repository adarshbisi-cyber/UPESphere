import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { ApplicationStatus, RoundOutcome } from '@/lib/placementTracker/types'

const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  active: 'Active', offer: 'Offer', rejected: 'Rejected', withdrawn: 'Withdrawn', closed: 'Closed',
}
const APPLICATION_STATUS_VARIANT: Record<ApplicationStatus, BadgeProps['variant']> = {
  active: 'indigo', offer: 'emerald', rejected: 'red', withdrawn: 'amber', closed: 'secondary',
}

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge variant={APPLICATION_STATUS_VARIANT[status]}>{APPLICATION_STATUS_LABEL[status]}</Badge>
}

const ROUND_OUTCOME_LABEL: Record<RoundOutcome, string> = {
  cleared: 'Cleared', eliminated: 'Eliminated', pending: 'Pending', upcoming: 'Upcoming', withdrawn: 'Withdrawn',
}
const ROUND_OUTCOME_VARIANT: Record<RoundOutcome, BadgeProps['variant']> = {
  cleared: 'emerald', eliminated: 'red', pending: 'indigo', upcoming: 'secondary', withdrawn: 'amber',
}

export function RoundOutcomeBadge({ outcome }: { outcome: RoundOutcome }) {
  return <Badge variant={ROUND_OUTCOME_VARIANT[outcome]}>{ROUND_OUTCOME_LABEL[outcome]}</Badge>
}
