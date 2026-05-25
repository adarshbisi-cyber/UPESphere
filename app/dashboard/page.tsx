import type { Metadata } from 'next'
import { Navbar } from '@/components/shared/Navbar'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { CGPATrend } from '@/components/dashboard/CGPATrend'
import { InsightsPanel } from '@/components/dashboard/InsightsPanel'
import {
  GraduationCap,
  BarChart3,
  Calendar,
  Flame,
  Activity,
  BookOpen,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your personal academic dashboard — GPA, CGPA, attendance, and smart insights at a glance.',
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
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
              Student
            </span>
          </h1>
          <p className="text-muted-foreground">
            Here's your academic overview — Semester 5, Computer Science Engineering.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatsCard
            title="Current GPA"
            value="8.70"
            subtitle="Semester 5"
            trend="up"
            trendValue="+0.6"
            color="indigo"
            icon={<GraduationCap className="w-4 h-4" />}
            delay={0}
          />
          <StatsCard
            title="CGPA"
            value="8.26"
            subtitle="5 semesters"
            trend="up"
            trendValue="+0.11"
            color="violet"
            icon={<BarChart3 className="w-4 h-4" />}
            delay={0.05}
          />
          <StatsCard
            title="Attendance"
            value="84%"
            subtitle="Safe zone"
            trend="stable"
            trendValue="on track"
            color="cyan"
            icon={<Calendar className="w-4 h-4" />}
            delay={0.1}
          />
          <StatsCard
            title="Safe Bunks"
            value="7"
            subtitle="Remaining"
            color="emerald"
            icon={<BookOpen className="w-4 h-4" />}
            delay={0.15}
          />
          <StatsCard
            title="Health Score"
            value="82"
            subtitle="Academic"
            trend="up"
            trendValue="Good"
            color="amber"
            icon={<Flame className="w-4 h-4" />}
            delay={0.2}
          />
        </div>

        {/* Main content area */}
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <CGPATrend />
          </div>
          <div className="lg:col-span-2">
            <InsightsPanel />
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          {[
            { title: 'Calculate GPA', desc: 'Add subjects and get instant SGPA', href: '/gpa', color: 'from-indigo-500/10', border: 'border-indigo-500/20', tag: 'indigo' },
            { title: 'Update CGPA', desc: 'Add latest semester scores', href: '/cgpa', color: 'from-violet-500/10', border: 'border-violet-500/20', tag: 'violet' },
            { title: 'Check Attendance', desc: 'Know how many classes to attend', href: '/attendance', color: 'from-cyan-500/10', border: 'border-cyan-500/20', tag: 'cyan' },
          ].map(card => (
            <a
              key={card.title}
              href={card.href}
              className={`rounded-2xl border ${card.border} bg-gradient-to-br ${card.color} to-transparent p-5 hover:scale-[1.02] transition-all duration-200 group`}
            >
              <div className="text-base font-semibold font-display text-white mb-1 group-hover:text-white">{card.title}</div>
              <p className="text-sm text-muted-foreground">{card.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
