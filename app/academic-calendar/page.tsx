import type { Metadata } from 'next'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/landing/Footer'
import { AcademicCalendar } from '@/components/academic/AcademicCalendar'

export const metadata: Metadata = {
  title: 'Academic Calendar 2026–27',
  description:
    "UPES academic calendar for 2026–27 — class starts, exam windows, result dates and holidays mapped to the day, colour-coded by academic events, exams and holidays.",
  keywords: ['UPES academic calendar', 'academic calendar 2026-27', 'exam dates', 'college holidays', 'semester dates'],
  openGraph: {
    title: 'Academic Calendar 2026–27 — UPESphere',
    description: 'Class starts, exams, results and holidays for the 2026–27 session, mapped to the day.',
  },
}

export default function AcademicCalendarPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <AcademicCalendar />
      <Footer />
    </main>
  )
}
