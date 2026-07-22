'use client'

import Link from 'next/link'
import { ExternalLink, Users } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getDeadlineStatus, isSafeHttpUrl, type Team, type TeamRelationship } from '@/lib/teamup/api'

// `relationship` decides whether the Request-to-Join action shows at all —
// for creator/member/pending/unavailable it's simply omitted (no "You're a
// member" badge, no disabled button — see the TeamUp UX spec this follows).
export function TeamCard({
  team, relationship, onRequestToJoin,
}: {
  team: Team
  relationship: TeamRelationship
  onRequestToJoin: () => void
}) {
  const deadline = getDeadlineStatus(team.registrationDeadline)
  const slotsOpen = team.maxMembers - team.currentMembers
  const safeUrl = team.competitionUrl && isSafeHttpUrl(team.competitionUrl) ? team.competitionUrl : null

  return (
    <GlassCard className="p-5 flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold font-display truncate">{team.competitionName}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {team.competitionTypeName}{team.competitionPlatform ? ` · ${team.competitionPlatform}` : ''}
          </p>
        </div>
        <Badge variant={deadline.urgent ? 'red' : 'indigo'} className="shrink-0">{deadline.label}</Badge>
      </div>

      <div className="flex items-center gap-2 mb-3 text-sm">
        <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="font-medium">{team.currentMembers}/{team.maxMembers} Members</span>
        <span className="text-xs text-muted-foreground">· {slotsOpen} open</span>
      </div>

      {team.skills.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Looking For</p>
          <div className="flex flex-wrap gap-1.5">
            {team.skills.slice(0, 4).map(s => <Badge key={s.id} variant="violet">{s.name}</Badge>)}
            {team.skills.length > 4 && <Badge variant="outline">+{team.skills.length - 4}</Badge>}
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">{team.description}</p>

      <p className="text-xs text-muted-foreground mb-4">By {team.creator?.fullName ?? 'a UPESphere student'}</p>

      <div className="flex flex-wrap items-center gap-2">
        {safeUrl && (
          <a href={safeUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5">
              View Competition <ExternalLink className="w-3 h-3" />
            </Button>
          </a>
        )}
        <Link href={`/teamup/${team.id}`}>
          <Button variant="outline" size="sm">View Team</Button>
        </Link>
        {relationship === 'eligible' && (
          <Button variant="gradient" size="sm" className="ml-auto" onClick={onRequestToJoin}>
            Request to Join
          </Button>
        )}
      </div>
    </GlassCard>
  )
}
