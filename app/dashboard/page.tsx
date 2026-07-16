'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/shared/Navbar'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { CGPATrend } from '@/components/dashboard/CGPATrend'
import { InsightsPanel } from '@/components/dashboard/InsightsPanel'
import { WorkspaceCompletion } from '@/components/dashboard/WorkspaceCompletion'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import {
  GraduationCap,
  BarChart3,
  Calendar,
  Flame,
  Activity,
  BookOpen,
  Plus,
} from 'lucide-react'

interface Semester {
  id: string
  semester_number: number
  name: string
  sgpa: number
  total_credits: number
}

interface AttendanceRecord {
  attended: number
  total: number
  required_percentage: number
}

interface DashboardData {
  semesters: Semester[]
  attendance: AttendanceRecord[]
}

function computeCgpa(semesters: Semester[]) {
  if (!semesters.length) return null
  const totalCredits = semesters.reduce((s, r) => s + (r.total_credits || 0), 0)
  if (!totalCredits) return null
  const weighted = semesters.reduce((s, r) => s + r.sgpa * (r.total_credits || 0), 0)
  return weighted / totalCredits
}

function computeAttendance(records: AttendanceRecord[]) {
  if (!records.length) return null
  const totalAttended = records.reduce((s, r) => s + r.attended, 0)
  const totalClasses = records.reduce((s, r) => s + r.total, 0)
  if (!totalClasses) return null
  const pct = (totalAttended / totalClasses) * 100
  const req = records[0]?.required_percentage ?? 75
  const safeBunks = Math.max(0, Math.floor(totalAttended * 100 / req) - totalClasses)
  return { pct, safeBunks, status: pct >= req ? 'Safe zone' : 'At risk' }
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [fetching, setFetching] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      const [{ data: semesters }, { data: attendance }] = await Promise.all([
        supabase
          .from('semesters')
          .select('id, semester_number, name, sgpa, total_credits')
          .eq('user_id', user.id)
          .order('semester_number', { ascending: true }),
        supabase
          .from('attendance_records')
          .select('attended, total, required_percentage')
          .eq('user_id', user.id),
      ])
      setData({ semesters: semesters ?? [], attendance: attendance ?? [] })
      setFetching(false)
    }

    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const displayName =
    user?.user_metadata?.full_name?.split(' ')[0] ??
    user?.email?.split('@')[0] ??
    'Student'

  const hasSemesters = (data?.semesters?.length ?? 0) > 0
  const latestSem = hasSemesters ? data!.semesters[data!.semesters.length - 1] : null
  const prevSem = (data?.semesters?.length ?? 0) >= 2 ? data!.semesters[data!.semesters.length - 2] : null
  const cgpa = data ? computeCgpa(data.semesters) : null
  const prevCgpa = data ? computeCgpa(data.semesters.slice(0, -1)) : null
  const attendance = data ? computeAttendance(data.attendance) : null

  const trendData = (data?.semesters ?? []).map((s, i, arr) => {
    const cgpaUpTo = computeCgpa(arr.slice(0, i + 1))
    return {
      semester: `Sem ${s.semester_number}`,
      sgpa: s.sgpa,
      cgpa: cgpaUpTo != null ? Math.round(cgpaUpTo * 100) / 100 : s.sgpa,
    }
  })

  const sgpaTrend =
    latestSem && prevSem
      ? latestSem.sgpa > prevSem.sgpa
        ? 'up'
        : latestSem.sgpa < prevSem.sgpa
        ? 'down'
        : 'stable'
      : undefined

  const cgpaTrend =
    cgpa && prevCgpa
      ? cgpa > prevCgpa
        ? 'up'
        : cgpa < prevCgpa
        ? 'down'
        : 'stable'
      : undefined

  if (authLoading || fetching) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 rounded-xl bg-white/5" />
            <div className="h-6 w-96 rounded-xl bg-white/5" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-white/5" />
              ))}
            </div>
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
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-3">
            <Activity className="w-3.5 h-3.5" />
            Academic Dashboard
          </div>
          <h1 className="text-4xl font-bold font-display tracking-tight mb-2">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              {displayName}
            </span>
          </h1>
          <p className="text-muted-foreground">
            {hasSemesters
              ? `${data!.semesters.length} semester${data!.semesters.length !== 1 ? 's' : ''} tracked — keep going.`
              : 'Start by calculating your GPA to populate your dashboard.'}
          </p>
        </div>

        {/* Workspace completion */}
        {user && <WorkspaceCompletion userId={user.id} />}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatsCard
            title="Current SGPA"
            value={latestSem ? latestSem.sgpa.toFixed(2) : '—'}
            subtitle={latestSem ? `Semester ${latestSem.semester_number}` : 'No data yet'}
            trend={sgpaTrend}
            trendValue={
              sgpaTrend && latestSem && prevSem
                ? `${latestSem.sgpa > prevSem.sgpa ? '+' : ''}${(latestSem.sgpa - prevSem.sgpa).toFixed(2)}`
                : undefined
            }
            color="indigo"
            icon={<GraduationCap className="w-4 h-4" />}
            delay={0}
          />
          <StatsCard
            title="CGPA"
            value={cgpa != null ? cgpa.toFixed(2) : '—'}
            subtitle={hasSemesters ? `${data!.semesters.length} semester${data!.semesters.length !== 1 ? 's' : ''}` : 'No data yet'}
            trend={cgpaTrend}
            trendValue={
              cgpaTrend && cgpa && prevCgpa
                ? `${cgpa > prevCgpa ? '+' : ''}${(cgpa - prevCgpa).toFixed(2)}`
                : undefined
            }
            color="violet"
            icon={<BarChart3 className="w-4 h-4" />}
            delay={0.05}
          />
          <StatsCard
            title="Attendance"
            value={attendance ? `${attendance.pct.toFixed(0)}%` : '—'}
            subtitle={attendance?.status ?? 'No data yet'}
            trend={attendance ? (attendance.pct >= 75 ? 'up' : 'down') : undefined}
            trendValue={attendance ? 'on track' : undefined}
            color="cyan"
            icon={<Calendar className="w-4 h-4" />}
            delay={0.1}
          />
          <StatsCard
            title="Safe Bunks"
            value={attendance ? attendance.safeBunks : '—'}
            subtitle="Remaining"
            color="emerald"
            icon={<BookOpen className="w-4 h-4" />}
            delay={0.15}
          />
          <StatsCard
            title="Health Score"
            value={
              cgpa && attendance
                ? Math.round((cgpa / 10) * 50 + (attendance.pct / 100) * 50)
                : '—'
            }
            subtitle="Academic"
            trend={cgpa ? 'up' : undefined}
            trendValue={cgpa ? 'Good' : undefined}
            color="amber"
            icon={<Flame className="w-4 h-4" />}
            delay={0.2}
          />
        </div>

        {/* Main content area */}
        {hasSemesters ? (
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <CGPATrend data={trendData} />
            </div>
            <div className="lg:col-span-2">
              <InsightsPanel />
            </div>
          </div>
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
