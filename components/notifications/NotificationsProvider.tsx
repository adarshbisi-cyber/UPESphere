'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import {
  getRecentNotifications, getUnreadCount, markAsRead as markAsReadApi, markAllAsRead as markAllAsReadApi,
  toNotification, type Notification, type NotificationRow,
} from '@/lib/notifications/api'

const RECENT_LIMIT = 20

interface NotificationsContextType {
  recent: Notification[]
  unreadCount: number
  loading: boolean
  error: boolean
  refresh: () => void
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType>({
  recent: [],
  unreadCount: 0,
  loading: false,
  error: false,
  refresh: () => {},
  markRead: async () => {},
  markAllRead: async () => {},
})

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [recent, setRecent] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const userRef = useRef(user)
  userRef.current = user

  const refresh = useCallback(() => {
    if (!user) {
      setRecent([])
      setUnreadCount(0)
      setLoading(false)
      return
    }
    setError(false)
    Promise.all([getRecentNotifications(user.id, RECENT_LIMIT), getUnreadCount(user.id)])
      .then(([notifications, count]) => {
        setRecent(notifications)
        setUnreadCount(count)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  // Cross-user realtime: an INSERT here can originate from ANOTHER user's
  // action (e.g. Rahul applying to Adarsh's team) — Adarsh's open session
  // needs to hear about it without a refresh. The `user_id=eq.<uid>` filter
  // plus this table's own RLS means a session can only ever receive rows it
  // could already SELECT.
  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        payload => {
          const inserted = toNotification(payload.new as NotificationRow)
          setRecent(prev => [inserted, ...prev].slice(0, RECENT_LIMIT))
          if (!inserted.isRead) setUnreadCount(c => c + 1)
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        payload => {
          const updated = toNotification(payload.new as NotificationRow)
          setRecent(prev => prev.map(n => (n.id === updated.id ? updated : n)))
          // Refetched rather than diffed locally: Realtime's `old` payload
          // isn't guaranteed to carry the prior is_read value, so a fresh
          // count is the only reliable source of truth here (this is also
          // what keeps multiple open tabs consistent with each other).
          getUnreadCount(user.id).then(setUnreadCount).catch(() => {})
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const markRead = useCallback(async (id: string) => {
    const uid = userRef.current?.id
    if (!uid) return
    const target = recent.find(n => n.id === id)
    if (!target || target.isRead) return

    setRecent(prev => prev.map(n => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)))
    setUnreadCount(c => Math.max(0, c - 1))
    try {
      await markAsReadApi(id, uid)
    } catch {
      // Don't leave it looking read if persistence failed.
      refresh()
    }
  }, [recent, refresh])

  const markAllRead = useCallback(async () => {
    const uid = userRef.current?.id
    if (!uid) return
    const previousRecent = recent
    const previousCount = unreadCount

    setRecent(prev => prev.map(n => (n.isRead ? n : { ...n, isRead: true, readAt: new Date().toISOString() })))
    setUnreadCount(0)
    try {
      await markAllAsReadApi(uid)
    } catch {
      setRecent(previousRecent)
      setUnreadCount(previousCount)
    }
  }, [recent, unreadCount])

  return (
    <NotificationsContext.Provider value={{ recent, unreadCount, loading, error, refresh, markRead, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext)
