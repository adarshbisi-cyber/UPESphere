import { Navbar } from '@/components/shared/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { GPADemo } from '@/components/landing/GPADemo'
import { AttendanceDemo } from '@/components/landing/AttendanceDemo'
import { Testimonials } from '@/components/landing/Testimonials'
import { FAQ } from '@/components/landing/FAQ'
import { Footer } from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <GPADemo />
      <AttendanceDemo />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  )
}
