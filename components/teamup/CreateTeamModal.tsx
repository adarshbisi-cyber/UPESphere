'use client'

import { useEffect, useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { UploadModalShell } from '@/components/workspace/UploadModalShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { describeSaveError } from '@/lib/onboarding/errors'
import { SkillPicker } from '@/components/teamup/SkillPicker'
import {
  getCompetitionTypes, getSkills, createTeam, isSafeHttpUrl,
  type CompetitionType, type Skill, type ExperiencePreference,
} from '@/lib/teamup/api'

const EXPERIENCE_OPTIONS: ExperiencePreference[] = [
  'Beginner Friendly', 'Some Experience Preferred', 'Experienced Participants Preferred',
]

const selectClass = 'w-full h-10 rounded-xl border px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50'
// Native <select>s get extra right padding beyond selectClass's own px-3 so a
// long selected value (e.g. "Coding Competition") never runs into the
// browser's own dropdown-arrow affordance.
const nativeSelectClass = `${selectClass} pr-8`
const selectStyle = { borderColor: 'var(--divider)', background: 'var(--muted-surface)' } as const
const textareaClass = 'w-full rounded-xl border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 resize-none'

export function CreateTeamModal({
  userId,
  onClose,
  onCreated,
}: {
  userId: string
  onClose: () => void
  onCreated: () => void
}) {
  const { toast } = useToast()
  const [types, setTypes] = useState<CompetitionType[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loadingLookups, setLoadingLookups] = useState(true)

  const [competitionName, setCompetitionName] = useState('')
  const [competitionTypeId, setCompetitionTypeId] = useState('')
  const [competitionPlatform, setCompetitionPlatform] = useState('')
  const [competitionUrl, setCompetitionUrl] = useState('')
  const [deadline, setDeadline] = useState('')
  // Raw strings, not numbers — 1 and 2 are validation minimums, never
  // defaults, so both fields start genuinely empty. Parsed to numbers only
  // where needed for validation/display/submission below.
  const [maxMembers, setMaxMembers] = useState('')
  const [currentMembers, setCurrentMembers] = useState('')
  const [experiencePreference, setExperiencePreference] = useState<ExperiencePreference | ''>('')
  const [description, setDescription] = useState('')
  const [additionalRequirements, setAdditionalRequirements] = useState('')
  const [skillIds, setSkillIds] = useState<string[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [submitAttempted, setSubmitAttempted] = useState(false)

  useEffect(() => {
    Promise.all([getCompetitionTypes(), getSkills()])
      .then(([t, s]) => { setTypes(t); setSkills(s); if (t[0]) setCompetitionTypeId(t[0].id) })
      .catch(() => setError('Could not load competition types and skills. Try reopening this form.'))
      .finally(() => setLoadingLookups(false))
  }, [])

  const todayStr = new Date().toISOString().slice(0, 10)

  const currentTrimmed = currentMembers.trim()
  const maxTrimmed = maxMembers.trim()
  const currentParsed = currentTrimmed === '' ? null : Number(currentTrimmed)
  const maxParsed = maxTrimmed === '' ? null : Number(maxTrimmed)
  const currentNum = currentParsed !== null && Number.isFinite(currentParsed) ? currentParsed : null
  const maxNum = maxParsed !== null && Number.isFinite(maxParsed) ? maxParsed : null

  // Live range errors — fire as soon as a concrete out-of-range number is
  // present, regardless of whether Publish has been pressed yet.
  const currentMinError = currentNum !== null && currentNum < 1 ? 'Current team size must be at least 1.' : null
  const maxMinError = maxNum !== null && maxNum < 2 ? 'Maximum team size must be at least 2.' : null

  const exceedsMax = currentNum !== null && maxNum !== null && currentNum > maxNum
  const teamAlreadyComplete = currentNum !== null && maxNum !== null && !exceedsMax && currentNum === maxNum
  const relationshipError = exceedsMax
    ? 'Current team size cannot exceed maximum team size.'
    : teamAlreadyComplete
    ? 'Your team is already complete.'
    : null

  // "Required" errors only surface after a Publish attempt — a blank field
  // on first render is the expected starting state, not yet an error.
  const currentRequiredError = submitAttempted && currentTrimmed === '' ? 'Current team size is required.' : null
  const maxRequiredError = submitAttempted && maxTrimmed === '' ? 'Maximum team size is required.' : null

  const currentError = currentMinError ?? currentRequiredError
  const maxError = maxMinError ?? maxRequiredError

  const membersNeeded =
    currentNum !== null && maxNum !== null && !currentMinError && !maxMinError && !exceedsMax && !teamAlreadyComplete
      ? maxNum - currentNum
      : null

  const teamSizeValid =
    currentNum !== null && maxNum !== null &&
    currentNum >= 1 && maxNum >= 2 && currentNum < maxNum

  // Team-size validity is intentionally excluded here so the Publish button
  // stays clickable even while team size is empty/invalid — handleSubmit's
  // own guard blocks the actual submission and reveals the inline messages.
  const otherFieldsValid =
    competitionName.trim().length > 0 &&
    competitionTypeId.length > 0 &&
    deadline.length > 0 && deadline >= todayStr &&
    description.trim().length > 0 &&
    skillIds.length > 0 &&
    (!competitionUrl.trim() || isSafeHttpUrl(competitionUrl.trim()))

  const canSubmit = otherFieldsValid && teamSizeValid

  const handleSubmit = async () => {
    setSubmitAttempted(true)
    if (!canSubmit || saving || currentNum === null || maxNum === null) return
    setSaving(true)
    setError('')
    try {
      const teamId = await createTeam(userId, {
        competitionName: competitionName.trim(),
        competitionTypeId,
        competitionPlatform: competitionPlatform.trim() || undefined,
        competitionUrl: competitionUrl.trim() || undefined,
        registrationDeadline: deadline,
        maxMembers: maxNum,
        currentMembers: currentNum,
        experiencePreference: experiencePreference || undefined,
        description: description.trim(),
        additionalRequirements: additionalRequirements.trim() || undefined,
        skillIds,
      })
      toast({ title: 'Team request created', description: `${competitionName} is now live on TeamUp.` })
      onCreated()
      void teamId
    } catch (err) {
      setError(describeSaveError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <UploadModalShell onClose={onClose} maxWidth="max-w-lg">
      <h2 className="text-xl font-bold font-display tracking-tight mb-1.5 text-center pr-6">Create Team Request</h2>
      <p className="text-sm text-muted-foreground text-center mb-6">Post your competition and find teammates.</p>

      {loadingLookups ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        </div>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <Label className="mb-1.5 block">Competition Name *</Label>
            <Input value={competitionName} onChange={e => setCompetitionName(e.target.value)} placeholder="Walmart Sparkathon" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Competition Type *</Label>
              <select value={competitionTypeId} onChange={e => setCompetitionTypeId(e.target.value)} className={nativeSelectClass} style={selectStyle}>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block text-muted-foreground/70">Platform <span className="text-muted-foreground/50">(optional)</span></Label>
              <Input value={competitionPlatform} onChange={e => setCompetitionPlatform(e.target.value)} placeholder="Unstop" />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-muted-foreground/70">Competition URL <span className="text-muted-foreground/50">(optional)</span></Label>
            <Input value={competitionUrl} onChange={e => setCompetitionUrl(e.target.value)} placeholder="https://unstop.com/..." />
            {competitionUrl.trim() && !isSafeHttpUrl(competitionUrl.trim()) && (
              <p className="text-xs text-red-400 mt-1">Enter a valid http(s) link.</p>
            )}
          </div>

          <div>
            <Label className="mb-1.5 block">Registration Deadline *</Label>
            <input
              type="date" min={todayStr} value={deadline} onChange={e => setDeadline(e.target.value)}
              className={selectClass} style={selectStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Current Team Size *</Label>
              <input
                type="number" min={1} inputMode="numeric" value={currentMembers}
                onChange={e => setCurrentMembers(e.target.value)}
                className={selectClass} style={selectStyle}
              />
              {currentError && <p className="text-xs text-red-400 mt-1">{currentError}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">Maximum Team Size *</Label>
              <input
                type="number" min={2} inputMode="numeric" value={maxMembers}
                onChange={e => setMaxMembers(e.target.value)}
                className={selectClass} style={selectStyle}
              />
              {maxError && <p className="text-xs text-red-400 mt-1">{maxError}</p>}
            </div>
          </div>
          {relationshipError ? (
            <p className="text-xs text-red-400 -mt-2">{relationshipError}</p>
          ) : membersNeeded !== null ? (
            <p className="text-xs text-muted-foreground -mt-2">{membersNeeded} member{membersNeeded !== 1 ? 's' : ''} needed</p>
          ) : null}

          <div>
            <Label className="mb-1.5 block">Skills Required *</Label>
            <SkillPicker
              skills={skills}
              selected={skillIds}
              onChange={setSkillIds}
              userId={userId}
              onSkillCreated={skill => setSkills(prev => [...prev, skill])}
            />
          </div>

          <div>
            <Label className="mb-1.5 block">Team Description *</Label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="We're building an AI-powered retail solution and are looking for a frontend developer and UI/UX person."
              className={textareaClass} style={selectStyle}
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-muted-foreground/70">Experience Preference <span className="text-muted-foreground/50">(optional)</span></Label>
            <select value={experiencePreference} onChange={e => setExperiencePreference(e.target.value as ExperiencePreference)} className={nativeSelectClass} style={selectStyle}>
              <option value="">No preference</option>
              {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <Label className="mb-1.5 block text-muted-foreground/70">Additional Requirements <span className="text-muted-foreground/50">(optional)</span></Label>
            <textarea
              value={additionalRequirements} onChange={e => setAdditionalRequirements(e.target.value)} rows={2}
              placeholder="Need someone comfortable with financial modelling."
              className={textareaClass} style={selectStyle}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 mt-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="gradient" className="flex-1 gap-2" disabled={!otherFieldsValid || saving} onClick={handleSubmit}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish'}
        </Button>
      </div>
    </UploadModalShell>
  )
}
