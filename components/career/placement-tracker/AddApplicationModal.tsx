'use client'

import { useRef, useState } from 'react'
import { ArrowRight, Loader2, AlertTriangle } from 'lucide-react'
import { UploadModalShell } from '@/components/workspace/UploadModalShell'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ApplicationFields, type ApplicationFieldValues } from './ApplicationFields'
import { RoundEditor, type EditableRound } from './RoundEditor'
import { createApplication } from '@/lib/placementTracker/api'
import { DEFAULT_ROUND_TEMPLATE } from '@/lib/placementTracker/constants'
import { resolveRole } from '@/lib/placementTracker/role'
import { OTHER_INDUSTRY, resolveIndustry } from '@/lib/placementTracker/industry'
import { OTHER_LOCATION, resolveLocation } from '@/lib/placementTracker/location'
import { describeSaveError } from '@/lib/onboarding/errors'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function AddApplicationModal({
  userId,
  onClose,
  onSaved,
}: {
  userId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [values, setValues] = useState<ApplicationFieldValues>({
    companyName: '',
    roleChoice: 'Associate',
    customRole: '',
    opportunityType: 'placement',
    applicationDate: todayIso(),
    industryChoice: '',
    customIndustry: '',
    locationChoice: '',
    customLocation: '',
    packageValue: '',
    stipend: '',
    notes: '',
  })
  const [rounds, setRounds] = useState<EditableRound[]>(
    DEFAULT_ROUND_TEMPLATE.map((r, i) => ({ key: `default-${i}`, displayName: r.displayName, analyticsCategory: r.analyticsCategory })),
  )
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const savingRef = useRef(false)

  const update = (patch: Partial<ApplicationFieldValues>) => setValues(v => ({ ...v, ...patch }))

  const resolvedRole = resolveRole(values.roleChoice, values.customRole)
  // "Other" without a specified industry is an incomplete answer, not a
  // blank one — the field is optional, but half-filled must not save.
  const industryIncomplete = values.industryChoice === OTHER_INDUSTRY && values.customIndustry.trim().length === 0
  const locationIncomplete = values.locationChoice === OTHER_LOCATION && values.customLocation.trim().length === 0
  const canSave = values.companyName.trim().length > 0 && resolvedRole.length > 0
    && values.applicationDate.length > 0 && !industryIncomplete && !locationIncomplete

  const handleSave = async () => {
    if (savingRef.current || !canSave) return
    savingRef.current = true
    setSaving(true)
    setSaveError('')
    try {
      await createApplication(
        userId,
        {
          companyName: values.companyName.trim(),
          role: resolvedRole,
          opportunityType: values.opportunityType,
          industry: resolveIndustry(values.industryChoice, values.customIndustry) || null,
          location: resolveLocation(values.locationChoice, values.customLocation) || null,
          package: values.packageValue.trim() || null,
          stipend: values.stipend.trim() || null,
          applicationDate: values.applicationDate,
          notes: values.notes.trim() || null,
        },
        rounds
          .filter(r => r.displayName.trim().length > 0)
          .map(r => ({ displayName: r.displayName.trim(), analyticsCategory: r.analyticsCategory ?? 'other' })),
      )
      onSaved()
    } catch (err) {
      setSaveError(describeSaveError(err))
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <UploadModalShell onClose={onClose} maxWidth="max-w-lg">
      <h2 className="text-xl font-bold font-display tracking-tight mb-1.5 pr-6">Add Application</h2>
      <p className="text-sm text-muted-foreground mb-6">Track a new opportunity from application through to outcome.</p>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <ApplicationFields values={values} onChange={update} />

        <div>
          <Label className="text-xs mb-1.5 block">
            Recruitment Journey
            <span className="text-muted-foreground font-normal ml-1.5">— the selection rounds this company actually uses, starting from Round 1</span>
          </Label>
          <RoundEditor rounds={rounds} onChange={setRounds} />
        </div>
      </div>

      {saveError && (
        <div className="flex items-start gap-2 mt-4 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300">{saveError}</p>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="gradient" className="flex-1 gap-2" disabled={!canSave || saving} onClick={handleSave}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save <ArrowRight className="w-4 h-4" /></>}
        </Button>
      </div>
    </UploadModalShell>
  )
}
