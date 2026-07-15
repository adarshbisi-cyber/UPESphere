import type { Metadata } from 'next'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/landing/Footer'
import { CommunityTeaser } from '@/components/community/CommunityTeaser'

export const metadata: Metadata = {
  title: 'Community',
  description:
    'UPESphere Community is on the way — study squads, peer Q&A, campus chatter, and notes worth stealing. Find your people and figure it out together.',
  openGraph: {
    title: 'Community — UPESphere',
    description: 'Study squads, peer Q&A, and campus chatter. Your people are gathering.',
  },
}

export default function CommunityPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <CommunityTeaser />
      <Footer />
    </main>
  )
}
