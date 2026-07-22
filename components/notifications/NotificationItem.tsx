'use client'

import Link from 'next/link'
import {
  Bell, CheckCircle2, Clock, GraduationCap, Info, Mail, UserPlus, UserMinus, Users, AlertTriangle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime, type Notification, type NotificationType } from '@/lib/notifications/api'

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  team_join_request: UserPlus,
  team_join_accepted: CheckCircle2,
  team_join_rejected: Info,
  team_invitation: Mail,
  team_invitation_accepted: CheckCircle2,
  team_invitation_rejected: Info,
  team_full: CheckCircle2,
  team_match: Users,
  competition_deadline: Clock,
  team_member_removed: UserMinus,
  gradesheet_processed: GraduationCap,
  gradesheet_failed: AlertTriangle,
  system_announcement: Info,
}

const TYPE_TINT: Record<NotificationType, string> = {
  team_join_request: 'bg-indigo-500/15 text-indigo-400',
  team_join_accepted: 'bg-emerald-500/15 text-emerald-400',
  team_join_rejected: 'bg-white/10 text-muted-foreground',
  team_invitation: 'bg-indigo-500/15 text-indigo-400',
  team_invitation_accepted: 'bg-emerald-500/15 text-emerald-400',
  team_invitation_rejected: 'bg-white/10 text-muted-foreground',
  team_full: 'bg-emerald-500/15 text-emerald-400',
  team_match: 'bg-violet-500/15 text-violet-400',
  competition_deadline: 'bg-amber-500/15 text-amber-400',
  team_member_removed: 'bg-red-500/15 text-red-400',
  gradesheet_processed: 'bg-emerald-500/15 text-emerald-400',
  gradesheet_failed: 'bg-red-500/15 text-red-400',
  system_announcement: 'bg-indigo-500/15 text-indigo-400',
}

// Shared between the navbar dropdown and the full /notifications page, so
// the two surfaces can never render a notification differently.
export function NotificationItem({ notification, onClick }: { notification: Notification; onClick: () => void }) {
  const Icon = TYPE_ICON[notification.type] ?? Bell
  const tint = TYPE_TINT[notification.type] ?? 'bg-white/10 text-muted-foreground'

  const body = (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 transition-colors w-full text-left',
        notification.isRead ? 'hover:bg-white/5' : 'bg-indigo-500/[0.06] hover:bg-indigo-500/[0.1]',
      )}
    >
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', tint)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm leading-snug', notification.isRead ? 'text-foreground/80' : 'font-semibold text-foreground')}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 break-words">{notification.message}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-1">{formatRelativeTime(notification.createdAt)}</p>
      </div>
      {!notification.isRead && <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" aria-hidden />}
    </div>
  )

  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl} onClick={onClick} className="block">
        {body}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className="block w-full">
      {body}
    </button>
  )
}
