'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Loader2, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useNotifications } from '@/components/notifications/NotificationsProvider'
import { NotificationItem } from '@/components/notifications/NotificationItem'
import { formatUnreadBadge } from '@/lib/notifications/api'

// Same click-outside/Escape/close-on-route-change pattern as ProfileMenu and
// NavDropdown in Navbar.tsx, so all three dropdowns behave identically.
export function NotificationBell() {
  const { user } = useAuth()
  const pathname = usePathname()
  const { recent, unreadCount, loading, error, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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

  useEffect(() => { setOpen(false) }, [pathname])

  if (!user) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center leading-none">
            {formatUnreadBadge(unreadCount)}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            role="menu"
            className="fixed inset-x-4 top-[72px] max-h-[70vh] sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-96 sm:max-h-[32rem] z-50 rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: 'var(--glass-from)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--glass-shadow)',
              transformOrigin: 'top right',
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--divider)' }}>
              <p className="text-sm font-semibold font-display">Notifications</p>
              {unreadCount > 0 && (
                <button onClick={() => void markAllRead()} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
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
                    <NotificationItem key={n.id} notification={n} onClick={() => { void markRead(n.id); setOpen(false) }} />
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors py-3 border-t shrink-0"
              style={{ borderColor: 'var(--divider)' }}
            >
              View all notifications
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
