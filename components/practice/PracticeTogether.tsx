'use client'

// Top-level Practice Together shell: one fetch shared by both tabs, and a
// single refresh() after every mutation so participant counts, button
// states and the queue all move together — the same "fetch once, derive in
// memory" convention as TeamUp and Placement Tracker.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { AlertTriangle, Plus, MessagesSquare } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { PracticeSessionCard } from './PracticeSessionCard'
import { CreateSessionModal } from './CreateSessionModal'
import { SessionDetailModal } from './SessionDetailModal'
import { RequestToJoinModal } from './RequestToJoinModal'
import { PracticeActivity } from './PracticeActivity'
import { getMyRequests, getSessions, withdrawRequest } from '@/lib/practiceTogether/api'
import { DISCOVER_FILTERS } from '@/lib/practiceTogether/constants'
import { isDiscoverable, isPast } from '@/lib/practiceTogether/session'
import { describeSaveError } from '@/lib/onboarding/errors'
import type { JoinRequestStatus, PracticeJoinRequest, PracticeSession, PracticeType } from '@/lib/practiceTogether/types'

type Status = 'loading' | 'ready' | 'error'
type MyTab = 'upcoming' | 'hosted' | 'requests' | 'past'

function isMissingTableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { code?: string; message?: string }
  return e.code === '42P01' || /relation .* does not exist/i.test(e.message ?? '')
}

function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <GlassCard className="p-10 text-center">
      <MessagesSquare className="w-7 h-7 text-indigo-400 mx-auto mb-3" />
      <h3 className="text-base font-semibold font-display mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">{body}</p>
      {action}
    </GlassCard>
  )
}

export function PracticeTogether({
  userId,
  initialSessionId,
  initialPracticeType,
}: {
  userId: string
  initialSessionId?: string
  /** Arrives from `/practice?practiceType=…`, e.g. a Placement Tracker recommendation. */
  initialPracticeType?: PracticeType
}) {
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [myRequests, setMyRequests] = useState<PracticeJoinRequest[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [errorDetail, setErrorDetail] = useState('')
  const [missingTable, setMissingTable] = useState(false)

  const [tab, setTab] = useState<'discover' | 'mine'>('discover')
  const [myTab, setMyTab] = useState<MyTab>('upcoming')
  const [filter, setFilter] = useState<PracticeType | 'all'>(initialPracticeType ?? 'all')

  const [showCreate, setShowCreate] = useState(false)
  // Preselects the format in the create modal when it's opened from a
  // filtered/recommended context.
  const [createType, setCreateType] = useState<PracticeType | undefined>(undefined)
  const [detailId, setDetailId] = useState<string | null>(initialSessionId ?? null)
  const [requestFor, setRequestFor] = useState<PracticeSession | null>(null)
  const { toast } = useToast()

  const refresh = useCallback(() => {
    Promise.all([getSessions(), getMyRequests(userId)])
      .then(([s, r]) => { setSessions(s); setMyRequests(r); setStatus('ready') })
      .catch(err => {
        setErrorDetail(describeSaveError(err))
        setMissingTable(isMissingTableError(err))
        setStatus('error')
      })
  }, [userId])

  useEffect(() => { refresh() }, [refresh])

  // The viewer's latest request per session, which is what decides each
  // card's button. Latest wins so a withdrawal doesn't leave a stale
  // "pending" behind.
  const requestBySession = useMemo(() => {
    const map = new Map<string, JoinRequestStatus>()
    for (const r of myRequests) if (!map.has(r.sessionId)) map.set(r.sessionId, r.status)
    return map
  }, [myRequests])

  const isParticipant = useCallback(
    (s: PracticeSession) => s.participants.some(p => p.userId === userId),
    [userId],
  )

  const discover = useMemo(
    () => sessions
      .filter(s => isDiscoverable(s))
      .filter(s => filter === 'all' || s.practiceType === filter),
    [sessions, filter],
  )

  const mine = useMemo(() => {
    const hosted = sessions.filter(s => s.creatorId === userId)
    const joined = sessions.filter(s => isParticipant(s) && s.creatorId !== userId)
    const active = [...hosted, ...joined]
    return {
      hosted,
      upcoming: active.filter(s => !isPast(s) && s.status !== 'cancelled'),
      past: active.filter(s => isPast(s) || s.status === 'cancelled' || s.status === 'completed'),
      requests: myRequests
        .filter(r => r.status === 'pending')
        .map(r => ({ request: r, session: sessions.find(s => s.id === r.sessionId) }))
        .filter((x): x is { request: PracticeJoinRequest; session: PracticeSession } => !!x.session),
    }
  }, [sessions, myRequests, userId, isParticipant])

  const detail = detailId ? sessions.find(s => s.id === detailId) ?? null : null
  const filterLabel = DISCOVER_FILTERS.find(f => f.value === filter)?.label ?? 'Practice'

  const handleWithdraw = async (sessionId: string) => {
    const request = myRequests.find(r => r.sessionId === sessionId && r.status === 'pending')
    if (!request) return
    try {
      await withdrawRequest(request.id)
      refresh()
      toast({ title: 'Request withdrawn' })
    } catch (err) {
      toast({ title: "Couldn't withdraw request", description: describeSaveError(err), variant: 'destructive' })
    }
  }

  if (status === 'error') {
    return (
      <GlassCard className="p-10 text-center">
        <AlertTriangle className="w-7 h-7 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-1">Couldn&rsquo;t load Practice Together.</p>
        {missingTable ? (
          <p className="text-xs text-muted-foreground/80 max-w-sm mx-auto mb-4">
            The Practice Together tables haven&rsquo;t been set up yet — run{' '}
            <code className="text-[11px] px-1 py-0.5 rounded" style={{ background: 'var(--muted-surface)' }}>
              supabase/practice-together-migration.sql
            </code>{' '}
            in your Supabase SQL editor first.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/80 max-w-sm mx-auto mb-4">{errorDetail}</p>
        )}
        <button onClick={refresh} className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">Try again</button>
      </GlassCard>
    )
  }

  if (status === 'loading') {
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-56 rounded-2xl animate-pulse" style={{ background: 'var(--muted-surface)' }} />
        ))}
      </div>
    )
  }

  const createButton = (
    <Button variant="gradient" className="gap-2" onClick={() => setShowCreate(true)}>
      <Plus className="w-4 h-4" />
      Create Practice Session
    </Button>
  )

  const cardFor = (session: PracticeSession) => (
    <PracticeSessionCard
      key={session.id}
      session={session}
      viewerId={userId}
      requestStatus={requestBySession.get(session.id) ?? null}
      onView={() => setDetailId(session.id)}
      onManage={() => setDetailId(session.id)}
    />
  )

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Practice Together</h1>
          <p className="text-sm text-muted-foreground mt-1">Find the right people. Practice together. Get better.</p>
        </div>
        <div className="shrink-0">{createButton}</div>
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as 'discover' | 'mine')}>
        <TabsList className="flex-nowrap w-max sm:w-auto h-11 mb-5">
          <TabsTrigger value="discover" className="shrink-0">Discover Practice</TabsTrigger>
          <TabsTrigger value="mine" className="shrink-0">My Practice</TabsTrigger>
        </TabsList>

        <TabsContent value="discover">
          {/* Filters scroll horizontally rather than wrapping on a phone. */}
          <div className="overflow-x-auto pb-1 mb-4">
            <div className="flex gap-1.5 w-max">
              {DISCOVER_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap border transition-colors ${
                    filter === f.value
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  style={filter === f.value ? undefined : { background: 'var(--muted-surface)' }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {discover.length === 0 ? (
            // With a filter active, the useful offer is to start *that*
            // format — the student arrived here wanting it (§13).
            filter !== 'all' ? (
              <EmptyState
                title={`No ${filterLabel.toLowerCase()} practice sessions are currently available.`}
                body="Want to start one? Others looking for the same practice will be able to find it."
                action={
                  <Button variant="gradient" className="gap-2" onClick={() => { setCreateType(filter); setShowCreate(true) }}>
                    <Plus className="w-4 h-4" />
                    Create {filterLabel} Session
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title="No practice sessions found."
                body="Try adjusting your filters or create a practice session."
                action={createButton}
              />
            )
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">{discover.map(cardFor)}</div>
          )}
        </TabsContent>

        <TabsContent value="mine">
          {/* Sits above the sub-tabs: it describes the student's practice as
              a whole, not any one slice of it. */}
          <div className="mb-5">
            <PracticeActivity sessions={sessions} userId={userId} />
          </div>

          <Tabs value={myTab} onValueChange={v => setMyTab(v as MyTab)}>
            <TabsList className="flex-nowrap w-max h-10 mb-4">
              <TabsTrigger value="upcoming" className="shrink-0">Upcoming</TabsTrigger>
              <TabsTrigger value="hosted" className="shrink-0">Hosted</TabsTrigger>
              <TabsTrigger value="requests" className="shrink-0">Pending Requests</TabsTrigger>
              <TabsTrigger value="past" className="shrink-0">Past</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {mine.upcoming.length === 0
                ? <EmptyState title="No upcoming practice sessions yet." body="Find a practice session and start preparing together." action={createButton} />
                : <div className="grid sm:grid-cols-2 gap-4">{mine.upcoming.map(cardFor)}</div>}
            </TabsContent>

            <TabsContent value="hosted">
              {mine.hosted.length === 0
                ? <EmptyState title="You haven't hosted a session yet." body="Create one and invite others to practise with you." action={createButton} />
                : <div className="grid sm:grid-cols-2 gap-4">{mine.hosted.map(cardFor)}</div>}
            </TabsContent>

            <TabsContent value="requests">
              {mine.requests.length === 0
                ? <EmptyState title="No pending requests." body="Requests you send will appear here until a host responds." />
                : <div className="grid sm:grid-cols-2 gap-4">{mine.requests.map(({ session }) => cardFor(session))}</div>}
            </TabsContent>

            <TabsContent value="past">
              {mine.past.length === 0
                ? <EmptyState title="Nothing here yet." body="Sessions you've completed or cancelled will show up here." />
                : <div className="grid sm:grid-cols-2 gap-4">{mine.past.map(cardFor)}</div>}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      <AnimatePresence>
        {showCreate && (
          <CreateSessionModal
            userId={userId}
            initialPracticeType={createType}
            onClose={() => { setShowCreate(false); setCreateType(undefined) }}
            onCreated={id => { setShowCreate(false); refresh(); setDetailId(id); toast({ title: 'Practice session created' }) }}
          />
        )}
        {detail && (
          <SessionDetailModal
            session={detail}
            viewerId={userId}
            requestStatus={requestBySession.get(detail.id) ?? null}
            onClose={() => setDetailId(null)}
            onChanged={refresh}
            onRequest={() => { setRequestFor(detail); setDetailId(null) }}
            onWithdraw={() => { handleWithdraw(detail.id); setDetailId(null) }}
          />
        )}
        {requestFor && (
          <RequestToJoinModal
            session={requestFor}
            userId={userId}
            onClose={() => setRequestFor(null)}
            onSent={() => { setRequestFor(null); refresh(); toast({ title: 'Request sent' }) }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
