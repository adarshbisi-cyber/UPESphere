import type { Metadata } from 'next'
import { Navbar } from '@/components/shared/Navbar'
import { AttendanceCalculator } from '@/components/calculators/AttendanceCalculator'
import { MoreAcademicTools } from '@/components/shared/MoreAcademicTools'
import { Footer } from '@/components/landing/Footer'

export const metadata: Metadata = {
  title: 'Attendance Calculator',
  description:
    'Calculate current attendance percentage, find how many classes you can safely bunk, and get a recovery plan. Supports VTU 85%, SRM 75%, KIIT 75% and custom requirements.',
  keywords: ['attendance calculator', 'bunk calculator', 'class attendance', 'safe bunks', 'VTU attendance', 'SRM attendance'],
  openGraph: {
    title: 'Attendance Calculator — UPESphere',
    description: 'Know exactly how many classes you can skip and still stay safe.',
  },
}

export default function AttendancePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-medium mb-4">
            Attendance Tracker
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight mb-3">
            Attendance{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Calculator
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Enter your classes attended and total held. Instantly know your safe-bunk limit and recovery plan.
          </p>
        </div>

        <AttendanceCalculator />

        <MoreAcademicTools current="/attendance" />
      </div>

      <Footer />
    </main>
  )
}
