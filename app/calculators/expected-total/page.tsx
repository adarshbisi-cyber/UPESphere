import { Navbar } from '@/components/shared/Navbar'
import { PassCalculator } from '@/components/calculators/PassCalculator'
import { MoreAcademicTools } from '@/components/shared/MoreAcademicTools'
import { Footer } from '@/components/landing/Footer'
import { Target } from 'lucide-react'

export default function ExpectedTotalPage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="relative max-w-3xl mx-auto text-center pt-4 pb-12">
          {/* Ambient glow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-1/4 w-[700px] h-64 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(52,211,153,0.09) 0%, rgba(16,185,129,0.04) 50%, transparent 70%)' }}
          />

          <div className="relative flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600/30 to-teal-600/20 border border-emerald-500/25 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Target className="w-7 h-7 text-emerald-400" />
            </div>
          </div>

          <div className="relative inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-5 uppercase tracking-widest">
            Academic Forecasting
          </div>

          <h1 className="relative text-5xl sm:text-6xl font-bold font-display tracking-tight mb-5 leading-[1.1]">
            Expected Total{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #34d399 0%, #10b981 40%, #06b6d4 100%)' }}
            >
              Calculator
            </span>
          </h1>

          <p className="relative text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Predict your expected subject total, analyze passing probability, and estimate your end semester performance.
          </p>
        </div>

        {/* ── Calculator ───────────────────────────────────────────────────── */}
        <PassCalculator />

        <MoreAcademicTools current="/calculators/expected-total" />
      </div>

      <Footer />
    </main>
  )
}
