'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, X, GraduationCap, LogOut, LayoutDashboard, BookOpenCheck,
  ChevronDown, Calculator, TrendingUp, CalendarCheck, Target, Crosshair,
  Zap, MessageSquare, ExternalLink, CalendarRange, CalendarDays, Briefcase, Users, Code2,
  User as UserIcon, LogIn, UserPlus, Users2, LayoutGrid, Library,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { useAuth } from '@/components/auth/AuthProvider'
import { getInitials, getAvatarUrl, getDisplayName } from '@/lib/auth/avatar'
import { cn, EASE_OUT } from '@/lib/utils'

// ── Nav dropdown data ────────────────────────────────────────────────────────
type NavItem = {
  label: string
  description: string
  href: string
  icon: LucideIcon
  iconClass: string
  iconBg: string
  activeBg: string
}

const calculators: NavItem[] = [
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
    label: 'Expected Total',
    description: 'Predict your final subject score and exam outcome',
    href: '/calculators/expected-total',
    icon: Target,
    iconClass: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    activeBg: 'bg-emerald-500/10 border-emerald-500/25',
  },
]

const calendarItems: NavItem[] = [
  {
    label: 'Case Comp Calendar',
    description: "India's case comps & B-fests, mapped by month",
    href: '/case-comp',
    icon: CalendarRange,
    iconClass: 'text-indigo-400',
    iconBg: 'bg-indigo-500/15',
    activeBg: 'bg-indigo-500/10 border-indigo-500/25',
  },
  {
    label: 'Academic Calendar',
    description: "Your college's 2026–27 dates, exams & holidays",
    href: '/academic-calendar',
    icon: CalendarDays,
    iconClass: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    activeBg: 'bg-emerald-500/10 border-emerald-500/25',
  },
  {
    label: 'Hackathon Calendar',
    description: 'Global tech, fintech & India hackathons by track',
    href: '/hackathons',
    icon: Code2,
    iconClass: 'text-cyan-400',
    iconBg: 'bg-cyan-500/15',
    activeBg: 'bg-cyan-500/10 border-cyan-500/25',
  },
]

// Shared between the desktop nav row and the mobile primary menu — each
// still has its own markup/styling per layout (same pattern as the
// calculators/calendarItems arrays above feeding NavDropdown vs
// MobileNavAccordion) so the two surfaces can't drift out of sync. Split
// into two arrays (rather than one) because Community sits between them as
// its own dropdown/accordion, not a plain link. Career used to be a plain
// link here too, but became a dropdown (see careerItems below) once
// Placement Tracker gave it a real first sub-feature — left empty rather
// than removed so a future simple link before Community has somewhere to go.
type SimpleLink = { label: string; href: string; icon: LucideIcon; external?: boolean }

const primaryLinksBeforeCommunity: SimpleLink[] = []

const primaryLinksAfterCommunity: SimpleLink[] = [
  { label: 'Feedback', href: 'https://forms.gle/nNT7KWYXobfXBUTM8', icon: MessageSquare, external: true },
]

// Career's first real sub-feature. Structured as a NavItem list (like
// calculators/calendarItems/communityItems above) so future Career features
// can be added here without restructuring the dropdown.
const careerItems: NavItem[] = [
  {
    label: 'Placement Tracker',
    description: 'Track applications and recruitment progress',
    href: '/career/placement-tracker',
    icon: Target,
    iconClass: 'text-indigo-400',
    iconBg: 'bg-indigo-500/15',
    activeBg: 'bg-indigo-500/10 border-indigo-500/25',
  },
  {
    label: 'Resources',
    description: 'Guides, templates, and tools for your career',
    href: '/career/resources',
    icon: Library,
    iconClass: 'text-violet-400',
    iconBg: 'bg-violet-500/15',
    activeBg: 'bg-violet-500/10 border-violet-500/25',
  },
]

// TeamUp lives inside the Community dropdown/accordion instead of its own
// top-level nav item. Structured as a NavItem list (like calculators/
// calendarItems above) so future community features — Find Students, Clubs &
// Societies, Events — can be added here later without restructuring the
// dropdown. "Community Feed" keeps the pre-existing /community teaser page
// reachable now that Community itself no longer links there directly.
const communityItems: NavItem[] = [
  {
    label: 'TeamUp',
    description: 'Find teammates for competitions',
    href: '/teamup',
    icon: Users2,
    iconClass: 'text-indigo-400',
    iconBg: 'bg-indigo-500/15',
    activeBg: 'bg-indigo-500/10 border-indigo-500/25',
  },
  {
    label: 'Community Feed',
    description: 'Study squads, peer Q&A, and campus chatter',
    href: '/community',
    icon: Users,
    iconClass: 'text-violet-400',
    iconBg: 'bg-violet-500/15',
    activeBg: 'bg-violet-500/10 border-violet-500/25',
  },
]

// Dashboard, Gradebook, and My TeamUp are authenticated, personal features —
// kept out of primaryLinks (and out of primary navigation entirely) and only
// surfaced inside the account menu/section, on both desktop and mobile. My
// TeamUp is where every TeamUp status update lives (applications, invitations,
// join requests) — without an entry here it was only reachable via a
// notification deep link or by guessing the URL.
const accountLinks: SimpleLink[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Gradebook', href: '/gradebook', icon: BookOpenCheck },
  { label: 'My TeamUp', href: '/teamup/mine', icon: LayoutGrid },
]

const itemVariants = {
  hidden: { opacity: 0, y: 7 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, delay: i * 0.045, ease: EASE_OUT as number[] },
  }),
}

// ── NavDropdown (Calculators, Calendar, …) ────────────────────────────────────
function NavDropdown({ label, triggerIcon: TriggerIcon, headerLabel, items, footerText }: {
  label: string
  triggerIcon: LucideIcon
  headerLabel: string
  items: NavItem[]
  footerText: string
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isActive = items.some(c => pathname.startsWith(c.href))

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
        <TriggerIcon className="w-3.5 h-3.5" />
        {label}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: EASE_OUT }}
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
            transition={{ duration: 0.2, ease: EASE_OUT }}
            role="menu"
            className="absolute left-0 top-[calc(100%+10px)] w-[460px] rounded-2xl z-50 overflow-hidden backdrop-blur-2xl"
            style={{
              background: 'var(--dropdown-bg)',
              border: '1px solid var(--dropdown-border)',
              boxShadow: 'var(--dropdown-shadow)',
              transformOrigin: 'top left',
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
                {headerLabel}
              </span>
            </div>

            {/* 2-column grid */}
            <div className="grid grid-cols-2 gap-1.5 p-2.5">
              {items.map((item, i) => {
                const active = pathname.startsWith(item.href)
                return (
                  <motion.div
                    key={item.href}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={itemVariants}
                    className={cn(
                      'group relative rounded-xl border transition-colors duration-200 cursor-pointer',
                      i === items.length - 1 && items.length % 2 !== 0 && 'col-span-2',
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
                          'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                          item.iconBg
                        )}
                      >
                        <item.icon
                          className={cn('w-[18px] h-[18px]', item.iconClass)}
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
              <span className="text-[11px] text-muted-foreground/50">{footerText}</span>
              <Zap className="w-3 h-3 text-muted-foreground/35" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── MobileNavAccordion (Calculators, Calendar, … on mobile) ───────────────────
function MobileNavAccordion({ label, triggerIcon: TriggerIcon, items, onNavigate }: {
  label: string
  triggerIcon: LucideIcon
  items: NavItem[]
  onNavigate: () => void
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isActive = items.some(c => pathname.startsWith(c.href))

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 text-sm rounded-xl transition-colors',
          isActive
            ? 'text-indigo-400 bg-indigo-500/10'
            : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
        )}
      >
        <span className="font-medium inline-flex items-center gap-3">
          <TriggerIcon className="w-4 h-4" />
          {label}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          className="flex items-center"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-3 pb-1 pt-0.5 space-y-0.5">
              {items.map((item) => {
                const active = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
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
  )
}

// ── Avatar (shared trigger visual for desktop + mobile) ───────────────────────
function Avatar({ size = 28 }: { size?: number }) {
  const { user } = useAuth()
  const avatarUrl = getAvatarUrl(user)
  // OAuth avatar URLs (Google's lh3.googleusercontent.com, etc.) aren't
  // guaranteed to stay reachable — they can expire, rotate, or 404. Without
  // this, a failed load leaves the browser's broken-image icon on screen
  // permanently instead of falling back to the initials circle below.
  const [imgFailed, setImgFailed] = useState(false)
  useEffect(() => { setImgFailed(false) }, [avatarUrl])

  if (!user) {
    return (
      <div
        className="rounded-full flex items-center justify-center text-muted-foreground"
        style={{ width: size, height: size, background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}
      >
        <UserIcon style={{ width: size * 0.55, height: size * 0.55 }} />
      </div>
    )
  }

  if (avatarUrl && !imgFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        onError={() => setImgFailed(true)}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/25 shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {getInitials(user)}
    </div>
  )
}

// ── ProfileMenu (desktop + mobile utility) ────────────────────────────────────
// Shared between the desktop dropdown and the mobile menu below so the two
// surfaces can't drift out of sync — same split as NavDropdown vs
// MobileNavAccordion, and NotificationPanelBody in NotificationBell.tsx.
function ProfileMenuBody({ onNavigate, onSignOut }: { onNavigate: () => void; onSignOut: () => void }) {
  const { user } = useAuth()
  return user ? (
    <>
      <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: 'var(--divider)' }}>
        <Avatar size={32} />
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{getDisplayName(user)}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>
      <div className="py-1.5">
        {accountLinks.map(item => (
          <Link
            key={item.href}
            href={item.href}
            role="menuitem"
            onClick={onNavigate}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-white/5 transition-colors"
          >
            <item.icon className="w-4 h-4 text-muted-foreground" />
            {item.label}
          </Link>
        ))}
        <button
          role="menuitem"
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </>
  ) : (
    <>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--divider)' }}>
        <p className="text-xs font-medium text-foreground">Guest</p>
        <p className="text-xs text-muted-foreground">Not signed in</p>
      </div>
      <div className="py-1.5 border-b" style={{ borderColor: 'var(--divider)' }}>
        {/* Plain links to the real routes — middleware already redirects an
            unauthenticated visit to /login?redirect=<path> and the login
            page already restores that destination after sign-in, so no
            extra redirect wiring is needed here. */}
        {accountLinks.map(item => (
          <Link
            key={item.href}
            href={item.href}
            role="menuitem"
            onClick={onNavigate}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-white/5 transition-colors"
          >
            <item.icon className="w-4 h-4 text-muted-foreground" />
            {item.label}
          </Link>
        ))}
      </div>
      <div className="py-1.5">
        <Link
          href="/login"
          role="menuitem"
          onClick={onNavigate}
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-white/5 transition-colors"
        >
          <LogIn className="w-4 h-4 text-muted-foreground" />
          Sign In
        </Link>
        <Link
          href="/login?mode=signup"
          role="menuitem"
          onClick={onNavigate}
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-indigo-400 hover:bg-indigo-500/10 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Create Account
        </Link>
      </div>
    </>
  )
}

const profileSurfaceStyle = {
  // --dropdown-* (94-97% opaque), not --glass-* — the latter is deliberately
  // translucent (~7% in dark mode) for surfaces meant to sit under a
  // backdrop-blur, which this panel never applied, so page content showed
  // straight through it (the same bug already fixed for NavDropdown and
  // NotificationBell).
  background: 'var(--dropdown-bg)',
  border: '1px solid var(--dropdown-border)',
  boxShadow: 'var(--dropdown-shadow)',
} as const

// Always-visible circular trigger regardless of auth state — the dropdown
// content branches on `user`, but the trigger itself never disappears, so a
// logged-out visitor can still see Dashboard/Gradebook exist before signing in.
function ProfileMenu({ onOpen }: { onOpen?: () => void } = {}) {
  const { signOut } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const mobilePanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      // The mobile panel is portaled to document.body (see below), so it's
      // no longer a DOM descendant of `ref` — without also checking it here,
      // every click inside the mobile panel would look like a click
      // "outside" and the panel would slam shut on its own content.
      if (ref.current?.contains(target)) return
      if (mobilePanelRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  // Lets the mobile hamburger close this menu the instant it opens (see
  // Navbar.tsx) — mutual exclusion so only one mobile overlay is ever active.
  // Profile closing the hamburger/bell, and the hamburger/bell closing
  // Profile, both fall out of each control's own click-outside listener for
  // free (the other control's button is always "outside" whichever ref).
  useEffect(() => {
    if (open) onOpen?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleNavigate = () => setOpen(false)
  const handleSignOut = () => { setOpen(false); signOut() }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'min-w-[40px] min-h-[40px] flex items-center justify-center gap-1.5 rounded-full transition-colors',
          open ? 'bg-white/10' : 'hover:bg-white/5'
        )}
      >
        <Avatar />
      </button>

      {/* Desktop: small anchored dropdown. Its nearest positioned ancestor is
          the `relative` div right above (not the <header>), so it was never
          affected by the header's containing-block bug — left exactly as it
          was (only the --glass-*→--dropdown-* opacity fix applies here too). */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            role="menu"
            className="hidden md:block absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden z-50"
            style={{ ...profileSurfaceStyle, transformOrigin: 'top right' }}
          >
            <ProfileMenuBody onNavigate={handleNavigate} onSignOut={handleSignOut} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile/tablet: portaled straight to document.body so it escapes the
          same header containing-block hijack already fixed for the
          hamburger drawer and NotificationBell's mobile panel (the <header>
          animates its own `y` via framer-motion and gains backdrop-blur-xl
          once scrolled — both make it a containing block for `position:
          fixed` descendants). Right-aligned and viewport-clamped so it can
          never overflow, even at 320px wide. */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={mobilePanelRef}
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              role="menu"
              className="md:hidden fixed right-4 top-[68px] w-56 max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-y-auto z-50 rounded-2xl overflow-hidden"
              style={{ ...profileSurfaceStyle, transformOrigin: 'top right' }}
            >
              <ProfileMenuBody onNavigate={handleNavigate} onSignOut={handleSignOut} />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────────
export function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Lock background scroll while the mobile drawer is open, and always
  // restore it — both on close and on unmount, so a navigation away from the
  // page never leaves scroll stuck off.
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const closeMobile = () => {
    setMobileOpen(false)
  }

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
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
            <NavDropdown
              label="Calculators"
              triggerIcon={Calculator}
              headerLabel="Academic Toolkit"
              items={calculators}
              footerText="More tools coming soon"
            />
            <NavDropdown
              label="Calendar"
              triggerIcon={CalendarRange}
              headerLabel="Planning & Calendars"
              items={calendarItems}
              footerText="More calendars coming soon"
            />
            <NavDropdown
              label="Career"
              triggerIcon={Briefcase}
              headerLabel="Career"
              items={careerItems}
              footerText="More career tools coming soon"
            />
            {primaryLinksBeforeCommunity.map(item => {
              const active = !item.external && pathname.startsWith(item.href)
              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-white/5 border border-transparent transition-all duration-200"
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </a>
                )
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-xl border border-transparent transition-all duration-200',
                    active
                      ? 'text-foreground bg-white/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  )}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              )
            })}
            <NavDropdown
              label="Community"
              triggerIcon={Users}
              headerLabel="Community"
              items={communityItems}
              footerText="More community features coming soon"
            />
            {primaryLinksAfterCommunity.map(item => {
              const active = !item.external && pathname.startsWith(item.href)
              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-white/5 border border-transparent transition-all duration-200"
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </a>
                )
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-xl border border-transparent transition-all duration-200',
                    active
                      ? 'text-foreground bg-white/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  )}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2.5">
            <ThemeToggle />
            <NotificationBell />
            <ProfileMenu />
          </div>

          {/* Mobile/tablet: Bell and Profile stay directly visible (not
              buried in the drawer) alongside the hamburger toggle — they're
              persistent utilities, not navigation, so users can reach their
              account or notifications from any page without opening nav
              first. Order matches the spec: Bell → Profile → Hamburger. */}
          <div className="md:hidden flex items-center gap-1">
            {/* Each of Bell/Profile's `onOpen` closes the drawer — the one
                direction none of the three controls' own click-outside
                listeners can cover for free (that only reacts to taps
                *outside* a control, not to being the thing that just
                opened). Every other direction (Bell↔Profile,
                Hamburger→Bell/Profile) already falls out of each control's
                existing click-outside listener, since the other control's
                button is always "outside" whichever ref is being checked. */}
            <NotificationBell onOpen={() => setMobileOpen(false)} />
            <ProfileMenu onOpen={() => setMobileOpen(false)} />
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
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
      </div>

      {/* Mobile Menu — a dedicated full-viewport drawer (not an inline expanding
          panel), so homepage content never shows through or competes visually,
          and it correctly accounts for iOS safe areas via env(safe-area-inset-*).
          Portaled straight to document.body: this <header> animates its own
          `y` via framer-motion (a persistent transform) and gains
          `backdrop-blur-xl` once scrolled (a filter) — both independently
          make the header a containing block for any `position: fixed`
          descendant, which hijacks this drawer's `top-16`/`bottom-0` insets
          to resolve against the header's own 64px box instead of the
          viewport, collapsing it to zero height (X icon shows, nothing
          appears — the exact "frozen" symptom). Same fix UploadModalShell
          already uses for every modal in this app. */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              id="mobile-nav-drawer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-background overflow-y-auto"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
            <div className="px-4 py-3 space-y-0.5">

              {/* Calculators accordion */}
              <MobileNavAccordion label="Calculators" triggerIcon={Calculator} items={calculators} onNavigate={closeMobile} />

              {/* Calendar accordion */}
              <MobileNavAccordion label="Calendar" triggerIcon={CalendarRange} items={calendarItems} onNavigate={closeMobile} />

              {/* Career accordion (contains Placement Tracker) */}
              <MobileNavAccordion label="Career" triggerIcon={Briefcase} items={careerItems} onNavigate={closeMobile} />

              {primaryLinksBeforeCommunity.map(item => {
                const active = !item.external && pathname.startsWith(item.href)
                if (item.external) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeMobile}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                      <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-50" />
                    </a>
                  )
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-colors',
                      active
                        ? 'text-foreground bg-white/5 font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                  </Link>
                )
              })}

              {/* Community accordion (contains TeamUp) */}
              <MobileNavAccordion label="Community" triggerIcon={Users} items={communityItems} onNavigate={closeMobile} />

              {/* Feedback */}
              {primaryLinksAfterCommunity.map(item => {
                const active = !item.external && pathname.startsWith(item.href)
                if (item.external) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeMobile}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                      <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-50" />
                    </a>
                  )
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-colors',
                      active
                        ? 'text-foreground bg-white/5 font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                  </Link>
                )
              })}

              {/* Appearance — Profile/Account now lives in the persistent
                  navbar utility row (Bell → Profile → Hamburger) above,
                  not here, so there's a single obvious place for account
                  actions instead of two. */}
              <div className="pt-3 mt-2 border-t" style={{ borderColor: 'var(--divider)' }}>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Appearance</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.header>
  )
}
