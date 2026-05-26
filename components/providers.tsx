'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
    >
      <AnalyticsProvider />
      {children}
      <Toaster />
    </ThemeProvider>
  )
}
