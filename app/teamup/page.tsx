'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import { Users, UserSearch, Plus, AlertTriangle } from 'lucide-react'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { useAuth } from '@/components/auth/AuthProvider'
import { TeamCard } from '@/components/teamup/TeamCard'
import { TeamCardSkeleton } from '@/components/teamup/TeamCardSkeleton'
import { TeamFiltersBar } from '@/components/teamup/TeamFiltersBar'
import { CreateTeamModal } from '@/components/teamup/CreateTeamModal'
import { JoinRequestModal } from '@/components/teamup/JoinRequestModal'
import {
  getActiveTeams, getCompetitionTypes, getSkills, filterTeams,
  getMyMembershipTeamIds, getMyPendingRequestTeamIds, getTeamRelationship,
  type Team, type CompetitionType, type Skill, type TeamFilters,
} from '@/lib/teamup/api'

export default function TeamUpPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [teams, setTeams] = useState<Team[] | null>(null)
  const [types, setTypes] = useState<CompetitionType[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [filters, setFilters] = useState<TeamFilters>({})
  const [error, setError] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [joinTarget, setJoinTarget] = useState<Team | null>(null)
  const [myTeamIds, setMyTeamIds] = useState<Set<string>>(new Set())
  const [myPendingTeamIds, setMyPendingTeamIds] = useState<Set<string>>(new Set())

  const refresh = () => {
    setError(false)
    getActiveTeams().then(setTeams).catch(() => setError(true))
  }

  // One pair of bulk queries for the whole visible feed, rather than a
  // membership + pending-request check per card — keeps this an N+1-free
  // page regardless of how many teams are shown.
  const refreshRelationships = useCallback((teamList: Team[]) => {
    if (!user || teamList.length === 0) {
      setMyTeamIds(new Set())
      setMyPendingTeamIds(new Set())
      return
    }
    const teamIds = teamList.map(t => t.id)
    Promise.all([getMyMembershipTeamIds(user.id, teamIds), getMyPendingRequestTeamIds(user.id, teamIds)])
      .then(([members, pending]) => { setMyTeamIds(members); setMyPendingTeamIds(pending) })
      .catch(() => {})
  }, [user])

  useEffect(() => {
    refresh()
    Promise.all([getCompetitionTypes(), getSkills()])
      .then(([t, s]) => { setTypes(t); setSkills(s) })
      .catch(() => {})
  }, [])

  useEffect(() => { if (teams) refreshRelationships(teams) }, [teams, refreshRelationships])

  // TeamUp is publicly browsable, but every write action needs a signed-in
  // user — reuses the same login+redirect flow as every other protected
  // action in the app, rather than gating this whole page.
  const requireAuth = (action: () => void) => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent('/teamup')}`)
      return
    }
    action()
  }

  const filtered = teams ? filterTeams(teams, filters) : []

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-4">
            <Users className="w-3.5 h-3.5" />
            TeamUp
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-3 text-balance">
            Find the right people for your next competition.
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Build teams for case competitions, hackathons, ideathons, business challenges, coding competitions and more.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="gradient" size="lg" className="gap-2" onClick={() => requireAuth(() => setShowCreate(true))}>
              <Plus className="w-4 h-4" /> Find Teammates
            </Button>
            <a href="#feed">
              <Button variant="outline" size="lg">Find a Team</Button>
            </a>
          </div>
          <button
            onClick={() => requireAuth(() => setShowCreate(true))}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors mt-4"
          >
            + Create Team Request
          </button>
          <p className="text-xs text-muted-foreground mt-6">
            Looking to invite students directly?{' '}
            <Link href="/teamup/students" className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1">
              Browse students looking for a team <UserSearch className="w-3 h-3" />
            </Link>
          </p>
        </div>

        {/* Feed */}
        <div id="feed">
          <TeamFiltersBar types={types} skills={skills} filters={filters} onChange={setFilters} />

          {error ? (
            <GlassCard className="p-10 text-center">
              <AlertTriangle className="w-7 h-7 text-red-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Couldn&apos;t load active teams.</p>
              <Button variant="outline" onClick={refresh}>Try again</Button>
            </GlassCard>
          ) : teams === null ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <TeamCardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <GlassCard className="p-10 text-center">
              <Users className="w-7 h-7 text-indigo-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold font-display mb-2">
                {teams.length === 0 ? 'No teams are currently looking for members.' : 'No teams match your filters.'}
              </h3>
              <Button variant="gradient" className="gap-2 mt-2" onClick={() => requireAuth(() => setShowCreate(true))}>
                <Plus className="w-4 h-4" /> Create Team Request
              </Button>
            </GlassCard>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(team => {
                const relationship = getTeamRelationship({
                  team,
                  isCreator: !!user && team.createdBy === user.id,
                  isMember: myTeamIds.has(team.id),
                  hasPendingRequest: myPendingTeamIds.has(team.id),
                })
                return (
                  <TeamCard
                    key={team.id}
                    team={team}
                    relationship={relationship}
                    onRequestToJoin={() => requireAuth(() => setJoinTarget(team))}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />

      <AnimatePresence>
        {showCreate && user && (
          <CreateTeamModal userId={user.id} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); refresh() }} />
        )}
        {joinTarget && user && (
          <JoinRequestModal
            userId={user.id}
            team={joinTarget}
            onClose={() => setJoinTarget(null)}
            onSent={() => { setJoinTarget(null); if (teams) refreshRelationships(teams) }}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
