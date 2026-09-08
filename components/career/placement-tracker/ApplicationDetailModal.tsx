'use client'

// The "complete details" view for one application: read-only summary,
// editable recruitment-journey timeline, and — only when a round is freshly
// marked eliminated — an optional reflection prompt. That reflection is
// kept structurally separate from the round's own outcome data (a different
// table, see the migration's comment) so a student's subjective guess about
// why they were eliminated is never rendered or treated as the same kind of
// fact as the observed elimination itself.

import { useEffect, useState } from 'react'
import { Loader2, AlertTriangle, Plus, MapPin, Briefcase, Calendar } from 'lucide-react'
import { UploadModalShell } from '@/components/workspace/UploadModalShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ApplicationStatusBadge, RoundOutcomeBadge } from './StatusBadge'
import {
  getApplication, updateRound, addRound, withdrawApplication, markOfferReceived,
} from '@/lib/placementTracker/api'
import { isApplicationClosed } from '@/lib/placementTracker/status'
import { getApplicationJourneyState } from '@/lib/placementTracker/journey'
import { inferRoundType } from '@/lib/placementTracker/categoryInference'
import { ROUND_TYPES, EXIT_REASONS, exitReasonLabel } from '@/lib/placementTracker/constants'
import { describeSaveError } from '@/lib/onboarding/errors'
import type { RoundType, ExitReason, PlacementApplication, RoundOutcome } from '@/lib/placementTracker/types'

const OUTCOME_OPTIONS: { value: RoundOutcome; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'pending', label: 'Pending' },
  { value: 'cleared', label: 'Cleared' },
  { value: 'eliminated', label: 'Eliminated' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

export function ApplicationDetailModal({
  userId,
  applicationId,
  onClose,
  onChanged,
}: {
  userId: string
  applicationId: string
  onClose: () => void
  onChanged: () => void
}) {
  const [app, setApp] = useState<PlacementApplication | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [reflectingRoundId, setReflectingRoundId] = useState<string | null>(null)
  const [newRoundName, setNewRoundName] = useState('')
  const [newRoundCategory, setNewRoundCategory] = useState<RoundType | null>(null)

  const refresh = () => {
    getApplication(userId, applicationId)
      .then(setApp)
      .catch(err => setError(describeSaveError(err)))
  }

  useEffect(() => { refresh() }, [userId, applicationId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOutcomeChange = async (roundId: string, outcome: RoundOutcome) => {
    try {
      await updateRound(userId, applicationId, roundId, {
        outcome,
        completedDate: outcome === 'cleared' || outcome === 'eliminated' ? new Date().toISOString().slice(0, 10) : undefined,
      })
      // An elimination isn't fully recorded until we know why — that reason
      // is what the whole Exit Reason insight is built from, so the prompt
      // opens immediately rather than being an optional extra step.
      if (outcome === 'eliminated') setReflectingRoundId(roundId)
      refresh()
      onChanged()
    } catch (err) {
      setError(describeSaveError(err))
    }
  }

  const handleExitReason = async (roundId: string, exitReason: ExitReason, notes: string | null) => {
    try {
      await updateRound(userId, applicationId, roundId, { exitReason, outcomeNotes: notes })
      setReflectingRoundId(null)
      refresh()
      onChanged()
    } catch (err) {
      setError(describeSaveError(err))
    }
  }

  const handleMarkOffer = async () => {
    try {
      await markOfferReceived(userId, applicationId)
      refresh()
      onChanged()
    } catch (err) {
      setError(describeSaveError(err))
    }
  }

  const handleAddRound = async () => {
    if (!app || !newRoundName.trim()) return
    try {
      await addRound(
        userId, applicationId,
        { displayName: newRoundName.trim(), analyticsCategory: newRoundCategory ?? 'other' },
        app.rounds.length,
      )
      setNewRoundName('')
      setNewRoundCategory(null)
      refresh()
      onChanged()
    } catch (err) {
      setError(describeSaveError(err))
    }
  }

  const handleWithdraw = async () => {
    try {
      await withdrawApplication(userId, applicationId)
      refresh()
      onChanged()
    } catch (err) {
      setError(describeSaveError(err))
    }
  }

  if (app === undefined) {
    return (
      <UploadModalShell onClose={onClose}>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        </div>
      </UploadModalShell>
    )
  }

  if (app === null) {
    return (
      <UploadModalShell onClose={onClose}>
        <p className="text-sm text-muted-foreground text-center py-6">Couldn&rsquo;t find that application.</p>
      </UploadModalShell>
    )
  }

  const closed = isApplicationClosed(app.status)

  return (
    <UploadModalShell onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-start justify-between gap-3 mb-1 pr-6">
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight">{app.companyName}</h2>
          <p className="text-sm text-muted-foreground">{app.role}</p>
        </div>
        <ApplicationStatusBadge status={app.status} />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{getApplicationJourneyState(app).label}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-6 mt-2">
        <span className="inline-flex items-center gap-1"><Briefcase className="w-3 h-3" /> {app.opportunityType}</span>
        <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> Applied {app.applicationDate}</span>
        {app.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {app.location}</span>}
      </div>

      <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recruitment Journey</p>

        {app.rounds.map((round, i) => (
          <div key={round.id} className="p-3 rounded-xl" style={{ background: 'var(--muted-surface)' }}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div>
                <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider block">Round {i + 1}</span>
                <span className="text-sm font-medium text-foreground">{round.displayName}</span>
              </div>
              <RoundOutcomeBadge outcome={round.outcome} />
            </div>
            <div className="flex items-center gap-2">
              <Select value={round.outcome} onValueChange={v => handleOutcomeChange(round.id, v as RoundOutcome)} disabled={closed}>
                <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OUTCOME_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {reflectingRoundId === round.id && (
              <ExitReasonPrompt
                initialReason={round.exitReason}
                initialNotes={round.outcomeNotes ?? ''}
                onCancel={() => setReflectingRoundId(null)}
                onSubmit={(reason, notes) => handleExitReason(round.id, reason, notes)}
              />
            )}

            {round.outcome === 'eliminated' && reflectingRoundId !== round.id && (
              <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--divider)' }}>
                {round.exitReason ? (
                  <>
                    <p className="text-[11px] text-muted-foreground">
                      Exit reason: <span className="text-foreground font-medium">{exitReasonLabel(round.exitReason)}</span>
                    </p>
                    {round.outcomeNotes && <p className="text-[11px] text-muted-foreground mt-1">{round.outcomeNotes}</p>}
                    <button onClick={() => setReflectingRoundId(round.id)} className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors mt-1">
                      Edit
                    </button>
                  </>
                ) : (
                  <button onClick={() => setReflectingRoundId(round.id)} className="text-[11px] text-amber-500 dark:text-amber-400 hover:underline">
                    Add an exit reason
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {!closed && (
          <div className="p-2.5 rounded-xl border border-dashed" style={{ borderColor: 'var(--divider)' }}>
            <div className="flex items-center gap-2">
              <Input
                value={newRoundName}
                onChange={e => { setNewRoundName(e.target.value); setNewRoundCategory(inferRoundType(e.target.value)) }}
                placeholder="New round name"
                className="h-8 text-xs flex-1"
              />
              <Button type="button" variant="outline" size="sm" className="h-8 px-2 shrink-0" onClick={handleAddRound} disabled={!newRoundName.trim()}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            {newRoundName.trim().length > 0 && newRoundCategory === null && (
              <div className="mt-2">
                <p className="text-[11px] text-muted-foreground mb-1.5">What type of round is this?</p>
                <Select value="" onValueChange={v => setNewRoundCategory(v as RoundType)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Choose a type" /></SelectTrigger>
                  <SelectContent>
                    {ROUND_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {app.notes && (
          <div>
            <Label className="text-xs mb-1 block">Notes</Label>
            <p className="text-sm text-muted-foreground">{app.notes}</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 mt-4 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-6">
        <Button variant="ghost" onClick={onClose}>Close</Button>
        {!closed && (
          <>
            {/* An offer is an outcome, not a round to clear — there's no
                "Final Result" stage left to mark, so it's recorded here. */}
            <Button variant="outline" className="flex-1 text-emerald-600 dark:text-emerald-400" onClick={handleMarkOffer}>
              Offer Received
            </Button>
            <Button variant="outline" className="flex-1 text-red-500 hover:text-red-400" onClick={handleWithdraw}>
              Mark as Withdrawn
            </Button>
          </>
        )}
      </div>
    </UploadModalShell>
  )
}

// Recorded against the round the student exited at. The reason is required
// — it's the entire basis of the Exit Reason breakdown in Insights, and an
// elimination with no cause tells the student nothing they didn't already
// know. The free-text note stays optional.
function ExitReasonPrompt({
  initialReason,
  initialNotes,
  onSubmit,
  onCancel,
}: {
  initialReason: ExitReason | null
  initialNotes: string
  onSubmit: (reason: ExitReason, notes: string | null) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState<ExitReason | null>(initialReason)
  const [notes, setNotes] = useState(initialNotes)

  return (
    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--divider)' }}>
      <p className="text-xs text-muted-foreground mb-2">What ended this one? <span className="opacity-70">(helps spot your pattern)</span></p>
      <Select value={reason ?? ''} onValueChange={v => setReason(v as ExitReason)}>
        <SelectTrigger className="h-8 text-xs mb-2"><SelectValue placeholder="Choose a reason" /></SelectTrigger>
        <SelectContent>
          {EXIT_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="What happened? (optional)" className="h-8 text-xs mb-2" />
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="button" variant="outline" size="sm" disabled={!reason} onClick={() => reason && onSubmit(reason, notes.trim() || null)}>
          Save
        </Button>
      </div>
    </div>
  )
}
