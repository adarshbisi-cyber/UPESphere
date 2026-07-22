'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import {
  ExternalLink, Users, Calendar, AlertTriangle, CheckCircle2,
  Lock, RotateCcw, XCircle, Phone, Mail,
} from 'lucide-react'
import { Navbar } from '@/components/shared/Navbar'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/components/auth/AuthProvider'
import { useToast } from '@/components/ui/use-toast'
import { JoinRequestModal } from '@/components/teamup/JoinRequestModal'
import { JoinRequestsPanel } from '@/components/teamup/JoinRequestsPanel'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { describeSaveError } from '@/lib/onboarding/errors'
import {
  getTeam, getTeamMembers, getTeamJoinRequests, getMyPendingRequestForTeam, cancelJoinRequest,
  updateTeamStatus, getDeadlineStatus, isSafeHttpUrl, getTeamContacts, removeMember, getTeamRelationship,
  type Team, type TeamMember, type TeamJoinRequest, type TeamContact,
} from '@/lib/teamup/api'

export default function TeamDetailPage() {
  const params = useParams<{ teamId: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  // undefined = still loading, null = genuinely not found/error
  const [team, setTeam] = useState<Team | null | undefined>(undefined)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [joinRequests, setJoinRequests] = useState<TeamJoinRequest[]>([])
  const [myRequest, setMyRequest] = useState<TeamJoinRequest | null>(null)
  const [contacts, setContacts] = useState<TeamContact[]>([])
  const [loadError, setLoadError] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [statusBusy, setStatusBusy] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null)
  const [removingMember, setRemovingMember] = useState(false)

  const isCreator = !!(user && team && team.createdBy === user.id)
  const isMember = !!(user && members.some(m => m.userId === user.id))

  const refresh = useCallback(async () => {
    setLoadError(false)
    try {
      const t = await getTeam(params.teamId)
      setTeam(t)
      if (!t) return

      const memberRows = await getTeamMembers(t.id)
      setMembers(memberRows)

      if (user) {
        const isUserMember = memberRows.some(m => m.userId === user.id)
        // Membership is authoritative — an already-accepted member should
        // never have myRequest populated, even if a stale/stray pending row
        // exists (e.g. from joining via an invitation, which never touches
        // team_join_requests at all).
        if (t.createdBy === user.id) {
          setJoinRequests(await getTeamJoinRequests(t.id))
        } else if (!isUserMember) {
          setMyRequest(await getMyPendingRequestForTeam(user.id, t.id))
        } else {
          setMyRequest(null)
        }
        if (isUserMember) {
          getTeamContacts(t.id).then(setContacts).catch(() => {})
        }
      }
    } catch {
      setLoadError(true)
    }
  }, [params.teamId, user])

  useEffect(() => { refresh() }, [refresh])

  const requireAuth = (action: () => void) => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/teamup/${params.teamId}`)}`)
      return
    }
    action()
  }

  const handleCancelMyRequest = async () => {
    if (!myRequest) return
    try {
      await cancelJoinRequest(myRequest.id)
      toast({ title: 'Request cancelled' })
      refresh()
    } catch (err) {
      toast({ title: 'Could not cancel request', description: describeSaveError(err), variant: 'destructive' })
    }
  }

  const handleRemoveMember = async () => {
    if (!team || !removeTarget) return
    setRemovingMember(true)
    try {
      await removeMember(team.id, removeTarget.userId)
      toast({ title: `${removeTarget.profile?.fullName ?? 'Member'} removed from the team` })
      setRemoveTarget(null)
      refresh()
    } catch (err) {
      toast({ title: 'Could not remove member', description: describeSaveError(err), variant: 'destructive' })
    } finally {
      setRemovingMember(false)
    }
  }

  const handleStatusChange = async (status: 'open' | 'closed' | 'cancelled') => {
    if (!team) return
    setStatusBusy(true)
    try {
      await updateTeamStatus(team.id, status)
      toast({ title: status === 'open' ? 'Recruitment reopened' : status === 'closed' ? 'Recruitment paused' : 'Team cancelled' })
      refresh()
    } catch (err) {
      toast({ title: 'Could not update team', description: describeSaveError(err), variant: 'destructive' })
    } finally {
      setStatusBusy(false)
    }
  }

  if (team === undefined) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
          <GlassCard className="p-6 animate-pulse">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full shrink-0" />
            </div>
            <Skeleton className="h-4 w-40 mb-4" />
            <div className="space-y-1.5 mb-4">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-8 w-32" />
          </GlassCard>
          <GlassCard className="p-5 animate-pulse space-y-2">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </GlassCard>
        </div>
      </main>
    )
  }

  if (loadError || team === null) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="pt-24 pb-16 px-4 max-w-2xl mx-auto">
          <GlassCard className="p-10 text-center">
            <AlertTriangle className="w-7 h-7 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold font-display mb-4">{loadError ? "Couldn't load this team." : 'Team not found.'}</h3>
            <Link href="/teamup"><Button variant="outline">Back to TeamUp</Button></Link>
          </GlassCard>
        </div>
      </main>
    )
  }

  const deadline = getDeadlineStatus(team.registrationDeadline)
  const slotsOpen = team.maxMembers - team.currentMembers
  const safeUrl = team.competitionUrl && isSafeHttpUrl(team.competitionUrl) ? team.competitionUrl : null
  // Same shared relationship helper the feed's TeamCard uses, so the two
  // surfaces can never disagree about what this user can do with this team.
  const relationship = getTeamRelationship({
    team, isCreator, isMember, hasPendingRequest: myRequest?.status === 'pending',
  })
  const canApply = relationship === 'eligible'
  const revealedContacts = contacts.filter(c => c.whatsappNumber || c.email)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold font-display tracking-tight text-balance">{team.competitionName}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {team.competitionTypeName}{team.competitionPlatform ? ` · ${team.competitionPlatform}` : ''}
              </p>
            </div>
            {team.status === 'full' ? (
              <Badge variant="emerald" className="gap-1 shrink-0"><CheckCircle2 className="w-3 h-3" /> Team Complete</Badge>
            ) : team.status === 'closed' ? (
              <Badge variant="outline" className="gap-1 shrink-0"><Lock className="w-3 h-3" /> Recruitment Paused</Badge>
            ) : team.status === 'cancelled' ? (
              <Badge variant="red" className="gap-1 shrink-0"><XCircle className="w-3 h-3" /> Cancelled</Badge>
            ) : (
              <Badge variant={deadline.urgent ? 'red' : 'indigo'} className="shrink-0">{deadline.label}</Badge>
            )}
          </div>

          <div className="flex items-center gap-2 mb-4 text-sm">
            <Users className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="font-medium">{team.currentMembers}/{team.maxMembers} Members</span>
            {team.status === 'open' && (
              <span className="text-xs text-muted-foreground">· {slotsOpen} position{slotsOpen !== 1 ? 's' : ''} open</span>
            )}
          </div>

          <p className="text-sm text-foreground/90 mb-4">{team.description}</p>

          {team.additionalRequirements && (
            <p className="text-sm text-muted-foreground mb-4">
              <span className="font-medium text-foreground">Additional requirements: </span>{team.additionalRequirements}
            </p>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4">
            <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Deadline: {team.registrationDeadline}</span>
            {team.experiencePreference && <span>{team.experiencePreference}</span>}
          </div>

          {team.skills.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Looking For</p>
              <div className="flex flex-wrap gap-1.5">
                {team.skills.map(s => <Badge key={s.id} variant="violet">{s.name}</Badge>)}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {safeUrl && (
              <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5">
                  View Competition <ExternalLink className="w-3 h-3" />
                </Button>
              </a>
            )}

            {canApply && (
              <Button variant="gradient" size="sm" className="ml-auto" onClick={() => requireAuth(() => setShowJoinModal(true))}>
                Request to Join
              </Button>
            )}
            {/* Driven by the same relationship priority as canApply above —
                a member is never simultaneously shown as an applicant. */}
            {relationship === 'pending' && (
              <div className="ml-auto flex items-center gap-2">
                <Badge variant="amber">Request Pending</Badge>
                <Button variant="outline" size="sm" onClick={handleCancelMyRequest}>Cancel Request</Button>
              </div>
            )}
            {!isMember && myRequest?.status === 'rejected' && <Badge variant="red" className="ml-auto">Request Rejected</Badge>}
            {isMember && !isCreator && (
              <Badge variant="emerald" className="ml-auto gap-1"><CheckCircle2 className="w-3 h-3" /> You&apos;re a member</Badge>
            )}
          </div>
        </GlassCard>

        {/* Creator management */}
        {isCreator && (
          <GlassCard className="p-5">
            <h3 className="text-base font-semibold font-display mb-3">Manage Team</h3>
            <div className="flex flex-wrap gap-2">
              {team.status === 'open' && (
                <Button variant="outline" size="sm" disabled={statusBusy} onClick={() => handleStatusChange('closed')} className="gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Close Recruitment
                </Button>
              )}
              {team.status === 'closed' && slotsOpen > 0 && (
                <Button variant="outline" size="sm" disabled={statusBusy} onClick={() => handleStatusChange('open')} className="gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" /> Reopen Recruitment
                </Button>
              )}
              {team.status !== 'cancelled' && (
                <Button
                  variant="outline" size="sm" disabled={statusBusy}
                  className="text-red-400 border-red-500/25 hover:bg-red-500/10"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancel Team
                </Button>
              )}
            </div>
          </GlassCard>
        )}

        {isCreator && <JoinRequestsPanel requests={joinRequests} onChanged={refresh} />}

        {/* Members */}
        <GlassCard className="p-5">
          <h3 className="text-base font-semibold font-display mb-4">Team Members</h3>
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--muted-surface)' }}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {(m.profile?.fullName ?? '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {m.profile?.fullName ?? 'A student'}{m.role === 'creator' ? ' (Creator)' : ''}
                  </p>
                  {m.skills.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">{m.skills.slice(0, 3).map(s => s.name).join(' • ')}</p>
                  )}
                </div>
                {isCreator && m.role !== 'creator' && (
                  <Button
                    variant="ghost" size="sm" disabled={removingMember}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                    onClick={() => setRemoveTarget(m)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
          {slotsOpen > 0 && team.status === 'open' && (
            <p className="text-xs text-muted-foreground mt-3">{slotsOpen} position{slotsOpen !== 1 ? 's' : ''} open</p>
          )}
        </GlassCard>

        {/* Contacts — accepted members only, revealed per member's own consent */}
        {isMember && revealedContacts.length > 0 && (
          <GlassCard className="p-5">
            <h3 className="text-base font-semibold font-display mb-1">Teammate Contacts</h3>
            <p className="text-xs text-muted-foreground mb-4">Only shown for teammates who&apos;ve opted to share.</p>
            <div className="space-y-2">
              {revealedContacts.map(c => (
                <div key={c.userId} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm" style={{ background: 'var(--muted-surface)' }}>
                  <span className="font-medium truncate">{c.fullName}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    {c.whatsappNumber && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {c.whatsappNumber}</span>}
                    {c.email && <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>

      <AnimatePresence>
        {showJoinModal && user && team && (
          <JoinRequestModal
            userId={user.id}
            team={team}
            onClose={() => setShowJoinModal(false)}
            onSent={() => { setShowJoinModal(false); refresh() }}
          />
        )}
        {showCancelConfirm && (
          <ConfirmModal
            title="Cancel this team?"
            description="This stops all recruitment and cannot be undone."
            confirmLabel="Cancel Team"
            onConfirm={() => handleStatusChange('cancelled')}
            onClose={() => setShowCancelConfirm(false)}
          />
        )}
        {removeTarget && (
          <ConfirmModal
            title={`Remove ${removeTarget.profile?.fullName ?? 'this member'}?`}
            description={`Are you sure you want to remove ${removeTarget.profile?.fullName ?? 'this member'} from this team? They will lose access to the team and the position will become available again.`}
            confirmLabel="Remove Member"
            onConfirm={handleRemoveMember}
            onClose={() => setRemoveTarget(null)}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
