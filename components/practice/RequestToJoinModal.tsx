'use client'

import { useRef, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { UploadModalShell } from '@/components/workspace/UploadModalShell'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { requestToJoin } from '@/lib/practiceTogether/api'
import { describeSaveError } from '@/lib/onboarding/errors'
import type { PracticeSession } from '@/lib/practiceTogether/types'

export function RequestToJoinModal({
  session,
  userId,
  onClose,
  onSent,
}: {
  session: PracticeSession
  userId: string
  onClose: () => void
  onSent: () => void
}) {
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const savingRef = useRef(false)

  const send = async () => {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setError('')
    try {
      await requestToJoin(session.id, userId, message.trim() || null)
      onSent()
    } catch (err) {
      // The partial unique index rejects a second pending request, so a
      // double-submit surfaces here rather than creating a duplicate.
      setError(describeSaveError(err))
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <UploadModalShell onClose={onClose}>
      <h2 className="text-xl font-bold font-display tracking-tight mb-1.5 pr-6">Request to Join</h2>
      <p className="text-sm text-muted-foreground mb-5">{session.title}</p>

      <Label className="text-xs mb-1.5 block">
        Introduce yourself or tell the host why you&rsquo;d like to join
        <span className="text-muted-foreground font-normal ml-1.5">(optional)</span>
      </Label>
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        rows={4}
        placeholder="Hey! I am also preparing for consulting interviews and would love to practice."
        style={{ borderColor: 'var(--divider)', background: 'var(--muted-surface)' }}
        className="w-full rounded-xl border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
      />

      {error && (
        <div className="flex items-start gap-2 mt-4 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="gradient" className="flex-1 gap-2" disabled={saving} onClick={send}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Request'}
        </Button>
      </div>
    </UploadModalShell>
  )
}
