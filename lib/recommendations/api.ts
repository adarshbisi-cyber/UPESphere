'use client'

// Only dismissals are persisted — the recommendations themselves are
// derived on read (see types.ts). This module is deliberately tiny for that
// reason.

import { createClient } from '@/lib/supabase/client'

export async function getDismissedSignatures(userId: string): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recommendation_dismissals')
    .select('signature')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []).map(r => r.signature as string)
}

export async function dismissRecommendation(userId: string, signature: string): Promise<void> {
  const supabase = createClient()
  // Upsert rather than insert: dismissing twice is the same decision, not an
  // error the user should see.
  const { error } = await supabase
    .from('recommendation_dismissals')
    .upsert({ user_id: userId, signature }, { onConflict: 'user_id,signature' })
  if (error) throw error
}
