'use client'

// Edits an application's own details. Deliberately does NOT touch the
// recruitment journey: rounds carry outcomes, completion dates and
// reflections, so re-submitting them through the create-time RoundEditor
// would mean destroying and rebuilding rows that hold real history. The
// journey stays editable where it already lives, in ApplicationDetailModal.

import { useRef, useState } from 'react'
import { Loader2, AlertTriangle, Check } from 'lucide-react'
import { UploadModalShell } from '@/components/workspace/UploadModalShell'
import { Button } from '@/components/ui/button'
import { ApplicationFields, type ApplicationFieldValues } from './ApplicationFields'
import { sanitizeDigits } from '@/lib/format/currency'
import { updateApplicationDetails } from '@/lib/placementTracker/api'
import { resolveRole, splitRole } from '@/lib/placementTracker/role'
import { OTHER_INDUSTRY, resolveIndustry, splitIndustry } from '@/lib/placementTracker/industry'
import { OTHER_LOCATION, resolveLocation, splitLocation } from '@/lib/placementTracker/location'
import { describeSaveError } from '@/lib/onboarding/errors'
import type { PlacementApplication } from '@/lib/placementTracker/types'

function toFieldValues(app: PlacementApplication): ApplicationFieldValues {
  const { choice, customRole } = splitRole(app.role)
  const industry = splitIndustry(app.industry ?? '')
  const location = splitLocation(app.location ?? '')
  return {
    companyName: app.companyName,
    roleChoice: choice,
    customRole,
    opportunityType: app.opportunityType,
    applicationDate: app.applicationDate,
    industryChoice: industry.choice,
    customIndustry: industry.custom,
    locationChoice: location.choice,
    customLocation: location.custom,
    // CurrencyInput's contract is a clean digit string. Stored values
    // normally already are, but a row written before that input existed
    // could hold anything the old free-text field accepted.
    packageValue: sanitizeDigits(app.package ?? ''),
    stipend: sanitizeDigits(app.stipend ?? ''),
    notes: app.notes ?? '',
  }
}

export function EditApplicationModal({
  userId,
  application,
  onClose,
  onSaved,
}: {
  userId: string
  application: PlacementApplication
  onClose: () => void
  onSaved: () => void
}) {
  const [values, setValues] = useState<ApplicationFieldValues>(() => toFieldValues(application))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const savingRef = useRef(false)

  const update = (patch: Partial<ApplicationFieldValues>) => setValues(v => ({ ...v, ...patch }))

  const resolvedRole = resolveRole(values.roleChoice, values.customRole)
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
      await updateApplicationDetails(userId, application.id, {
        companyName: values.companyName.trim(),
        role: resolvedRole,
        opportunityType: values.opportunityType,
        industry: resolveIndustry(values.industryChoice, values.customIndustry) || null,
        location: resolveLocation(values.locationChoice, values.customLocation) || null,
        package: values.packageValue.trim() || null,
        stipend: values.stipend.trim() || null,
        applicationDate: values.applicationDate,
        notes: values.notes.trim() || null,
      })
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
      <h2 className="text-xl font-bold font-display tracking-tight mb-1.5 pr-6">Edit Application</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Update the details for this opportunity. Recruitment rounds are managed from the application itself.
      </p>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <ApplicationFields values={values} onChange={update} />
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
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save Changes <Check className="w-4 h-4" /></>}
        </Button>
      </div>
    </UploadModalShell>
  )
}
