import type { Metadata } from 'next'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/landing/Footer'
import { CaseCompExperience } from '@/components/casecomp/CaseCompExperience'

export const metadata: Metadata = {
  title: 'Case Comp Calendar',
  description:
    'India’s case-competition and B-school fest calendar — every IIM, IIT and DU fest worth competing in, mapped across the year with prize pools, tracks, and registration windows.',
  keywords: ['case competition calendar', 'B-fest calendar', 'IIM fests', 'IIT fests', 'DU fests', 'Unstop', 'college competitions India'],
  openGraph: {
    title: 'Case Comp Calendar — UPESphere',
    description: 'Every IIM, IIT and DU case comp and B-fest, mapped month by month with prize pools and lead times.',
  },
}

export default function CaseCompPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <CaseCompExperience />
      <Footer />
    </main>
  )
}
