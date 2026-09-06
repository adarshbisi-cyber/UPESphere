'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/shared/Navbar'
import { AcademicWorkspace } from '@/components/dashboard/AcademicWorkspace'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { MyCourses } from '@/components/dashboard/MyCourses'
import { TodaysClasses } from '@/components/dashboard/TodaysClasses'
import { WeeklyTimetable } from '@/components/dashboard/WeeklyTimetable'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '@/components/auth/AuthProvider'
import { getGradeSheets, type GradeSheet } from '@/lib/onboarding/api'
import { Activity } from 'lucide-react'

interface DashboardData {
  semesters: GradeSheet[]
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Subtitle stays neutral and data-agnostic across every time slot — it
// describes what the page shows, not a guess at how the student's day is
// going (unearned reassurance reads as filler, not the sharp/fintech tone
// PRODUCT.md asks for).
function getGreeting(hour: number): { label: string; subtitle: string } {
  const subtitle = "Here's your academic snapshot."
  if (hour >= 5 && hour < 12) return { label: 'Good Morning', subtitle }
  if (hour >= 12 && hour < 17) return { label: 'Good Afternoon', subtitle }
  if (hour >= 17 && hour < 21) return { label: 'Good Evening', subtitle }
  return { label: 'Welcome Back', subtitle }
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [fetching, setFetching] = useState(true)
  const [now, setNow] = useState<Date | null>(null)
  // Bumped whenever the timetable changes, from either entry point (the
  // Academic Workspace's Timetable card, or Weekly Timetable's own upload
  // button) — both Weekly Timetable and Today's Classes fetch independently,
  // so this is what tells them to refetch regardless of which one triggered it.
  const [timetableVersion, setTimetableVersion] = useState(0)
  const refreshTimetable = useCallback(() => setTimetableVersion(v => v + 1), [])

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard')
    }
  }, [authLoading, user, router])

  // Refetches grade-sheet-derived data (SummaryCards' SGPA/CGPA/credits/degree
  // progress) without touching `fetching` — a background refresh after a
  // grade-sheet save should swap the numbers in place, not flash the whole
  // dashboard back to its skeleton. A failed refetch silently keeps the
  // previous valid data rather than clearing it.
  const refreshGradeSheets = useCallback(async () => {
    if (!user) return
    try {
      const semesters = await getGradeSheets(user.id)
      setData({ semesters })
    } catch {
      // Keep showing the last known-good values; the user can still see the
      // save succeeded via the Academic Workspace card's own status.
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      const semesters = await getGradeSheets(user.id)
      setData({ semesters })
      setFetching(false)
    }

    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const displayName =
    user?.user_metadata?.full_name?.split(' ')[0] ??
    user?.email?.split('@')[0] ??
    'Student'

  // Computed from client-local time only (never server time — the greeting
  // must match the visitor's own clock, not wherever the server happens to
  // run), so `now` starts null and is filled in by an effect after mount.
  const { label: greeting, subtitle: greetingSubtitle } = getGreeting(now?.getHours() ?? 12)
  const dayName = now ? WEEKDAYS[now.getDay()] : ''
  const dateLabel = now ? `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}` : ''

  const isLoading = authLoading || fetching || now === null

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
          >
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-64 rounded-xl bg-white/5" />
              <div className="h-6 w-96 rounded-xl bg-white/5" />
              <div className="h-40 rounded-2xl bg-white/5 mt-8" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
          >
        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-3">
              <Activity className="w-3.5 h-3.5" />
              Academic Dashboard
            </div>
            <h1 className="text-4xl font-bold font-display tracking-tight mb-2">
              {greeting},{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                {displayName}
              </span>
            </h1>
            <p className="text-muted-foreground">{greetingSubtitle}</p>
          </div>

          <div
            className="shrink-0 rounded-2xl px-5 py-3.5"
            style={{
              background: 'linear-gradient(135deg, var(--glass-from), var(--glass-to))',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--glass-shadow)',
              backdropFilter: 'blur(24px)',
            }}
          >
            <div className="text-sm font-semibold font-display text-foreground">{dayName}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{dateLabel}</div>
          </div>
        </div>

        {/* Summary cards — the numbers a returning student opens the dashboard to check,
            so they render above the workspace checklist rather than below it. */}
        {user && data && <SummaryCards userId={user.id} semesters={data.semesters} />}

        {/* Academic Workspace */}
        {user && (
          <AcademicWorkspace
            userId={user.id}
            onGradeSheetsChanged={refreshGradeSheets}
            onTimetableChanged={refreshTimetable}
            refreshSignal={timetableVersion}
          />
        )}

        {/* Today + Weekly Timetable */}
        {user && (
          <div className="grid lg:grid-cols-5 gap-6 mb-8">
            <div className="lg:col-span-2">
              <TodaysClasses userId={user.id} refreshKey={timetableVersion} />
            </div>
            <div className="lg:col-span-3">
              <WeeklyTimetable userId={user.id} refreshKey={timetableVersion} onTimetableChanged={refreshTimetable} />
            </div>
          </div>
        )}

        {/* My Courses — current semester curriculum */}
        {user && <MyCourses userId={user.id} />}

        {/* Quick actions */}
        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          {[
            { title: 'Calculate GPA', desc: 'Add subjects and get instant SGPA', href: '/gpa', color: 'from-indigo-500/10', border: 'border-indigo-500/20' },
            { title: 'Update CGPA', desc: 'Add latest semester scores', href: '/cgpa', color: 'from-violet-500/10', border: 'border-violet-500/20' },
            { title: 'Check Attendance', desc: 'Know how many classes to attend', href: '/attendance', color: 'from-cyan-500/10', border: 'border-cyan-500/20' },
          ].map(card => (
            <a
              key={card.title}
              href={card.href}
              className={`rounded-2xl border ${card.border} bg-gradient-to-br ${card.color} to-transparent p-5 hover:scale-[1.02] transition-all duration-200`}
            >
              <div className="text-base font-semibold font-display text-foreground mb-1">{card.title}</div>
              <p className="text-sm text-muted-foreground">{card.desc}</p>
            </a>
          ))}
        </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
