'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertTriangle, Users, X, LayoutGrid } from 'lucide-react'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/components/auth/AuthProvider'
import { JoinRequestsPanel } from '@/components/teamup/JoinRequestsPanel'
import { SkillPicker } from '@/components/teamup/SkillPicker'
import { describeSaveError } from '@/lib/onboarding/errors'
import { cn } from '@/lib/utils'
import {
  getMyTeams, getMyJoinRequests, getTeamJoinRequests, cancelJoinRequest,
  getMyInvitations, acceptInvitation, declineInvitation,
  getCompetitionProfile, upsertCompetitionProfile, getUserSkills, setUserSkills,
  getUserCompetitionInterests, setUserCompetitionInterests, getCompetitionTypes, getSkills,
  type Team, type TeamJoinRequest, type TeamInvitation, type InvitationStatus,
  type CompetitionType, type Skill, type ExperienceLevel,
} from '@/lib/teamup/api'

const EXPERIENCE_OPTIONS: ExperienceLevel[] = ['Beginner', 'Some Experience', 'Experienced']

const selectClass = 'w-full h-10 rounded-xl border px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50'
const selectStyle = { borderColor: 'var(--divider)', background: 'var(--muted-surface)' } as const
const textareaClass = 'w-full rounded-xl border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 resize-none'

const TEAM_STATUS_BADGE: Record<Team['status'], { label: string; variant: 'emerald' | 'indigo' | 'outline' | 'red' }> = {
  open: { label: 'Open', variant: 'emerald' },
  full: { label: 'Full', variant: 'indigo' },
  closed: { label: 'Closed', variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'red' },
}

const REQUEST_STATUS_BADGE: Record<TeamJoinRequest['status'], { label: string; variant: 'amber' | 'emerald' | 'red' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'amber' },
  accepted: { label: 'Accepted', variant: 'emerald' },
  rejected: { label: 'Rejected', variant: 'red' },
  cancelled: { label: 'Cancelled', variant: 'outline' },
}

const INVITATION_STATUS_BADGE: Record<InvitationStatus, { label: string; variant: 'amber' | 'emerald' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'amber' },
  accepted: { label: 'Accepted', variant: 'emerald' },
  declined: { label: 'Declined', variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'outline' },
}

// Shared row-shaped placeholder for the four list tabs (My Teams,
// Applications, Requests, Invitations) — all four render a similar
// title+badge row while loading, so one skeleton covers them.
function MineListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <GlassCard key={i} className="p-4 flex items-center justify-between gap-3">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
          <Skeleton className="h-8 w-20 shrink-0" />
        </GlassCard>
      ))}
    </div>
  )
}

export default function MyTeamUpPage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [myTeams, setMyTeams] = useState<Team[] | null>(null)
  const [myApplications, setMyApplications] = useState<TeamJoinRequest[] | null>(null)
  const [requestsByTeam, setRequestsByTeam] = useState<Record<string, TeamJoinRequest[]> | null>(null)
  const [myInvitations, setMyInvitations] = useState<TeamInvitation[] | null>(null)
  const [invitationBusyId, setInvitationBusyId] = useState<string | null>(null)
  const [error, setError] = useState(false)

  const [types, setTypes] = useState<CompetitionType[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [lookingForTeam, setLookingForTeam] = useState(false)
  const [availability, setAvailability] = useState('')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | ''>('')
  const [competitionsCompleted, setCompetitionsCompleted] = useState(0)
  const [bio, setBio] = useState('')
  const [shareWhatsapp, setShareWhatsapp] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [shareEmail, setShareEmail] = useState(false)
  const [profileSkillIds, setProfileSkillIds] = useState<string[]>([])
  const [profileInterestIds, setProfileInterestIds] = useState<string[]>([])
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')

  const refreshJoinRequests = useCallback((teams: Team[], uid: string) => {
    const owned = teams.filter(t => t.createdBy === uid)
    if (owned.length === 0) { setRequestsByTeam({}); return }
    Promise.all(owned.map(t => getTeamJoinRequests(t.id).then(r => [t.id, r] as const)))
      .then(entries => setRequestsByTeam(Object.fromEntries(entries)))
      .catch(() => setError(true))
  }, [])

  const refreshTeams = useCallback(() => {
    if (!user) return
    getMyTeams(user.id)
      .then(teams => { setMyTeams(teams); refreshJoinRequests(teams, user.id) })
      .catch(() => setError(true))
  }, [user, refreshJoinRequests])

  const refreshApplications = useCallback(() => {
    if (!user) return
    getMyJoinRequests(user.id).then(setMyApplications).catch(() => setError(true))
  }, [user])

  const refreshInvitations = useCallback(() => {
    if (!user) return
    getMyInvitations(user.id).then(setMyInvitations).catch(() => setError(true))
  }, [user])

  useEffect(() => { refreshTeams() }, [refreshTeams])
  useEffect(() => { refreshApplications() }, [refreshApplications])
  useEffect(() => { refreshInvitations() }, [refreshInvitations])

  useEffect(() => {
    if (!user) return
    Promise.all([
      getCompetitionProfile(user.id), getUserSkills(user.id), getUserCompetitionInterests(user.id),
      getCompetitionTypes(), getSkills(),
    ])
      .then(([p, sk, interests, allTypes, allSkills]) => {
        setTypes(allTypes)
        setSkills(allSkills)
        if (p) {
          setLookingForTeam(p.lookingForTeam)
          setAvailability(p.availability ?? '')
          setExperienceLevel(p.experienceLevel ?? '')
          setCompetitionsCompleted(p.competitionsCompleted)
          setBio(p.bio ?? '')
          setShareWhatsapp(p.shareWhatsappWithTeammates)
          setWhatsappNumber(p.whatsappNumber ?? '')
          setShareEmail(p.shareEmailWithTeammates)
        }
        setProfileSkillIds(sk.map(s => s.id))
        setProfileInterestIds(interests.map(i => i.id))
        setProfileLoaded(true)
      })
      .catch(() => setProfileError('Could not load your competition profile.'))
  }, [user])

  const handleCancelApplication = async (id: string) => {
    try {
      await cancelJoinRequest(id)
      toast({ title: 'Application cancelled' })
      refreshApplications()
    } catch (err) {
      toast({ title: 'Could not cancel', description: describeSaveError(err), variant: 'destructive' })
    }
  }

  const handleInvitationAction = async (id: string, action: 'accept' | 'decline') => {
    setInvitationBusyId(id)
    try {
      if (action === 'accept') {
        await acceptInvitation(id)
        refreshTeams()
      } else {
        await declineInvitation(id)
      }
      toast({ title: action === 'accept' ? 'Invitation accepted' : 'Invitation declined' })
      refreshInvitations()
    } catch (err) {
      toast({ title: 'Could not update invitation', description: describeSaveError(err), variant: 'destructive' })
    } finally {
      setInvitationBusyId(null)
    }
  }

  const refreshOneTeamRequests = (teamId: string) => {
    getTeamJoinRequests(teamId).then(r => setRequestsByTeam(prev => ({ ...(prev ?? {}), [teamId]: r })))
    if (user) getMyTeams(user.id).then(setMyTeams)
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setSavingProfile(true)
    setProfileError('')
    try {
      await upsertCompetitionProfile(user.id, {
        lookingForTeam,
        availability: availability.trim() || undefined,
        experienceLevel: experienceLevel || undefined,
        competitionsCompleted,
        bio: bio.trim() || undefined,
        shareWhatsappWithTeammates: shareWhatsapp,
        whatsappNumber: shareWhatsapp ? whatsappNumber.trim() || undefined : undefined,
        shareEmailWithTeammates: shareEmail,
      })
      await Promise.all([
        setUserSkills(user.id, profileSkillIds),
        setUserCompetitionInterests(user.id, profileInterestIds),
      ])
      toast({ title: 'Profile updated', description: lookingForTeam ? 'You now appear in student discovery.' : 'Saved.' })
    } catch (err) {
      setProfileError(describeSaveError(err))
    } finally {
      setSavingProfile(false)
    }
  }

  const loading = authLoading || (!!user && myTeams === null && !error)

  if (!user) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        {loading && (
          <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-64 rounded-xl bg-white/5" />
              <div className="h-6 w-96 rounded-xl bg-white/5" />
            </div>
          </div>
        )}
      </main>
    )
  }

  const ownedTeams = (myTeams ?? []).filter(t => t.createdBy === user.id)
  const teamsWithPending = ownedTeams.filter(t => (requestsByTeam?.[t.id] ?? []).some(r => r.status === 'pending'))
  const pendingInvitations = (myInvitations ?? []).filter(i => i.status === 'pending')
  const toggleProfileInterest = (id: string) => {
    setProfileInterestIds(cur => cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id])
  }

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-3">
            <LayoutGrid className="w-3.5 h-3.5" />
            My TeamUp
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight mb-2">Your Teams &amp; Applications</h1>
          <p className="text-muted-foreground">Manage the teams you&apos;ve created, track your applications, and control your visibility to other teams.</p>
        </div>

        {error ? (
          <GlassCard className="p-10 text-center">
            <AlertTriangle className="w-7 h-7 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Something went wrong loading your TeamUp data.</p>
            <Button variant="outline" onClick={() => { setError(false); refreshTeams(); refreshApplications() }}>Try again</Button>
          </GlassCard>
        ) : (
          <Tabs defaultValue="teams">
            <TabsList className="flex-wrap h-auto sm:h-11">
              <TabsTrigger value="teams">My Teams</TabsTrigger>
              <TabsTrigger value="applications">My Applications</TabsTrigger>
              <TabsTrigger value="requests">
                Join Requests{teamsWithPending.length > 0 ? ` (${teamsWithPending.reduce((n, t) => n + (requestsByTeam?.[t.id]?.filter(r => r.status === 'pending').length ?? 0), 0)})` : ''}
              </TabsTrigger>
              <TabsTrigger value="invitations">
                Invitations{pendingInvitations.length > 0 ? ` (${pendingInvitations.length})` : ''}
              </TabsTrigger>
              <TabsTrigger value="profile">My Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="teams">
              {myTeams === null ? (
                <MineListSkeleton />
              ) : myTeams.length === 0 ? (
                <GlassCard className="p-10 text-center">
                  <Users className="w-7 h-7 text-indigo-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold font-display mb-2">You&apos;re not part of any teams yet.</h3>
                  <p className="text-sm text-muted-foreground mb-4">Create a team request or apply to join one from the TeamUp feed.</p>
                  <Link href="/teamup"><Button variant="gradient">Browse TeamUp</Button></Link>
                </GlassCard>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {myTeams.map(t => {
                    const badge = TEAM_STATUS_BADGE[t.status]
                    const isCreator = t.createdBy === user.id
                    return (
                      <GlassCard key={t.id} className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-semibold font-display truncate">{t.competitionName}</h3>
                          <Badge variant={badge.variant} className="shrink-0">{badge.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          {t.currentMembers}/{t.maxMembers} members · {isCreator ? 'Creator' : 'Member'}
                        </p>
                        <Link href={`/teamup/${t.id}`}>
                          <Button variant="outline" size="sm">{isCreator ? 'Manage Team' : 'View Team'}</Button>
                        </Link>
                      </GlassCard>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="applications">
              {myApplications === null ? (
                <MineListSkeleton />
              ) : myApplications.length === 0 ? (
                <GlassCard className="p-10 text-center">
                  <Users className="w-7 h-7 text-indigo-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold font-display mb-2">You haven&apos;t applied to any teams yet.</h3>
                  <Link href="/teamup"><Button variant="gradient">Find a Team</Button></Link>
                </GlassCard>
              ) : (
                <div className="space-y-3">
                  {myApplications.map(r => {
                    const badge = REQUEST_STATUS_BADGE[r.status]
                    return (
                      <GlassCard key={r.id} className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.team?.competitionName ?? 'A team'}</p>
                          <Badge variant={badge.variant} className="mt-1">{badge.label}</Badge>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link href={`/teamup/${r.teamId}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                          {r.status === 'pending' && (
                            <Button variant="ghost" size="sm" className="gap-1 text-red-400" onClick={() => handleCancelApplication(r.id)}>
                              <X className="w-3.5 h-3.5" /> Cancel
                            </Button>
                          )}
                        </div>
                      </GlassCard>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests">
              {requestsByTeam === null ? (
                <MineListSkeleton rows={2} />
              ) : teamsWithPending.length === 0 ? (
                <GlassCard className="p-10 text-center">
                  <Users className="w-7 h-7 text-indigo-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold font-display mb-2">No pending join requests.</h3>
                  <p className="text-sm text-muted-foreground">Requests to join your teams will show up here.</p>
                </GlassCard>
              ) : (
                <div className="space-y-4">
                  {teamsWithPending.map(t => (
                    <div key={t.id}>
                      <p className="text-xs font-medium text-muted-foreground mb-2">{t.competitionName}</p>
                      <JoinRequestsPanel requests={requestsByTeam?.[t.id] ?? []} onChanged={() => refreshOneTeamRequests(t.id)} />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="invitations">
              {myInvitations === null ? (
                <MineListSkeleton />
              ) : myInvitations.length === 0 ? (
                <GlassCard className="p-10 text-center">
                  <Users className="w-7 h-7 text-indigo-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold font-display mb-2">No invitations yet.</h3>
                  <p className="text-sm text-muted-foreground">When a team creator invites you directly, it&apos;ll show up here.</p>
                </GlassCard>
              ) : (
                <div className="space-y-3">
                  {myInvitations.map(inv => {
                    const badge = INVITATION_STATUS_BADGE[inv.status]
                    const busy = invitationBusyId === inv.id
                    return (
                      <GlassCard key={inv.id} className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{inv.team?.competitionName ?? 'A team'}</p>
                          <Badge variant={badge.variant} className="mt-1">{badge.label}</Badge>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {inv.status === 'pending' ? (
                            <>
                              <Button size="sm" variant="gradient" disabled={busy} onClick={() => handleInvitationAction(inv.id, 'accept')} className="gap-1.5">
                                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Accept'}
                              </Button>
                              <Button size="sm" variant="outline" disabled={busy} onClick={() => handleInvitationAction(inv.id, 'decline')}>
                                Decline
                              </Button>
                            </>
                          ) : (
                            <Link href={`/teamup/${inv.teamId}`}>
                              <Button variant="outline" size="sm">View</Button>
                            </Link>
                          )}
                        </div>
                      </GlassCard>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="profile">
              <GlassCard className="p-5">
                <div className="flex items-center justify-between gap-3 mb-5 pb-5" style={{ borderBottom: '1px solid var(--divider)' }}>
                  <div>
                    <h3 className="text-base font-semibold font-display">Looking for a Team</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Turn this on to appear in team creators&apos; student discovery.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={lookingForTeam}
                    onClick={() => setLookingForTeam(v => !v)}
                    className={cn(
                      'relative h-6 w-11 rounded-full transition-colors shrink-0',
                      lookingForTeam ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-white/10',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                        lookingForTeam && 'translate-x-5',
                      )}
                    />
                  </button>
                </div>

                {!profileLoaded ? (
                  <div className="animate-pulse space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1.5 block">Availability</Label>
                        <Input value={availability} onChange={e => setAvailability(e.target.value)} placeholder="Weekends, evenings..." />
                      </div>
                      <div>
                        <Label className="mb-1.5 block">Experience Level</Label>
                        <select value={experienceLevel} onChange={e => setExperienceLevel(e.target.value as ExperienceLevel)} className={selectClass} style={selectStyle}>
                          <option value="">Not specified</option>
                          {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-1.5 block">Competitions Completed</Label>
                      <input
                        type="number" min={0} value={competitionsCompleted}
                        onChange={e => setCompetitionsCompleted(Math.max(0, Number(e.target.value)))}
                        className={cn(selectClass, 'max-w-[140px]')} style={selectStyle}
                      />
                    </div>

                    <div>
                      <Label className="mb-1.5 block text-muted-foreground/70">Bio <span className="text-muted-foreground/50">(optional)</span></Label>
                      <textarea
                        value={bio} onChange={e => setBio(e.target.value)} rows={2}
                        placeholder="A short line about what you're good at and what you're looking for."
                        className={textareaClass} style={selectStyle}
                      />
                    </div>

                    <div>
                      <Label className="mb-1.5 block">Competition Interests</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {types.map(t => {
                          const active = profileInterestIds.includes(t.id)
                          return (
                            <button
                              key={t.id} type="button" onClick={() => toggleProfileInterest(t.id)}
                              className={cn(
                                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                                active ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' : 'border-white/10 text-muted-foreground hover:text-foreground hover:border-white/25',
                              )}
                            >
                              {t.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <Label className="mb-1.5 block">Skills</Label>
                      <SkillPicker
                        skills={skills}
                        selected={profileSkillIds}
                        onChange={setProfileSkillIds}
                        userId={user.id}
                        onSkillCreated={skill => setSkills(prev => [...prev, skill])}
                      />
                    </div>

                    <div className="rounded-xl p-3.5 space-y-2.5" style={{ background: 'var(--muted-surface)' }}>
                      <p className="text-xs font-medium text-muted-foreground">Contact sharing — only revealed to accepted teammates</p>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={shareEmail} onChange={e => setShareEmail(e.target.checked)} className="accent-indigo-500" />
                        Share my email with accepted teammates
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={shareWhatsapp} onChange={e => setShareWhatsapp(e.target.checked)} className="accent-indigo-500" />
                        Share my WhatsApp with accepted teammates
                      </label>
                      {shareWhatsapp && (
                        <Input
                          value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)}
                          placeholder="WhatsApp number" className="mt-1"
                        />
                      )}
                    </div>

                    {profileError && (
                      <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 dark:text-red-300">{profileError}</p>
                      </div>
                    )}

                    <Button variant="gradient" className="gap-2" disabled={savingProfile} onClick={handleSaveProfile}>
                      {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile'}
                    </Button>
                  </div>
                )}
              </GlassCard>
            </TabsContent>
          </Tabs>
        )}
      </div>
      <Footer />
    </main>
  )
}
