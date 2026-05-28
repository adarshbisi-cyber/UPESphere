import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Expected Total Calculator',
  description:
    'Predict your expected subject total, passing probability, and end semester exam outcome instantly. Free for all Indian university students.',
  keywords: ['expected total calculator', 'exam score predictor', 'pass probability', 'end sem marks', 'Indian university'],
  openGraph: {
    title: 'Expected Total Calculator — UPESphere',
    description: 'Predict your expected subject total, passing probability, and end semester exam outcome instantly.',
  },
}

export default function ExpectedTotalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
