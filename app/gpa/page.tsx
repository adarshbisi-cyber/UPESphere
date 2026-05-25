import type { Metadata } from 'next'
import { Navbar } from '@/components/shared/Navbar'
import { GPACalculator } from '@/components/calculators/GPACalculator'
import { GPATargetCalculator } from '@/components/calculators/GPATargetCalculator'
import { Target } from 'lucide-react'

export const metadata: Metadata = {
  title: 'GPA Calculator',
  description:
    'Free GPA calculator for Indian university students. Supports 10-point, 4-point scales. Compatible with VTU, SRM, KIIT, Anna University and more.',
  keywords: ['GPA calculator', 'SGPA calculator', 'university GPA', 'Indian university'],
  openGraph: {
    title: 'GPA Calculator — UPESphere',
    description: 'Calculate your SGPA instantly with our smart GPA calculator.',
  },
}

export default function GPAPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <GPACalculator />
        </div>

        {/* ── Section bridge ───────────────────────────────────────────── */}
        <div className="relative mt-8">

          {/* Hairline gradient rule */}
          <div className="h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

          {/* Ambient glow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-1/2 w-[900px] h-72 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.12) 0%, rgba(99,102,241,0.05) 45%, transparent 70%)' }}
          />

          {/* Section heading */}
          <div className="relative max-w-3xl mx-auto text-center pt-14 pb-10">

            {/* Centered icon */}
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/30 to-indigo-600/20 border border-violet-500/25 flex items-center justify-center shadow-lg shadow-violet-500/10">
                <Target className="w-7 h-7 text-violet-300" />
              </div>
            </div>

            {/* Main heading */}
            <h2 className="text-5xl sm:text-6xl font-bold font-display tracking-tight mb-5 leading-[1.1]">
              Semester GPA{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 40%, #22d3ee 100%)' }}
              >
                Target
              </span>
              {' '}Calculator
            </h2>

            {/* Subtitle */}
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Enter your academic standing and instantly discover the exact GPA you need this semester to reach your CGPA goal.
            </p>
          </div>

          {/* Calculator */}
          <div className="max-w-5xl mx-auto">
            <GPATargetCalculator />
          </div>

        </div>
      </div>
    </main>
  )
}
