import { Navbar } from '@/components/shared/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { GPADemo } from '@/components/landing/GPADemo'
import { AttendanceDemo } from '@/components/landing/AttendanceDemo'
import { Feedback } from '@/components/landing/Feedback'
import { Footer } from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <GPADemo />
      <AttendanceDemo />
      <Feedback />
      <Footer />
    </main>
  )
}
