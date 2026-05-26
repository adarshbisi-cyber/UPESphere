'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageView, GA, GA_ID } from '@/lib/analytics'

export function AnalyticsProvider() {
  const pathname = usePathname()
  const scrollReached = useRef(new Set<number>())

  // ── Page view on every route change ──────────────────────────────────────
  useEffect(() => {
    if (!GA_ID) return
    trackPageView(pathname)
    // Reset scroll depth milestones for the new page
    scrollReached.current = new Set()
  }, [pathname])

  // ── Scroll depth tracking ─────────────────────────────────────────────────
  useEffect(() => {
    const DEPTHS = [25, 50, 75, 100] as const

    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) return
      const pct = (window.scrollY / docHeight) * 100

      for (const depth of DEPTHS) {
        if (pct >= depth && !scrollReached.current.has(depth)) {
          scrollReached.current.add(depth)
          GA.scrollDepth(depth)
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return null
}
