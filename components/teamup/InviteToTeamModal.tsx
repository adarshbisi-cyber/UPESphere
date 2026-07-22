'use client'

import { useEffect, useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { UploadModalShell } from '@/components/workspace/UploadModalShell'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { describeSaveError } from '@/lib/onboarding/errors'
import { getMyTeams, inviteToTeam, type Team, type LookingForTeamStudent } from '@/lib/teamup/api'

const selectClass =
  'w-full h-10 rounded-xl border px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50'
const selectStyle = { borderColor: 'var(--divider)', background: 'var(--muted-surface)' } as const

export function InviteToTeamModal({
  userId,
  student,
  onClose,
  onSent,
}: {
  userId: string
  student: LookingForTeamStudent
  onClose: () => void
  onSent?: () => void
}) {
  const { toast } = useToast()
  const [teams, setTeams] = useState<Team[] | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyTeams(userId)
      .then(all => {
        const own = all.filter(t => t.createdBy === userId && t.status === 'open')
        setTeams(own)
        if (own[0]) setSelectedTeamId(own[0].id)
      })
      .catch(() => setError('Could not load your teams.'))
  }, [userId])

  const handleInvite = async () => {
    if (!selectedTeamId) return
    setSaving(true)
    setError('')
    try {
      await inviteToTeam(selectedTeamId, student.profile.id, userId)
      toast({ title: 'Invitation sent', description: `${student.profile.fullName ?? 'The student'} has been invited.` })
      onSent?.()
      onClose()
    } catch (err) {
      const code = (err as { code?: string } | null)?.code
      setError(
        code === '23505'
          ? 'You already have a pending invitation out to this student for this team.'
          : describeSaveError(err),
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <UploadModalShell onClose={onClose}>
      <h2 className="text-xl font-bold font-display tracking-tight mb-1.5 text-center pr-6">Invite to Team</h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Invite {student.profile.fullName ?? 'this student'} to one of your teams.
      </p>

      {teams === null ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        </div>
      ) : teams.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          You don&apos;t have any open teams to invite into yet. Create a Team Request first.
        </p>
      ) : (
        <select
          value={selectedTeamId}
          onChange={e => setSelectedTeamId(e.target.value)}
          className={selectClass}
          style={selectStyle}
        >
          {teams.map(t => (
            <option key={t.id} value={t.id}>
              {t.competitionName} ({t.currentMembers}/{t.maxMembers})
            </option>
          ))}
        </select>
      )}

      {error && (
        <div
          className="flex items-start gap-2 mt-3 p-3 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          variant="gradient"
          className="flex-1 gap-2"
          disabled={!selectedTeamId || saving || teams?.length === 0}
          onClick={handleInvite}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Invitation'}
        </Button>
      </div>
    </UploadModalShell>
  )
}
