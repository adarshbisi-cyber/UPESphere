import type { Metadata } from 'next'
import { Navbar } from '@/components/shared/Navbar'
import { CGPACalculator } from '@/components/calculators/CGPACalculator'

export const metadata: Metadata = {
  title: 'CGPA Calculator',
  description:
    'Calculate cumulative CGPA, track semester trends, and predict the SGPA needed to reach your target CGPA. Free for all Indian university students.',
  keywords: ['CGPA calculator', 'cumulative GPA', 'CGPA predictor', 'semester tracker'],
  openGraph: {
    title: 'CGPA Calculator — UPESphere',
    description: 'Track your CGPA across semesters and predict your graduation GPA.',
  },
}

export default function CGPAPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium mb-4">
            Cumulative GPA
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight mb-3">
            CGPA{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Calculator
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Track your academic journey semester by semester. See trends, get insights, and simulate the SGPA needed to hit your dream CGPA.
          </p>
        </div>

        <CGPACalculator />
      </div>
    </main>
  )
}
