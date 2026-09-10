'use client'

// Session detail, which doubles as Manage Session for the host — the same
// information with the host's controls attached, rather than a second
// screen that could drift out of sync with this one.

import { useEffect, useState } from 'react'
import { AlertTriangle, Calendar, Clock, ExternalLink, Loader2, MapPin, Users, Video } from 'lucide-react'
import { UploadModalShell } from '@/components/workspace/UploadModalShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { useToast } from '@/components/ui/use-toast'
import {
  acceptRequest, cancelSession, completeSession, declineRequest, getMeetingLink,
  getSessionRequests, leaveSession, removeParticipant, updateSessionDetails,
} from '@/lib/practiceTogether/api'
import { normaliseMeetingLink, validateMeetingLink } from '@/lib/practiceTogether/meetingLink'
import { practiceTypeLabel } from '@/lib/practiceTogether/constants'
import {
  canAcceptAnotherRequest, formatDuration, formatWhen, isPast, viewerStateFor,
} from '@/lib/practiceTogether/session'
import { getUniversity } from '@/lib/universities'
import { describeSaveError } from '@/lib/onboarding/errors'
import type { JoinRequestStatus, PracticeJoinRequest, PracticeSession } from '@/lib/practiceTogether/types'

function collegeOf(universityId: string | null | undefined): string | null {
  return universityId ? getUniversity(universityId)?.shortName ?? null : null
}

export function SessionDetailModal({
  session,
  viewerId,
  requestStatus,
  onClose,
  onChanged,
  onRequest,
  onWithdraw,
}: {
  session: PracticeSession
  viewerId: string | null
  requestStatus: JoinRequestStatus | null
  onClose: () => void
  onChanged: () => void
  onRequest: () => void
  onWithdraw: () => void
}) {
  const state = viewerStateFor(session, viewerId, requestStatus)
  const [requests, setRequests] = useState<PracticeJoinRequest[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // The link never arrives with the session (it isn't selected), so members
  // fetch it separately — the RPC returns null to anyone who isn't one.
  const [savedLink, setSavedLink] = useState<string | null>(null)
  const [linkDraft, setLinkDraft] = useState('')
  const [titleDraft, setTitleDraft] = useState(session.title)
  const [descriptionDraft, setDescriptionDraft] = useState(session.description ?? '')
  const [locationDraft, setLocationDraft] = useState(session.location ?? '')
  const [confirm, setConfirm] = useState<null | { kind: 'leave' } | { kind: 'cancel' } | { kind: 'remove'; userId: string; name: string }>(null)
  const { toast } = useToast()

  // Only the host can read the queue (RLS enforces it), so only the host asks.
  useEffect(() => {
    if (!state.canManage) return
    getSessionRequests(session.id).then(setRequests).catch(() => setRequests([]))
  }, [state.canManage, session.id])

  const isMember = state.canManage || state.relationship === 'participant'

  useEffect(() => {
    if (session.mode !== 'online' || !isMember) return
    getMeetingLink(session.id)
      .then(link => { setSavedLink(link); setLinkDraft(link ?? '') })
      .catch(() => setSavedLink(null))
  }, [session.id, session.mode, isMember])

  const run = async (fn: () => Promise<void>, successMessage?: string) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      if (state.canManage) getSessionRequests(session.id).then(setRequests).catch(() => {})
      onChanged()
      if (successMessage) toast({ title: successMessage })
    } catch (err) {
      // Capacity and ownership are re-checked in the database, so a stale
      // button surfaces the real reason here instead of silently failing.
      setError(describeSaveError(err))
    } finally {
      setBusy(false)
    }
  }

  const pending = (requests ?? []).filter(r => r.status === 'pending')
  const seatsLeft = session.maxParticipants - session.currentParticipants
  const canAccept = canAcceptAnotherRequest(session)
  const linkDirty = normaliseMeetingLink(linkDraft) !== (savedLink ?? '')
  const linkDraftError = validateMeetingLink(linkDraft)

  const detailsDirty =
    titleDraft.trim() !== session.title
    || descriptionDraft.trim() !== (session.description ?? '')
    || (session.mode === 'offline' && locationDraft.trim() !== (session.location ?? ''))
  // A session still needs a name, and an offline one still needs somewhere
  // to go — the same rules creation enforces.
  const detailsValid =
    titleDraft.trim().length > 0
    && (session.mode !== 'offline' || locationDraft.trim().length > 0)

  return (
    <>
      <UploadModalShell onClose={onClose} maxWidth="max-w-lg">
        <div className="pr-6 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
            {state.canManage ? 'Manage Session' : practiceTypeLabel(session.practiceType, session.customPracticeType)}
          </span>
          <h2 className="text-xl font-bold font-display tracking-tight">{session.title}</h2>
          <p className="text-sm text-muted-foreground">
            Hosted by {session.creator?.fullName ?? 'A student'}
            {collegeOf(session.creator?.universityId) ? ` · ${collegeOf(session.creator?.universityId)}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground my-4">
          <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{formatWhen(session)}</span>
          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(session.durationMinutes)}</span>
          <span className="inline-flex items-center gap-1">
            {session.mode === 'online' ? <><Video className="w-3 h-3" />Online</> : <><MapPin className="w-3 h-3" />{session.location}</>}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="w-3 h-3" />{session.currentParticipants} / {session.maxParticipants}
          </span>
          {session.experienceLevel !== 'any' && <span className="capitalize">{session.experienceLevel}</span>}
        </div>

        <div className="max-h-[52vh] overflow-y-auto pr-1 space-y-4">
          {session.description && <p className="text-sm text-muted-foreground">{session.description}</p>}

          {Object.keys(session.typeSpecific).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(session.typeSpecific).map(([k, v]) => (
                <Badge key={k} variant="secondary">{v}</Badge>
              ))}
            </div>
          )}

          {/* Members get a button, not a URL to copy out of a field. The
              host gets it too, so they can open their own room quickly. */}
          {session.mode === 'online' && isMember && savedLink && (
            <Button asChild variant="gradient-outline" size="sm" className="w-full gap-1.5">
              <a href={savedLink} target="_blank" rel="noopener noreferrer">
                Join Meeting <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          )}

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Participants ({session.currentParticipants}/{session.maxParticipants})
            </p>
            <div className="space-y-1.5">
              {session.participants.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl" style={{ background: 'var(--muted-surface)' }}>
                  <div className="min-w-0">
                    <span className="text-sm text-foreground">{p.profile?.fullName ?? 'A student'}</span>
                    {collegeOf(p.profile?.universityId) && (
                      <span className="text-xs text-muted-foreground ml-1.5">· {collegeOf(p.profile?.universityId)}</span>
                    )}
                  </div>
                  {p.role === 'host'
                    ? <Badge variant="indigo">Host</Badge>
                    : state.canManage && (
                      <button
                        onClick={() => setConfirm({ kind: 'remove', userId: p.userId, name: p.profile?.fullName ?? 'this participant' })}
                        className="text-xs text-red-500 hover:text-red-400 transition-colors shrink-0"
                      >
                        Remove
                      </button>
                    )}
                </div>
              ))}
            </div>
          </div>

          {/* Host-only: the approval queue and the meeting link editor. */}
          {state.canManage && (
            <>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Pending Requests {pending.length > 0 && `(${pending.length})`}
                </p>
                {requests === null ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                ) : pending.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending requests.</p>
                ) : (
                  <div className="space-y-2">
                    {pending.map(r => (
                      <div key={r.id} className="p-3 rounded-xl" style={{ background: 'var(--muted-surface)' }}>
                        <div className="text-sm text-foreground">
                          {r.profile?.fullName ?? 'A student'}
                          {collegeOf(r.profile?.universityId) && (
                            <span className="text-xs text-muted-foreground ml-1.5">· {collegeOf(r.profile?.universityId)}</span>
                          )}
                        </div>
                        {r.message && <p className="text-xs text-muted-foreground mt-1">{r.message}</p>}
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="gradient" disabled={busy || !canAccept}
                            onClick={() => run(() => acceptRequest(r.id), 'Request accepted')}>
                            Accept
                          </Button>
                          <Button size="sm" variant="ghost" disabled={busy}
                            onClick={() => run(() => declineRequest(r.id), 'Request declined')}>
                            Decline
                          </Button>
                        </div>
                        {!canAccept && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5">
                            This session is full — free a spot before accepting.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Practice Activity counts completed sessions only, so this
                  is what feeds it. Deliberately asked rather than inferred:
                  a scheduled time passing is not evidence anyone showed up. */}
              {isPast(session) && (session.status === 'open' || session.status === 'full') && (
                <div className="p-3 rounded-xl" style={{ background: 'var(--muted-surface)' }}>
                  <p className="text-sm text-foreground mb-1">Did this practice session happen?</p>
                  <p className="text-[11px] text-muted-foreground mb-2.5">
                    Completed sessions count towards your Practice Activity.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="gradient" disabled={busy}
                      onClick={() => run(() => completeSession(session.id), 'Session marked completed')}>
                      Yes, completed
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busy}
                      onClick={() => setConfirm({ kind: 'cancel' })}>
                      No, it didn&rsquo;t happen
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs mb-1.5 block">Session details</Label>
                <div className="space-y-2">
                  <Input value={titleDraft} onChange={e => setTitleDraft(e.target.value)}
                    placeholder="Session title" className="h-9 text-xs" />
                  <textarea
                    value={descriptionDraft}
                    onChange={e => setDescriptionDraft(e.target.value)}
                    rows={2}
                    placeholder="What you're looking for (optional)"
                    style={{ borderColor: 'var(--divider)', background: 'var(--muted-surface)', outline: 'none' }}
                    className="w-full rounded-xl border px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:border-indigo-500/60 focus-visible:shadow-[inset_0_0_0_1px_rgba(99,102,241,0.45)] transition-all resize-none"
                  />
                  {session.mode === 'offline' && (
                    <Input value={locationDraft} onChange={e => setLocationDraft(e.target.value)}
                      placeholder="Location" className="h-9 text-xs" />
                  )}
                  <Button
                    size="sm" variant="outline" className="h-9"
                    disabled={busy || !detailsDirty || !detailsValid}
                    onClick={() => run(
                      () => updateSessionDetails(session.id, {
                        title: titleDraft.trim(),
                        description: descriptionDraft.trim() || null,
                        ...(session.mode === 'offline' ? { location: locationDraft.trim() } : {}),
                      }),
                      'Session details saved',
                    )}
                  >
                    Save details
                  </Button>
                </div>
              </div>

              {/* Online only: an offline session has no link section at all. */}
              {session.mode === 'online' && (
                <div>
                  <Label className="text-xs mb-1.5 block">
                    Meeting Link
                    <span className="text-muted-foreground font-normal ml-1.5">— only you and joined participants can see this</span>
                  </Label>
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 min-w-0">
                      <Input
                        value={linkDraft}
                        onChange={e => setLinkDraft(e.target.value)}
                        placeholder="https://meet.google.com/..."
                        className={`h-9 text-xs ${linkDirty && linkDraftError ? 'border-red-500/60' : ''}`}
                      />
                      {linkDirty && linkDraftError && (
                        <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">{linkDraftError.message}</p>
                      )}
                    </div>
                    <Button
                      size="sm" variant="outline" className="h-9 shrink-0"
                      // Only live once the value actually changed and is
                      // valid — an active online session must never be left
                      // without a working link.
                      disabled={busy || !linkDirty || !!linkDraftError}
                      onClick={() => run(
                        () => updateSessionDetails(session.id, { meetingLink: normaliseMeetingLink(linkDraft) })
                          .then(() => { setSavedLink(normaliseMeetingLink(linkDraft)) }),
                        'Meeting link saved',
                      )}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </>
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
          {state.action === 'request' && (
            <Button variant="gradient" className="flex-1" onClick={onRequest}>Request to Join</Button>
          )}
          {state.action === 'pending' && (
            <>
              <Button variant="outline" className="flex-1" disabled>Request Pending</Button>
              <Button variant="ghost" className="text-muted-foreground" onClick={onWithdraw}>Withdraw</Button>
            </>
          )}
          {state.action === 'full' && <Button variant="outline" className="flex-1" disabled>Session Full</Button>}
          {state.canLeave && (
            <Button variant="outline" className="flex-1 text-red-500 hover:text-red-400" onClick={() => setConfirm({ kind: 'leave' })}>
              Leave Session
            </Button>
          )}
          {state.canManage && session.status !== 'cancelled' && (
            <Button variant="outline" className="flex-1 text-red-500 hover:text-red-400" onClick={() => setConfirm({ kind: 'cancel' })}>
              Cancel Session
            </Button>
          )}
        </div>
        {state.canManage && seatsLeft > 0 && session.status === 'open' && (
          <p className="text-[11px] text-muted-foreground mt-2">
            {seatsLeft} {seatsLeft === 1 ? 'spot' : 'spots'} still open.
          </p>
        )}
      </UploadModalShell>

      {confirm?.kind === 'leave' && (
        <ConfirmModal
          title="Leave this session?"
          description="Your spot will be freed up for someone else, and the host will be notified."
          confirmLabel="Leave Session"
          onClose={() => setConfirm(null)}
          onConfirm={() => viewerId && run(() => leaveSession(session.id, viewerId), 'You left the session')}
        />
      )}
      {confirm?.kind === 'cancel' && (
        <ConfirmModal
          title="Cancel this practice session?"
          description="This action will notify all confirmed participants."
          confirmLabel="Cancel Session"
          onClose={() => setConfirm(null)}
          onConfirm={() => run(() => cancelSession(session.id), 'Session cancelled')}
        />
      )}
      {confirm?.kind === 'remove' && (
        <ConfirmModal
          title={`Remove ${confirm.name} from this practice session?`}
          description="This will free up a participant spot."
          confirmLabel="Remove Participant"
          onClose={() => setConfirm(null)}
          onConfirm={() => run(() => removeParticipant(session.id, confirm.userId), 'Participant removed')}
        />
      )}
    </>
  )
}
