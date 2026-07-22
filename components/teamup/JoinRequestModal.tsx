'use client'

import { useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { UploadModalShell } from '@/components/workspace/UploadModalShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { describeSaveError } from '@/lib/onboarding/errors'
import { requestToJoin, type Team } from '@/lib/teamup/api'

export function JoinRequestModal({
  userId,
  team,
  onClose,
  onSent,
}: {
  userId: string
  team: Team
  onClose: () => void
  onSent: () => void
}) {
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const handleSubmit = async () => {
    setSaving(true)
    setError('')
    try {
      await requestToJoin(userId, team.id, message.trim())
      toast({ title: 'Request sent', description: `Your request to join ${team.competitionName} has been sent.` })
      onSent()
    } catch (err) {
      // The DB's partial unique index (one pending request per user per
      // team) and the RLS insert policy (blocks existing members, full/
      // closed/expired teams) are the actual guards here — the UI already
      // hides this action for those cases, so hitting either is normally
      // only reachable via a direct API call, not the modal. Still worth a
      // friendly message instead of the raw Postgres error either way.
      const code = (err as { code?: string } | null)?.code
      setError(
        code === '23505'
          ? 'You already have a pending request for this team — check My TeamUp to view or cancel it.'
          : code === '42501'
          ? "This team is no longer accepting requests, or you're already a member."
          : describeSaveError(err)
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <UploadModalShell onClose={onClose}>
      <h2 className="text-xl font-bold font-display tracking-tight mb-1.5 text-center pr-6">Request to Join</h2>
      <p className="text-sm text-muted-foreground text-center mb-5">{team.competitionName}</p>

      {team.skills.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Skills Required</p>
          <div className="flex flex-wrap gap-1.5">
            {team.skills.map(s => <Badge key={s.id} variant="violet">{s.name}</Badge>)}
          </div>
        </div>
      )}

      <label className="text-sm font-medium mb-1.5 block">
        Why would you like to join this team? <span className="text-muted-foreground font-normal">(optional)</span>
      </label>
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        rows={4}
        placeholder="I'm strong in React and have participated in two hackathons. I think I can help with frontend development."
        className="w-full rounded-xl border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 resize-none"
        style={{ borderColor: 'var(--divider)', background: 'var(--muted-surface)' }}
      />

      {error && (
        <div className="flex items-start gap-2 mt-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="gradient" className="flex-1 gap-2" disabled={saving} onClick={handleSubmit}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
        </Button>
      </div>
    </UploadModalShell>
  )
}
