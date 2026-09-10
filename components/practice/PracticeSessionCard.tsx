'use client'

// One session in Discover / My Practice. The primary button is driven
// entirely by viewerStateFor, so a card can never offer an action the
// database would refuse — see lib/practiceTogether/session.ts.

import { Clock, MapPin, Users, Video } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { practiceTypeIcon, practiceTypeLabel } from '@/lib/practiceTogether/constants'
import { formatDuration, formatWhen, viewerStateFor } from '@/lib/practiceTogether/session'
import { getUniversity } from '@/lib/universities'
import type { JoinRequestStatus, PracticeSession } from '@/lib/practiceTogether/types'

const STATUS_BADGE: Record<string, { label: string; variant: 'emerald' | 'amber' | 'red' | 'secondary' }> = {
  open: { label: 'Open', variant: 'emerald' },
  full: { label: 'Full', variant: 'amber' },
  cancelled: { label: 'Cancelled', variant: 'red' },
  completed: { label: 'Completed', variant: 'secondary' },
}

export function PracticeSessionCard({
  session,
  viewerId,
  requestStatus,
  onView,
  onManage,
}: {
  session: PracticeSession
  viewerId: string | null
  requestStatus?: JoinRequestStatus | null
  onView: () => void
  onManage?: () => void
}) {
  const state = viewerStateFor(session, viewerId, requestStatus ?? null)
  const Icon = practiceTypeIcon(session.practiceType)
  const status = STATUS_BADGE[session.status] ?? STATUS_BADGE.open
  const hostName = session.creator?.fullName ?? 'A student'
  const hostCollege = session.creator?.universityId ? getUniversity(session.creator.universityId)?.shortName ?? null : null

  const relationshipNote =
    state.action === 'joined' ? "\u2713 You've joined this session"
    : state.action === 'pending' ? 'Your request is pending'
    : state.action === 'full' ? 'This session is full'
    : null
  const relationshipNoteClass =
    state.action === 'joined' ? 'text-emerald-600 dark:text-emerald-400'
    : state.action === 'pending' ? 'text-amber-600 dark:text-amber-400'
    : 'text-muted-foreground'

  return (
    <GlassCard className="p-5 flex flex-col transition-colors hover:border-indigo-500/30">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 truncate">
            {practiceTypeLabel(session.practiceType, session.customPracticeType)}
          </span>
        </div>
        <Badge variant={status.variant} className="shrink-0">{status.label}</Badge>
      </div>

      <h3 className="text-base font-semibold font-display text-foreground leading-snug mb-1">{session.title}</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Hosted by {hostName}{hostCollege ? ` · ${hostCollege}` : ''}
      </p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground mb-4">
        <span className="inline-flex items-center gap-1 text-foreground/80">{formatWhen(session)}</span>
        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(session.durationMinutes)}</span>
        <span className="inline-flex items-center gap-1">
          {session.mode === 'online' ? <><Video className="w-3 h-3" />Online</> : <><MapPin className="w-3 h-3" />{session.location || 'Offline'}</>}
        </span>
        {session.experienceLevel !== 'any' && (
          <span className="capitalize">{session.experienceLevel}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 mt-auto">
        <Users className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">{session.currentParticipants} / {session.maxParticipants}</span>
        Participants
      </div>

      {/* Exactly one primary action per card. The host's "Manage Session"
          opens the same modal "View Details" would have, with controls
          attached — so offering both was two routes to one screen. The
          participation action (request / withdraw / join) lives inside that
          modal rather than competing with the button that opens it. */}
      {state.canManage ? (
        <Button variant="gradient" size="sm" className="w-full" onClick={onManage ?? onView}>
          Manage Session
        </Button>
      ) : (
        <Button variant="gradient" size="sm" className="w-full" onClick={onView}>
          View Details
        </Button>
      )}

      {/* Relationship is information, not an action — it says where the
          viewer stands without needing them to open each card in turn. */}
      {relationshipNote && (
        <p className={`text-[11px] mt-2 text-center ${relationshipNoteClass}`}>{relationshipNote}</p>
      )}

    </GlassCard>
  )
}
