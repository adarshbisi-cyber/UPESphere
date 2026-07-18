'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/shared/Navbar'
import { CGPATrend } from '@/components/dashboard/CGPATrend'
import { AcademicWorkspace } from '@/components/dashboard/AcademicWorkspace'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { TodaysClasses } from '@/components/dashboard/TodaysClasses'
import { WeeklyTimetable } from '@/components/dashboard/WeeklyTimetable'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, Activity, Plus } from 'lucide-react'

interface Semester {
  id: string
  semester_number: number
  name: string
  sgpa: number
  total_credits: number
}

interface DashboardData {
  semesters: Semester[]
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getGreeting(hour: number): { label: string; subtitle: string } {
  if (hour >= 5 && hour < 12) return { label: 'Good Morning', subtitle: "Let's make today productive." }
  if (hour >= 12 && hour < 17) return { label: 'Good Afternoon', subtitle: 'Hope your classes are going well.' }
  if (hour >= 17 && hour < 21) return { label: 'Good Evening', subtitle: "You're making great progress today." }
  return { label: 'Welcome Back', subtitle: "Don't forget to rest and recharge." }
}

function computeCgpa(semesters: Semester[]) {
  if (!semesters.length) return null
  const totalCredits = semesters.reduce((s, r) => s + (r.total_credits || 0), 0)
  if (!totalCredits) return null
  const weighted = semesters.reduce((s, r) => s + r.sgpa * (r.total_credits || 0), 0)
  return weighted / totalCredits
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [fetching, setFetching] = useState(true)
  const [now, setNow] = useState<Date | null>(null)

  const supabase = createClient()

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

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      const { data: semesters } = await supabase
        .from('semesters')
        .select('id, semester_number, name, sgpa, total_credits')
        .eq('user_id', user.id)
        .order('semester_number', { ascending: true })
      // The save layer now replaces rather than duplicates on re-upload, but
      // dedupe defensively here too — old rows from before that fix (or any
      // future write path that doesn't go through it) shouldn't repeat a
      // semester's label on the trend graph or get double-counted in CGPA.
      const dedupedSemesters = Array.from(
        new Map((semesters ?? []).map(s => [s.semester_number, s])).values()
      )
      setData({ semesters: dedupedSemesters })
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

  const hasSemesters = (data?.semesters?.length ?? 0) > 0

  const trendData = (data?.semesters ?? []).map((s, i, arr) => {
    const cgpaUpTo = computeCgpa(arr.slice(0, i + 1))
    return {
      semester: `Sem ${s.semester_number}`,
      sgpa: s.sgpa,
      cgpa: cgpaUpTo != null ? Math.round(cgpaUpTo * 100) / 100 : s.sgpa,
    }
  })

  if (authLoading || fetching || now === null) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 rounded-xl bg-white/5" />
            <div className="h-6 w-96 rounded-xl bg-white/5" />
            <div className="h-40 rounded-2xl bg-white/5 mt-8" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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

        {/* Academic Workspace */}
        {user && <AcademicWorkspace userId={user.id} />}

        {/* Summary cards */}
        {user && data && <SummaryCards userId={user.id} semesters={data.semesters} />}

        {/* Today + Weekly Timetable */}
        {user && (
          <div className="grid lg:grid-cols-5 gap-6 mb-8">
            <div className="lg:col-span-2">
              <TodaysClasses userId={user.id} />
            </div>
            <div className="lg:col-span-3">
              <WeeklyTimetable userId={user.id} />
            </div>
          </div>
        )}

        {/* Main content area */}
        {hasSemesters ? (
          <CGPATrend data={trendData} />
        ) : (
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-10 text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold font-display mb-2">No academic data yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Calculate your GPA or CGPA to start seeing trends, insights, and predictions here.
            </p>
            <a
              href="/gpa"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Calculate GPA
            </a>
          </div>
        )}

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
      </div>
    </main>
  )
}
