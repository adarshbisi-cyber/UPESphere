import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://gradeflow.vercel.app'),
  title: {
    default: 'UPESphere — Track Your Academic Life Smarter',
    template: '%s | UPESphere',
  },
  description:
    'Calculate GPA, CGPA, track attendance, and get AI-powered academic insights. Built for Gen Z students across Indian universities.',
  keywords: [
    'GPA calculator',
    'CGPA calculator',
    'attendance calculator',
    'VTU calculator',
    'SRM GPA calculator',
    'KIIT CGPA',
    'student tools',
    'academic tracker',
    'bunk calculator',
    'India university',
  ],
  authors: [{ name: 'UPESphere Team' }],
  creator: 'UPESphere',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://gradeflow.vercel.app',
    title: 'UPESphere — Smart Academic Companion',
    description: 'Track your academic life smarter with GPA, CGPA, and attendance calculators.',
    siteName: 'UPESphere',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UPESphere — Smart Academic Companion',
    description: 'Track your academic life smarter.',
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans min-h-screen bg-background`}>
        <GoogleAnalytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
