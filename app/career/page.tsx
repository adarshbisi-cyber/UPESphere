import type { Metadata } from 'next'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/landing/Footer'
import { CareerTeaser } from '@/components/career/CareerTeaser'

export const metadata: Metadata = {
  title: 'Career',
  description:
    'UPESphere Careers is on the way — internships, placements, and opportunities matched to your grades and goals, all in one place.',
  openGraph: {
    title: 'Career — UPESphere',
    description: 'Internships, placements, and opportunities matched to your academic profile. In the workshop.',
  },
}

export default function CareerPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <CareerTeaser />
      <Footer />
    </main>
  )
}
