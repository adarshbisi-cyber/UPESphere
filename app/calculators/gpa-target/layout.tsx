import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GPA Target Calculator',
  description:
    'Find out the exact GPA you need this semester to reach your CGPA goal. Free, instant, and built for Indian university students.',
  keywords: ['GPA target calculator', 'CGPA goal', 'semester GPA needed', 'Indian university'],
  openGraph: {
    title: 'GPA Target Calculator — UPESphere',
    description: 'Know the GPA needed this semester to reach your CGPA goal.',
  },
}

export default function GPATargetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
