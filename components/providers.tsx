'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider'
import { AuthProvider } from '@/components/auth/AuthProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
    >
      <AuthProvider>
        <AnalyticsProvider />
        {children}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}
