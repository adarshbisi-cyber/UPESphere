'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { UserSearch, AlertTriangle, SlidersHorizontal } from 'lucide-react'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { useAuth } from '@/components/auth/AuthProvider'
import { StudentCard } from '@/components/teamup/StudentCard'
import { StudentCardSkeleton } from '@/components/teamup/StudentCardSkeleton'
import { InviteToTeamModal } from '@/components/teamup/InviteToTeamModal'
import { SkillFilterChips } from '@/components/teamup/SkillFilterChips'
import {
  getStudentsLookingForTeam, getCompetitionTypes, getSkills, filterStudents,
  type LookingForTeamStudent, type CompetitionType, type Skill, type StudentFilters,
} from '@/lib/teamup/api'

const selectClass =
  'h-10 rounded-xl border px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50'
const selectStyle = { borderColor: 'var(--divider)', background: 'var(--muted-surface)' } as const

export default function TeamUpStudentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<LookingForTeamStudent[] | null>(null)
  const [types, setTypes] = useState<CompetitionType[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [filters, setFilters] = useState<StudentFilters>({})
  const [error, setError] = useState(false)
  const [inviteTarget, setInviteTarget] = useState<LookingForTeamStudent | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const refresh = () => {
    setError(false)
    getStudentsLookingForTeam().then(setStudents).catch(() => setError(true))
  }

  useEffect(() => {
    refresh()
    Promise.all([getCompetitionTypes(), getSkills()])
      .then(([t, s]) => { setTypes(t); setSkills(s) })
      .catch(() => {})
  }, [])

  const filtered = students ? filterStudents(students, filters) : []
  const activeCount = (filters.competitionTypeId ? 1 : 0) + (filters.skillIds?.length ?? 0)

  const toggleSkill = (id: string) => {
    const current = filters.skillIds ?? []
    setFilters(f => ({ ...f, skillIds: current.includes(id) ? current.filter(x => x !== id) : [...current, id] }))
  }

  const handleInvite = (student: LookingForTeamStudent) => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent('/teamup/students')}`)
      return
    }
    setInviteTarget(student)
  }

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-3">
            <UserSearch className="w-3.5 h-3.5" />
            TeamUp
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight mb-2">Students Looking for a Team</h1>
          <p className="text-muted-foreground">
            Discover students who&apos;ve marked themselves available and invite them to your team.
          </p>
        </div>

        <GlassCard className="p-4 mb-6">
          <div className="flex items-center gap-2">
            <select
              value={filters.competitionTypeId ?? ''}
              onChange={e => setFilters(f => ({ ...f, competitionTypeId: e.target.value || undefined }))}
              className={`${selectClass} flex-1 min-w-0`}
              style={selectStyle}
            >
              <option value="">All Competition Interests</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button
              onClick={() => setFiltersOpen(o => !o)}
              aria-expanded={filtersOpen}
              className="h-10 px-3 rounded-xl border flex items-center gap-1.5 text-sm shrink-0 transition-colors"
              style={{
                borderColor: activeCount > 0 ? 'rgba(99,102,241,0.4)' : 'var(--divider)',
                background: activeCount > 0 ? 'rgba(99,102,241,0.08)' : 'var(--muted-surface)',
              }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center">{activeCount}</span>
              )}
            </button>
          </div>

          {filtersOpen && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--divider)' }}>
              <SkillFilterChips skills={skills} selected={filters.skillIds ?? []} onToggle={toggleSkill} label="Skills" />

              {activeCount > 0 && (
                <button
                  onClick={() => setFilters({})}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-3"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </GlassCard>

        {error ? (
          <GlassCard className="p-10 text-center">
            <AlertTriangle className="w-7 h-7 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Couldn&apos;t load students.</p>
            <Button variant="outline" onClick={refresh}>Try again</Button>
          </GlassCard>
        ) : students === null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <StudentCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <UserSearch className="w-7 h-7 text-indigo-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold font-display mb-2">
              {students.length === 0
                ? 'No students are currently looking for a team.'
                : 'No students currently match your filters.'}
            </h3>
          </GlassCard>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => (
              <StudentCard key={s.profile.id} student={s} onInvite={() => handleInvite(s)} />
            ))}
          </div>
        )}
      </div>
      <Footer />

      <AnimatePresence>
        {inviteTarget && user && (
          <InviteToTeamModal userId={user.id} student={inviteTarget} onClose={() => setInviteTarget(null)} />
        )}
      </AnimatePresence>
    </main>
  )
}
