import type { User } from '@supabase/supabase-js'

// Single source of truth for turning a Supabase user into display identity —
// used by the desktop profile dropdown and the mobile Account section so the
// initials/avatar logic never drifts between the two.
export function getInitials(user: User | null | undefined): string {
  const fullName = user?.user_metadata?.full_name as string | undefined
  if (fullName) {
    return fullName.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }
  return (user?.email?.[0] ?? 'U').toUpperCase()
}

// Google OAuth via Supabase populates `avatar_url` (Supabase's own convention)
// and/or `picture` (the raw Google claim) depending on provider/version —
// check both so a signed-in Google account shows its real photo instead of
// falling back to initials unnecessarily.
export function getAvatarUrl(user: User | null | undefined): string | null {
  return (user?.user_metadata?.avatar_url as string | undefined)
    ?? (user?.user_metadata?.picture as string | undefined)
    ?? null
}

export function getDisplayName(user: User | null | undefined): string {
  return (user?.user_metadata?.full_name as string | undefined) ?? 'Student'
}
