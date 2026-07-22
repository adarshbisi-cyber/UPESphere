'use client'

// Data-access layer for the UPESphere-wide notification system. Deliberately
// generic — nothing here knows about TeamUp or academics specifically;
// notification *creation* for those events lives entirely in
// supabase/notifications-migration.sql (triggers + a narrow RPC), matching
// the "trusted server logic, not just frontend authorization" requirement.
// This file only reads notifications and mutates read/unread state, both of
// which are safe for a plain RLS-guarded client call (a user can only ever
// touch their own rows).

import { createClient } from '@/lib/supabase/client'

export type NotificationCategory = 'teamup' | 'academic' | 'system'

export type NotificationType =
  | 'team_join_request' | 'team_join_accepted' | 'team_join_rejected'
  | 'team_invitation' | 'team_invitation_accepted' | 'team_invitation_rejected'
  | 'team_full' | 'team_match' | 'competition_deadline' | 'team_member_removed'
  | 'gradesheet_processed' | 'gradesheet_failed'
  | 'system_announcement'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  actionUrl: string | null
  entityType: string | null
  entityId: string | null
  isRead: boolean
  createdAt: string
  readAt: string | null
}

export interface NotificationRow {
  id: string
  user_id: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  action_url: string | null
  entity_type: string | null
  entity_id: string | null
  is_read: boolean
  created_at: string
  read_at: string | null
}

export function toNotification(r: NotificationRow): Notification {
  return {
    id: r.id, userId: r.user_id, type: r.type, category: r.category,
    title: r.title, message: r.message, actionUrl: r.action_url,
    entityType: r.entity_type, entityId: r.entity_id,
    isRead: r.is_read, createdAt: r.created_at, readAt: r.read_at,
  }
}

const NOTIFICATION_SELECT = 'id, user_id, type, category, title, message, action_url, entity_type, entity_id, is_read, created_at, read_at'

// The navbar dropdown only ever needs the last handful — fetching unlimited
// history there would be wasted bandwidth on every page load.
export async function getRecentNotifications(userId: string, limit = 20): Promise<Notification[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIFICATION_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return ((data ?? []) as NotificationRow[]).map(toNotification)
}

export interface NotificationPage {
  notifications: Notification[]
  hasMore: boolean
}

// Full /notifications page — offset pagination (simple "Load more", not
// true infinite scroll, matching the rest of this app's list patterns).
export async function getNotificationsPage(
  userId: string,
  { category, unreadOnly, offset = 0, limit = 20 }: { category?: NotificationCategory; unreadOnly?: boolean; offset?: number; limit?: number },
): Promise<NotificationPage> {
  const supabase = createClient()
  let query = supabase
    .from('notifications')
    .select(NOTIFICATION_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category) query = query.eq('category', category)
  if (unreadOnly) query = query.eq('is_read', false)

  const { data, error } = await query
  if (error) throw error
  const rows = (data ?? []) as NotificationRow[]
  return { notifications: rows.map(toNotification), hasMore: rows.length === limit }
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  if (error) throw error
  return count ?? 0
}

// RLS (`using (auth.uid() = user_id)`) is what actually prevents touching
// another user's notification — the .eq('user_id', userId) here is belt and
// suspenders, not the security boundary.
export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function markAllAsRead(userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false)
  if (error) throw error
}

// Fixed title/message generated server-side (see notify_gradesheet_processed
// in the migration) — the client only triggers *that* it happened, for
// itself; it can't inject arbitrary notification content.
export async function notifyGradeSheetProcessed(): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('notify_gradesheet_processed')
  if (error) throw error
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// Pure and testable via the injected `now` — mirrors the spec's own examples
// ("2m ago", "1h ago", "Yesterday").
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime()
  const diff = now.getTime() - then
  if (diff < MINUTE) return 'Just now'
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`
  if (diff < 2 * DAY) return 'Yesterday'
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// count === 0 renders no badge at all (handled by the caller); this only
// decides the label once there's something to show.
export function formatUnreadBadge(count: number): string {
  if (count > 99) return '99+'
  if (count > 9) return '9+'
  return String(count)
}
