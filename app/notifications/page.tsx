'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, Loader2, AlertTriangle } from 'lucide-react'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuth } from '@/components/auth/AuthProvider'
import { useNotifications } from '@/components/notifications/NotificationsProvider'
import { NotificationItem } from '@/components/notifications/NotificationItem'
import { getNotificationsPage, type Notification, type NotificationCategory } from '@/lib/notifications/api'

const PAGE_SIZE = 20

type TabValue = 'all' | 'unread' | 'teamup' | 'academic' | 'system'

const TAB_FILTER: Record<TabValue, { category?: NotificationCategory; unreadOnly?: boolean }> = {
  all: {},
  unread: { unreadOnly: true },
  teamup: { category: 'teamup' },
  academic: { category: 'academic' },
  system: { category: 'system' },
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth()
  const { markRead, markAllRead, unreadCount } = useNotifications()
  const [tab, setTab] = useState<TabValue>('all')
  const [items, setItems] = useState<Notification[] | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)

  const loadPage = useCallback((activeTab: TabValue, offset: number) => {
    if (!user) return
    setError(false)
    getNotificationsPage(user.id, { ...TAB_FILTER[activeTab], offset, limit: PAGE_SIZE })
      .then(({ notifications, hasMore: more }) => {
        setItems(prev => (offset === 0 ? notifications : [...(prev ?? []), ...notifications]))
        setHasMore(more)
      })
      .catch(() => setError(true))
      .finally(() => setLoadingMore(false))
  }, [user])

  useEffect(() => {
    setItems(null)
    loadPage(tab, 0)
  }, [tab, loadPage])

  const handleLoadMore = () => {
    if (!items) return
    setLoadingMore(true)
    loadPage(tab, items.length)
  }

  const handleItemClick = (n: Notification) => {
    if (n.isRead) return
    setItems(prev => prev?.map(item => (item.id === n.id ? { ...item, isRead: true } : item)) ?? null)
    void markRead(n.id)
  }

  const handleMarkAllRead = () => {
    setItems(prev => prev?.map(item => ({ ...item, isRead: true })) ?? null)
    void markAllRead()
  }

  const loading = authLoading || (!!user && items === null && !error)

  if (!user) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        {loading && (
          <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-64 rounded-xl bg-white/5" />
              <div className="h-6 w-96 rounded-xl bg-white/5" />
            </div>
          </div>
        )}
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">Notifications</h1>
            <p className="text-muted-foreground mt-1">Updates about your teams, academics and UPESphere.</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="shrink-0">
              Mark all as read
            </Button>
          )}
        </div>

        <Tabs value={tab} onValueChange={v => setTab(v as TabValue)}>
          <TabsList className="flex-wrap h-auto sm:h-11">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="teamup">TeamUp</TabsTrigger>
            <TabsTrigger value="academic">Academics</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            {error ? (
              <GlassCard className="p-10 text-center">
                <AlertTriangle className="w-7 h-7 text-red-400 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">Couldn&apos;t load notifications.</p>
                <Button variant="outline" onClick={() => loadPage(tab, 0)}>Try again</Button>
              </GlassCard>
            ) : items === null ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
            ) : items.length === 0 ? (
              <GlassCard className="p-10 text-center">
                <Bell className="w-7 h-7 text-indigo-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold font-display mb-2">You&apos;re all caught up.</h3>
                <p className="text-sm text-muted-foreground">Updates about your teams, academics and UPESphere will appear here.</p>
              </GlassCard>
            ) : (
              <GlassCard className="overflow-hidden">
                <div className="divide-y divide-[var(--divider)]">
                  {items.map(n => (
                    <NotificationItem key={n.id} notification={n} onClick={() => handleItemClick(n)} />
                  ))}
                </div>
              </GlassCard>
            )}

            {hasMore && !error && (
              <div className="flex justify-center mt-4">
                <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore} className="gap-2">
                  {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load more'}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </main>
  )
}
