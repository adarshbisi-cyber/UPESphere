import type { Metadata } from 'next'
import { Navbar } from '@/components/shared/Navbar'
import { PassCalculator } from '@/components/calculators/PassCalculator'
import { MoreAcademicTools } from '@/components/shared/MoreAcademicTools'
import { Footer } from '@/components/landing/Footer'

export const metadata: Metadata = {
  title: 'Can I Pass? Calculator',
  description:
    'Find out if you can pass your exam. Enter internal marks, assignment marks, attendance, and expected external marks to calculate your pass probability.',
  keywords: ['can I pass calculator', 'exam pass calculator', 'internal marks calculator', 'pass percentage', 'Indian university'],
  openGraph: {
    title: 'Can I Pass? Calculator — UPESphere',
    description: 'Enter your marks and find out if you can pass — with risk meter, pass probability, and score breakdown.',
  },
}

export default function PassPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium mb-4">
            Exam Prediction
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight mb-3">
            Can I{' '}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Pass?
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Enter your internal marks, assignments, attendance, and expected finals score to see your pass probability, risk level, and what you need to score.
          </p>
        </div>

        <PassCalculator />

        <MoreAcademicTools current="/pass" />
      </div>

      <Footer />
    </main>
  )
}
