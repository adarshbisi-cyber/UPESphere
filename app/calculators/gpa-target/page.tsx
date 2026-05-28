'use client'

import { Navbar } from '@/components/shared/Navbar'
import { GPATargetCalculator } from '@/components/calculators/GPATargetCalculator'
import { MoreAcademicTools } from '@/components/shared/MoreAcademicTools'
import { Footer } from '@/components/landing/Footer'
import { Crosshair } from 'lucide-react'

export default function GPATargetPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <div className="relative max-w-3xl mx-auto text-center pt-4 pb-12">
          {/* Ambient glow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-1/4 w-[700px] h-64 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(244,63,94,0.10) 0%, rgba(239,68,68,0.04) 50%, transparent 70%)' }}
          />

          <div className="relative flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600/30 to-pink-600/20 border border-rose-500/25 flex items-center justify-center shadow-lg shadow-rose-500/10">
              <Crosshair className="w-7 h-7 text-rose-400" />
            </div>
          </div>

          <h1 className="relative text-5xl sm:text-6xl font-bold font-display tracking-tight mb-5 leading-[1.1]">
            GPA{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 40%, #ec4899 100%)' }}
            >
              Target
            </span>
            {' '}Calculator
          </h1>

          <p className="relative text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Enter your academic standing and instantly discover the exact GPA you need this semester to reach your CGPA goal.
          </p>
        </div>

        {/* ── Calculator ────────────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto">
          <GPATargetCalculator />
        </div>

        <MoreAcademicTools current="/calculators/gpa-target" />

      </div>

      <Footer />
    </main>
  )
}
