import type { Metadata } from 'next'
import { Navbar } from '@/components/shared/Navbar'
import { GPACalculator } from '@/components/calculators/GPACalculator'
import { MoreAcademicTools } from '@/components/shared/MoreAcademicTools'
import { Footer } from '@/components/landing/Footer'
import { Calculator } from 'lucide-react'

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

        <MoreAcademicTools current="/gpa" />
      </div>

      <Footer />
    </main>
  )
}
