import type { Metadata } from 'next'
import { Navbar } from '@/components/shared/Navbar'
import { GPACalculator } from '@/components/calculators/GPACalculator'
import { GPATargetCalculator } from '@/components/calculators/GPATargetCalculator'
import { Target, Calculator } from 'lucide-react'
import { ScrollToTargetButton } from '@/components/ui/ScrollToTargetButton'

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
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        {/* ── GPA Calculator heading ───────────────────────────────────── */}
        <div className="relative max-w-3xl mx-auto text-center pt-4 pb-10">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-violet-600/20 border border-indigo-500/25 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Calculator className="w-7 h-7 text-indigo-300" />
            </div>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold font-display tracking-tight mb-5 leading-[1.1]">
            Semester{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #22d3ee 100%)' }}
            >
              GPA
            </span>
            {' '}Calculator
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Add subjects, select grades, and get your SGPA instantly. Supports all major Indian university grading systems.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <GPACalculator />
        </div>

        {/* ── Scroll arrow ─────────────────────────────────────────────── */}
        <ScrollToTargetButton targetId="gpa-target-section" />

        {/* ── Target Calculator section ─────────────────────────────────── */}
        <div id="gpa-target-section" className="relative scroll-mt-20">

          {/* Ambient glow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-1/2 w-[900px] h-72 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.12) 0%, rgba(99,102,241,0.05) 45%, transparent 70%)' }}
          />

          {/* Section heading */}
          <div className="relative max-w-3xl mx-auto text-center pt-10 pb-10">

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
