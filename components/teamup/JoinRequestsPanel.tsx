'use client'

import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { describeSaveError } from '@/lib/onboarding/errors'
import { acceptJoinRequest, rejectJoinRequest, type TeamJoinRequest } from '@/lib/teamup/api'

export function JoinRequestsPanel({
  requests,
  onChanged,
}: {
  requests: TeamJoinRequest[]
  onChanged: () => void
}) {
  const { toast } = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const pending = requests.filter(r => r.status === 'pending')

  const handle = async (id: string, action: 'accept' | 'reject') => {
    setBusyId(id)
    setError('')
    try {
      if (action === 'accept') await acceptJoinRequest(id)
      else await rejectJoinRequest(id)
      toast({ title: action === 'accept' ? 'Member accepted' : 'Request rejected' })
      onChanged()
    } catch (err) {
      // The concurrency-safe RPC can legitimately reject an accept if
      // another request filled the last slot moments earlier — surface
      // that plainly rather than a raw Postgres error.
      setError(describeSaveError(err))
    } finally {
      setBusyId(null)
    }
  }

  if (pending.length === 0) {
    return (
      <GlassCard className="p-5">
        <h3 className="text-base font-semibold font-display mb-1">Join Requests</h3>
        <p className="text-sm text-muted-foreground">No one has requested to join your team yet.</p>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-5">
      <h3 className="text-base font-semibold font-display mb-4">Join Requests ({pending.length})</h3>
      <div className="space-y-3">
        {pending.map(r => (
          <div key={r.id} className="rounded-xl p-3.5" style={{ background: 'var(--muted-surface)' }}>
            <p className="text-sm font-medium">{r.applicant?.fullName ?? 'A student'}</p>
            {r.applicantSkills && r.applicantSkills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5 mb-2">
                {r.applicantSkills.slice(0, 4).map(s => (
                  <Badge key={s.id} variant="violet" className="text-[10px] px-1.5 py-0">{s.name}</Badge>
                ))}
              </div>
            )}
            {r.message && <p className="text-xs text-muted-foreground mb-3 italic mt-1.5">&ldquo;{r.message}&rdquo;</p>}
            <div className="flex gap-2 mt-2.5">
              <button
                onClick={() => handle(r.id, 'accept')}
                disabled={busyId === r.id}
                className="flex-1 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center justify-center gap-1 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
              >
                {busyId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Accept</>}
              </button>
              <button
                onClick={() => handle(r.id, 'reject')}
                disabled={busyId === r.id}
                className="flex-1 h-8 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium flex items-center justify-center gap-1 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
      {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
    </GlassCard>
  )
}
