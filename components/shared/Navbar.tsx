'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, X, GraduationCap, LogOut, LayoutDashboard,
  ChevronDown, Calculator, TrendingUp, CalendarCheck, Target, Crosshair,
  Zap, MessageSquare, ExternalLink, HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAuth } from '@/components/auth/AuthProvider'
import { cn } from '@/lib/utils'

// ── Calculators data ─────────────────────────────────────────────────────────
const calculators = [
  {
    label: 'GPA Calculator',
    description: 'Calculate your semester GPA instantly',
    href: '/gpa',
    icon: Calculator,
    iconClass: 'text-indigo-400',
    iconBg: 'bg-indigo-500/15',
    activeBg: 'bg-indigo-500/10 border-indigo-500/25',
  },
  {
    label: 'GPA Target',
    description: 'Know the GPA needed this semester to reach your CGPA goal',
    href: '/calculators/gpa-target',
    icon: Crosshair,
    iconClass: 'text-rose-400',
    iconBg: 'bg-rose-500/15',
    activeBg: 'bg-rose-500/10 border-rose-500/25',
  },
  {
    label: 'CGPA Calculator',
    description: 'Track cumulative academic performance',
    href: '/cgpa',
    icon: TrendingUp,
    iconClass: 'text-violet-400',
    iconBg: 'bg-violet-500/15',
    activeBg: 'bg-violet-500/10 border-violet-500/25',
  },
  {
    label: 'Attendance',
    description: 'Plan bunks & monitor attendance smartly',
    href: '/attendance',
    icon: CalendarCheck,
    iconClass: 'text-cyan-400',
    iconBg: 'bg-cyan-500/15',
    activeBg: 'bg-cyan-500/10 border-cyan-500/25',
  },
  {
    label: 'Can I Pass?',
    description: 'Predict passing probability & required marks',
    href: '/pass',
    icon: Target,
    iconClass: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    activeBg: 'bg-emerald-500/10 border-emerald-500/25',
  },
] as const

const itemVariants = {
  hidden: { opacity: 0, y: 7 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, delay: i * 0.045, ease: [0.22, 1, 0.36, 1] as number[] },
  }),
}

// ── CalculatorsDropdown ───────────────────────────────────────────────────────
function CalculatorsDropdown() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isActive = calculators.some(c => pathname.startsWith(c.href))

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-xl border transition-all duration-200 select-none',
          open || isActive
            ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
            : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border-transparent'
        )}
      >
        Calculators
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            role="menu"
            className="absolute left-0 top-[calc(100%+10px)] w-[460px] rounded-2xl z-50 overflow-hidden backdrop-blur-2xl"
            style={{
              background: 'var(--dropdown-bg)',
              border: '1px solid var(--dropdown-border)',
              boxShadow: 'var(--dropdown-shadow)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-2.5 px-4 py-3 border-b"
              style={{ borderColor: 'var(--divider)' }}
            >
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Academic Toolkit
              </span>
            </div>

            {/* 2-column grid */}
            <div className="grid grid-cols-2 gap-1.5 p-2.5">
              {calculators.map((item, i) => {
                const active = pathname.startsWith(item.href)
                return (
                  <motion.div
                    key={item.href}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={itemVariants}
                    whileHover={
                      active
                        ? undefined
                        : {
                            y: -2,
                            scale: 1.018,
                            boxShadow: '0 6px 22px rgba(99,102,241,0.18), 0 2px 8px rgba(99,102,241,0.10)',
                            transition: { type: 'spring', stiffness: 420, damping: 26 },
                          }
                    }
                    className={cn(
                      'group relative rounded-xl border transition-colors duration-200 cursor-pointer',
                      i === calculators.length - 1 && calculators.length % 2 !== 0 && 'col-span-2',
                      active
                        ? item.activeBg
                        : 'border-transparent hover:bg-indigo-500/[0.09] hover:border-indigo-500/30'
                    )}
                  >
                    <Link
                      href={item.href}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 p-3.5 focus-visible:outline-none"
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105',
                          item.iconBg
                        )}
                      >
                        <item.icon
                          className={cn(
                            'w-[18px] h-[18px] transition-all duration-200 group-hover:scale-110 group-hover:-rotate-6',
                            item.iconClass
                          )}
                        />
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <div className={cn(
                          'text-sm font-medium leading-tight transition-colors duration-200',
                          active ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'
                        )}>
                          {item.label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {item.description}
                        </div>
                      </div>
                    </Link>

                    {/* Active dot */}
                    {active && (
                      <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-indigo-400 pointer-events-none" />
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-4 py-2.5 border-t"
              style={{ borderColor: 'var(--divider)' }}
            >
              <span className="text-[11px] text-muted-foreground/50">More tools coming soon</span>
              <Zap className="w-3 h-3 text-muted-foreground/35" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── UserMenu ──────────────────────────────────────────────────────────────────
function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  const initials = (
    user.user_metadata?.full_name
      ? user.user_metadata.full_name
          .split(' ')
          .slice(0, 2)
          .map((n: string) => n[0])
          .join('')
      : user.email?.[0] ?? 'U'
  ).toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/25">
          {initials}
        </div>
        <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-50"
            style={{
              background: 'var(--glass-from)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--glass-shadow)',
            }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--divider)' }}>
              <p className="text-xs font-medium text-foreground truncate">{user.user_metadata?.full_name ?? 'Student'}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <div className="py-1.5">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-white/5 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                Dashboard
              </Link>
              <button
                onClick={() => { setOpen(false); signOut() }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────────
export function Navbar() {
  const { user, loading, signOut } = useAuth()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileCalcOpen, setMobileCalcOpen] = useState(false)

  const isCalcActive = calculators.some(c => pathname.startsWith(c.href))

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false)
    setMobileCalcOpen(false)
  }, [pathname])

  const closeMobile = () => {
    setMobileOpen(false)
    setMobileCalcOpen(false)
  }

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-lg shadow-black/10 dark:shadow-black/30'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow" />
              <GraduationCap className="absolute inset-0 m-auto w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold font-display bg-gradient-to-r dark:from-white dark:to-white/70 from-slate-900 to-slate-700 bg-clip-text text-transparent group-hover:from-indigo-500 group-hover:to-violet-500 transition-all duration-300">
              UPESphere
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            <CalculatorsDropdown />
            <Link
              href="/dashboard"
              className={cn(
                'px-3.5 py-2 text-sm rounded-xl border border-transparent transition-all duration-200',
                pathname === '/dashboard'
                  ? 'text-foreground bg-white/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/faq"
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-xl border border-transparent transition-all duration-200',
                pathname === '/faq'
                  ? 'text-foreground bg-white/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              FAQ
            </Link>
            <a
              href="https://forms.gle/nNT7KWYXobfXBUTM8"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-white/5 border border-transparent transition-all duration-200"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Feedback
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2.5">
            <ThemeToggle />
            {!loading && (
              user ? (
                <UserMenu />
              ) : (
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    Sign In
                  </Button>
                </Link>
              )
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mobileOpen ? 'close' : 'open'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden border-t border-border bg-background/98 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-3 space-y-0.5">

              {/* Calculators accordion */}
              <div>
                <button
                  onClick={() => setMobileCalcOpen(o => !o)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 text-sm rounded-xl transition-colors',
                    isCalcActive
                      ? 'text-indigo-400 bg-indigo-500/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  )}
                >
                  <span className="font-medium">Calculators</span>
                  <motion.span
                    animate={{ rotate: mobileCalcOpen ? 180 : 0 }}
                    transition={{ duration: 0.22 }}
                    className="flex items-center"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {mobileCalcOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-3 pb-1 pt-0.5 space-y-0.5">
                        {calculators.map((item) => {
                          const active = pathname.startsWith(item.href)
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={closeMobile}
                              className={cn(
                                'flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-colors',
                                active
                                  ? 'text-foreground bg-white/8 font-medium'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                              )}
                            >
                              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', item.iconBg)}>
                                <item.icon className={cn('w-3.5 h-3.5', item.iconClass)} />
                              </div>
                              {item.label}
                              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                            </Link>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dashboard */}
              <Link
                href="/dashboard"
                onClick={closeMobile}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-colors',
                  pathname === '/dashboard'
                    ? 'text-foreground bg-white/5 font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              {/* FAQ */}
              <Link
                href="/faq"
                onClick={closeMobile}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-colors',
                  pathname === '/faq'
                    ? 'text-foreground bg-white/5 font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                <HelpCircle className="w-4 h-4" />
                FAQ
                {pathname === '/faq' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
              </Link>

              {/* Feedback */}
              <a
                href="https://forms.gle/nNT7KWYXobfXBUTM8"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMobile}
                className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-white/5 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Feedback
                <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-50" />
              </a>

              {/* Auth + Theme */}
              <div className="pt-3 mt-1 border-t border-border space-y-2">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-sm text-muted-foreground">Appearance</span>
                  <ThemeToggle />
                </div>

                {!loading && user ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03]">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(
                          user.user_metadata?.full_name
                            ? user.user_metadata.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('')
                            : user.email?.[0] ?? 'U'
                        ).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{user.user_metadata?.full_name ?? 'Student'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { closeMobile(); signOut() }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link href="/login" onClick={closeMobile}>
                    <Button variant="outline" className="w-full">Sign In</Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
