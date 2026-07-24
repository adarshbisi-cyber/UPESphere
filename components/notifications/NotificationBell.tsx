'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Loader2, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useNotifications } from '@/components/notifications/NotificationsProvider'
import { NotificationItem } from '@/components/notifications/NotificationItem'
import { formatUnreadBadge, type Notification } from '@/lib/notifications/api'
import { cn } from '@/lib/utils'

// Shared between the desktop dropdown and the mobile panel below so the two
// surfaces can't drift out of sync — same split as NavDropdown vs
// MobileNavAccordion in Navbar.tsx.
function NotificationPanelBody({
  loading, error, recent, unreadCount, onMarkAllRead, onItemClick, onViewAll,
}: {
  loading: boolean
  error: boolean
  recent: Notification[]
  unreadCount: number
  onMarkAllRead: () => void
  onItemClick: (id: string) => void
  onViewAll: () => void
}) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--divider)' }}>
        <p className="text-sm font-semibold font-display">Notifications</p>
        {unreadCount > 0 && (
          <button onClick={onMarkAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            Mark all as read
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-xs text-muted-foreground">Couldn&apos;t load notifications.</p>
          </div>
        ) : recent.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <p className="text-sm font-medium text-foreground mb-1">You&apos;re all caught up.</p>
            <p className="text-xs text-muted-foreground">Updates about your teams, academics and UPESphere will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--divider)]">
            {recent.map(n => (
              <NotificationItem key={n.id} notification={n} onClick={() => onItemClick(n.id)} />
            ))}
          </div>
        )}
      </div>

      <Link
        href="/notifications"
        onClick={onViewAll}
        className="block text-center text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors py-3 border-t shrink-0"
        style={{ borderColor: 'var(--divider)' }}
      >
        View all notifications
      </Link>
    </>
  )
}

const panelSurfaceStyle = {
  // Dropdown/popover-grade opacity (this is the same token NavDropdown
  // uses), not the --glass-* tokens — those are deliberately translucent
  // (~7% in dark mode) for surfaces meant to sit under a backdrop-blur,
  // which this panel never applied, so page content showed straight
  // through it.
  background: 'var(--dropdown-bg)',
  border: '1px solid var(--dropdown-border)',
  boxShadow: 'var(--dropdown-shadow)',
} as const

// Same click-outside/Escape/close-on-route-change pattern as ProfileMenu and
// NavDropdown in Navbar.tsx, so all three dropdowns behave identically.
export function NotificationBell({ onOpen }: { onOpen?: () => void } = {}) {
  const { user } = useAuth()
  const pathname = usePathname()
  const { recent, unreadCount, loading, error, markRead, markAllRead } = useNotifications()
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

  // Lets the mobile hamburger close this panel the instant it opens (see
  // Navbar.tsx) — mutual exclusion so only one full-screen mobile overlay is
  // ever active.
  useEffect(() => {
    if (open) onOpen?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!user) return null

  const handleItemClick = (id: string) => { void markRead(id); setOpen(false) }
  const handleMarkAllRead = () => void markAllRead()
  const handleViewAll = () => setOpen(false)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'relative flex items-center justify-center min-w-[40px] min-h-[40px] rounded-full transition-colors text-muted-foreground hover:text-foreground',
          open ? 'bg-white/10' : 'hover:bg-white/5'
        )}
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center leading-none">
            {formatUnreadBadge(unreadCount)}
          </span>
        )}
      </button>

      {/* Desktop: small anchored dropdown. Its nearest positioned ancestor is
          the `relative` div right above (not the <header>), so it was never
          affected by the containing-block bug described below — left exactly
          as it was. */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            role="menu"
            className="hidden sm:flex absolute top-full right-0 mt-2 w-96 max-h-[32rem] z-50 rounded-2xl overflow-hidden flex-col"
            style={{ ...panelSurfaceStyle, transformOrigin: 'top right' }}
          >
            <NotificationPanelBody
              loading={loading} error={error} recent={recent} unreadCount={unreadCount}
              onMarkAllRead={handleMarkAllRead} onItemClick={handleItemClick} onViewAll={handleViewAll}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile: full viewport-relative panel, portaled straight to
          document.body. The <header> in Navbar.tsx animates its own `y` via
          framer-motion (a persistent transform) and gains backdrop-blur-xl
          once scrolled (a filter) — both independently make it a containing
          block for any `position: fixed` descendant, which would hijack this
          panel's `inset-x-4 top-[72px]` to resolve against the header's own
          64px box instead of the viewport, collapsing/misplacing it instead
          of showing a proper full-width panel. Same fix UploadModalShell
          already uses for every modal in this app. */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                key="notification-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="sm:hidden fixed inset-0 z-40 bg-black/40"
                onClick={() => setOpen(false)}
                aria-hidden="true"
              />
              <motion.div
                ref={mobilePanelRef}
                key="notification-panel"
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                role="menu"
                className="sm:hidden fixed inset-x-4 top-[72px] max-h-[70vh] z-50 rounded-2xl overflow-hidden flex flex-col"
                style={{ ...panelSurfaceStyle, transformOrigin: 'top right' }}
              >
                <NotificationPanelBody
                  loading={loading} error={error} recent={recent} unreadCount={unreadCount}
                  onMarkAllRead={handleMarkAllRead} onItemClick={handleItemClick} onViewAll={handleViewAll}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
