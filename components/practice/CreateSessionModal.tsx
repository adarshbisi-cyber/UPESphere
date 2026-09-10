'use client'

// One form for every practice type. The type-specific questions come from
// PRACTICE_TYPE_CONFIG rather than a branch per type, so adding a practice
// format is a data entry rather than another arm of this component.

import { useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react'
import { UploadModalShell } from '@/components/workspace/UploadModalShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  COLLEGE_PREFERENCES, DURATION_OPTIONS, EXPERIENCE_LEVELS, PRACTICE_TYPES,
  PRACTICE_TYPE_CONFIG, SESSION_MODES, practiceTypeLabel,
} from '@/lib/practiceTogether/constants'
import { defaultCapacityFor, validateCapacity } from '@/lib/practiceTogether/session'
import { createSession } from '@/lib/practiceTogether/api'
import { normaliseMeetingLink, validateMeetingLink } from '@/lib/practiceTogether/meetingLink'
import { describeSaveError } from '@/lib/onboarding/errors'
import type {
  CollegePreference, ExperienceLevel, PracticeType, SessionMode,
} from '@/lib/practiceTogether/types'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function CreateSessionModal({
  userId,
  initialPracticeType,
  onClose,
  onCreated,
}: {
  userId: string
  /**
   * Preselects the format when the modal is opened from a recommendation,
   * so the student isn't asked to pick the thing they just clicked. Every
   * field stays editable — it's a starting point, not a lock (§14).
   */
  initialPracticeType?: PracticeType
  onClose: () => void
  onCreated: (sessionId: string) => void
}) {
  const [practiceType, setPracticeType] = useState<PracticeType>(initialPracticeType ?? 'case_prep')
  const [customType, setCustomType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayIso())
  const [startTime, setStartTime] = useState('19:00')
  const [duration, setDuration] = useState(60)
  const [mode, setMode] = useState<SessionMode>('online')
  const [location, setLocation] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [linkTouched, setLinkTouched] = useState(false)
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('any')
  const [collegePreference, setCollegePreference] = useState<CollegePreference>('any')
  const [capacity, setCapacity] = useState(() => defaultCapacityFor(initialPracticeType ?? 'case_prep'))
  const [typeSpecific, setTypeSpecific] = useState<Record<string, string>>({})

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const savingRef = useRef(false)

  const config = PRACTICE_TYPE_CONFIG[practiceType]

  // Switching type resets the answers and the capacity: a GD's format
  // question is meaningless on a case session, and its floor of 4 would
  // otherwise linger on a pair session.
  const changeType = (next: PracticeType) => {
    setPracticeType(next)
    setTypeSpecific({})
    setCapacity(defaultCapacityFor(next))
  }

  const capacityError = useMemo(
    () => validateCapacity(practiceType, capacity.min, capacity.max),
    [practiceType, capacity.min, capacity.max],
  )

  const resolvedTitle = title.trim() || `${practiceTypeLabel(practiceType, customType)} Practice`
  const customTypeMissing = practiceType === 'other' && customType.trim().length === 0
  const locationMissing = mode === 'offline' && location.trim().length === 0
  // Online sessions need somewhere to actually meet, the same way offline
  // ones need a location. The error is only surfaced once the host has
  // touched the field, so an untouched form isn't shouting at them.
  const linkError = mode === 'online' ? validateMeetingLink(meetingLink) : null
  const canSave = !capacityError && !customTypeMissing && !locationMissing && !linkError
    && date.length > 0 && startTime.length > 0

  const save = async () => {
    if (savingRef.current || !canSave) return
    savingRef.current = true
    setSaving(true)
    setError('')
    try {
      const id = await createSession(userId, {
        practiceType,
        customPracticeType: practiceType === 'other' ? customType.trim() : null,
        title: resolvedTitle,
        description: description.trim() || null,
        scheduledDate: date,
        startTime,
        durationMinutes: duration,
        mode,
        location: mode === 'offline' ? location.trim() : null,
        meetingLink: mode === 'online' ? normaliseMeetingLink(meetingLink) : null,
        experienceLevel,
        collegePreference,
        minParticipants: capacity.min,
        maxParticipants: capacity.max,
        typeSpecific,
      })
      onCreated(id)
    } catch (err) {
      setError(describeSaveError(err))
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <UploadModalShell onClose={onClose} maxWidth="max-w-lg">
      <h2 className="text-xl font-bold font-display tracking-tight mb-1.5 pr-6">Create Practice Session</h2>
      <p className="text-sm text-muted-foreground mb-6">Find the right people to practise with.</p>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <div>
          <Label className="text-xs mb-1.5 block">Practice Type *</Label>
          <div className="flex flex-wrap gap-1.5">
            {PRACTICE_TYPES.map(t => {
              const Icon = t.icon
              const active = t.value === practiceType
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => changeType(t.value)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                    active
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-indigo-500/5'
                  }`}
                  style={active ? undefined : { background: 'var(--muted-surface)' }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              )
            })}
          </div>
          {practiceType === 'other' && (
            <>
              <Label className="text-xs mb-1.5 mt-2 block">Specify Practice Type *</Label>
              <Input value={customType} onChange={e => setCustomType(e.target.value)} placeholder="e.g. Product Sense" />
            </>
          )}
        </div>

        <div>
          <Label className="text-xs mb-1.5 block">Session Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={resolvedTitle} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs mb-1.5 block">Date *</Label>
            <Input type="date" value={date} min={todayIso()} onChange={e => setDate(e.target.value)}
              style={{ borderColor: 'var(--divider)', background: 'var(--muted-surface)' }} />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Start Time *</Label>
            <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
              style={{ borderColor: 'var(--divider)', background: 'var(--muted-surface)' }} />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Duration</Label>
            <Select value={String(duration)} onValueChange={v => setDuration(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map(d => <SelectItem key={d} value={String(d)}>{d} minutes</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1.5 block">Mode</Label>
            <Select value={mode} onValueChange={v => setMode(v as SessionMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SESSION_MODES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {mode === 'offline' && (
            <div>
              <Label className="text-xs mb-1.5 block">Location *</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Library, Block B" />
            </div>
          )}
        </div>

        {/* Online only — an offline session never shows an empty link field. */}
        {mode === 'online' && (
          <div>
            <Label className="text-xs mb-1.5 block">Meeting Link *</Label>
            <Input
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              onBlur={() => setLinkTouched(true)}
              placeholder="https://meet.google.com/..."
              className={linkTouched && linkError ? 'border-red-500/60' : undefined}
            />
            <p className={`text-[11px] mt-1 ${linkTouched && linkError ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground'}`}>
              {linkTouched && linkError
                ? linkError.message
                : 'Add the link participants will use to join your online practice session. Only you and joined participants can see it.'}
            </p>
          </div>
        )}

        {/* Type-specific questions, declared in PRACTICE_TYPE_CONFIG. */}
        {config.fields.map(field => (
          <div key={field.key}>
            <Label className="text-xs mb-1.5 block">{field.label}</Label>
            <Select
              value={typeSpecific[field.key] ?? ''}
              onValueChange={v => setTypeSpecific(prev => ({ ...prev, [field.key]: v }))}
            >
              <SelectTrigger><SelectValue placeholder={`Choose ${field.label.toLowerCase()}`} /></SelectTrigger>
              <SelectContent>
                {field.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1.5 block">Preferred Experience Level</Label>
            <Select value={experienceLevel} onValueChange={v => setExperienceLevel(v as ExperienceLevel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPERIENCE_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">College Preference</Label>
            <Select value={collegePreference} onValueChange={v => setCollegePreference(v as CollegePreference)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COLLEGE_PREFERENCES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {config.capacityEditable ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block">Minimum Participants</Label>
              <Input type="number" min={2} value={capacity.min}
                onChange={e => setCapacity(c => ({ ...c, min: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Maximum Participants</Label>
              <Input type="number" min={2} value={capacity.max}
                onChange={e => setCapacity(c => ({ ...c, max: Number(e.target.value) }))} />
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            This format is a pair session — you and one other person.
          </p>
        )}

        {capacityError && (
          <p className="text-xs text-amber-600 dark:text-amber-400">{capacityError.message}</p>
        )}

        <div>
          <Label className="text-xs mb-1.5 block">Description</Label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Looking for someone to practice intermediate consulting cases with. We can alternate between interviewer and candidate."
            style={{ borderColor: 'var(--divider)', background: 'var(--muted-surface)' }}
            className="w-full rounded-xl border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 mt-4 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="gradient" className="flex-1 gap-2" disabled={!canSave || saving} onClick={save}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Session <ArrowRight className="w-4 h-4" /></>}
        </Button>
      </div>
    </UploadModalShell>
  )
}
