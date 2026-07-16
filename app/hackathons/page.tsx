import type { Metadata } from 'next'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/landing/Footer'
import { HackathonsCalendar } from '@/components/hackathons/HackathonsCalendar'

export const metadata: Metadata = {
  title: 'Hackathon Calendar',
  description:
    'A worldwide hackathon calendar — global tech, fintech & blockchain, healthcare, sustainability, industry-specific, and India-first hackathons, filterable by track and month.',
  keywords: ['hackathon calendar', 'tech hackathons', 'fintech hackathons', 'India hackathons', 'innovation challenges'],
  openGraph: {
    title: 'Hackathon Calendar — UPESphere',
    description: 'Hackathons and innovation challenges worldwide, mapped by track and month.',
  },
}

export default function HackathonsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HackathonsCalendar />
      <Footer />
    </main>
  )
}
