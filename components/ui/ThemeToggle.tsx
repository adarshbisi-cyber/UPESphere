'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Prevent hydration flash — render a same-size placeholder
  if (!mounted) {
    return <div className="w-[58px] h-[30px] rounded-full bg-white/5 border border-white/10 shrink-0" />
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative flex items-center w-[58px] h-[30px] rounded-full p-1 shrink-0 cursor-pointer select-none"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(99,102,241,0.12) 100%)'
          : 'linear-gradient(135deg, rgba(251,191,36,0.20) 0%, rgba(245,158,11,0.13) 100%)',
        border: `1px solid ${isDark ? 'rgba(139,92,246,0.38)' : 'rgba(245,158,11,0.45)'}`,
        boxShadow: isDark
          ? '0 0 12px rgba(139,92,246,0.18), inset 0 1px 0 rgba(255,255,255,0.06)'
          : '0 0 12px rgba(245,158,11,0.22), inset 0 1px 0 rgba(255,255,255,0.45)',
        transition: 'background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
      }}
    >
      {/* Sliding indicator */}
      <motion.div
        animate={{ x: isDark ? 0 : 28 }}
        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        className="absolute rounded-full"
        style={{
          left: 4,
          width: 22,
          height: 22,
          background: isDark
            ? 'radial-gradient(circle at 38% 35%, rgba(192,167,250,0.95), rgba(99,102,241,0.75))'
            : 'radial-gradient(circle at 38% 35%, rgba(253,211,77,0.98), rgba(245,158,11,0.85))',
          boxShadow: isDark
            ? '0 0 14px rgba(139,92,246,0.55), 0 2px 6px rgba(0,0,0,0.35)'
            : '0 0 14px rgba(245,158,11,0.55), 0 2px 6px rgba(0,0,0,0.15)',
          transition: 'background 0.35s ease, box-shadow 0.35s ease',
        }}
      />

      {/* Moon + Sun icons */}
      <div className="relative z-10 flex w-full justify-between items-center px-[2px]">
        <Moon
          strokeWidth={2.2}
          className="w-[13px] h-[13px] transition-all duration-300"
          style={{ color: isDark ? 'rgba(220,210,255,0.95)' : 'rgba(120,110,180,0.35)' }}
        />
        <Sun
          strokeWidth={2.2}
          className="w-[13px] h-[13px] transition-all duration-300"
          style={{ color: isDark ? 'rgba(180,170,240,0.35)' : 'rgba(180,100,10,0.90)' }}
        />
      </div>
    </button>
  )
}
