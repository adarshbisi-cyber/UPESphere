'use client'

import { useRef, useState } from 'react'
import { ArrowRight, Loader2, AlertTriangle } from 'lucide-react'
import { UploadModalShell } from '@/components/workspace/UploadModalShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { RoundEditor, type EditableRound } from './RoundEditor'
import { createApplication } from '@/lib/placementTracker/api'
import { OPPORTUNITY_TYPES, DEFAULT_ROUND_TEMPLATE, ROLE_CHOICES } from '@/lib/placementTracker/constants'
import { describeSaveError } from '@/lib/onboarding/errors'
import type { OpportunityType } from '@/lib/placementTracker/types'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

// The Role field is a dropdown of common titles (ROLE_CHOICES) plus a custom
// escape hatch — "Other" reveals a required text input rather than forcing
// every uncommon role into one of the preset boxes. There's no separate
// role_type/role_display pair in the database for this: the schema already
// has a single `role` text column, and nothing currently re-derives which
// dropdown option produced a saved role (no edit-role flow exists yet), so
// storing anything beyond the resolved display string would be an unused
// duplicate field.
type RoleChoice = typeof ROLE_CHOICES[number] | 'Other'
const ROLE_SELECT_OPTIONS: RoleChoice[] = [...ROLE_CHOICES, 'Other']

export function AddApplicationModal({
  userId,
  onClose,
  onSaved,
}: {
  userId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [companyName, setCompanyName] = useState('')
  const [roleChoice, setRoleChoice] = useState<RoleChoice>('Associate')
  const [customRole, setCustomRole] = useState('')
  const [opportunityType, setOpportunityType] = useState<OpportunityType>('placement')
  const [applicationDate, setApplicationDate] = useState(todayIso())
  const [industry, setIndustry] = useState('')
  const [location, setLocation] = useState('')
  const [packageValue, setPackageValue] = useState('')
  const [stipend, setStipend] = useState('')
  const [notes, setNotes] = useState('')
  const [rounds, setRounds] = useState<EditableRound[]>(
    DEFAULT_ROUND_TEMPLATE.map((r, i) => ({ key: `default-${i}`, displayName: r.displayName, analyticsCategory: r.analyticsCategory })),
  )
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const savingRef = useRef(false)

  const resolvedRole = roleChoice === 'Other' ? customRole.trim() : roleChoice
  const canSave = companyName.trim().length > 0 && resolvedRole.length > 0 && applicationDate.length > 0

  const handleSave = async () => {
    if (savingRef.current || !canSave) return
    savingRef.current = true
    setSaving(true)
    setSaveError('')
    try {
      await createApplication(
        userId,
        {
          companyName: companyName.trim(),
          role: resolvedRole,
          opportunityType,
          industry: industry.trim() || null,
          location: location.trim() || null,
          package: packageValue.trim() || null,
          stipend: stipend.trim() || null,
          applicationDate,
          notes: notes.trim() || null,
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1.5 block">Company Name *</Label>
            <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Bain & Company" />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Role *</Label>
            <Select value={roleChoice} onValueChange={v => setRoleChoice(v as RoleChoice)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLE_SELECT_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            {roleChoice === 'Other' && (
              <>
                <Label className="text-xs mb-1.5 mt-2 block">Please specify your role *</Label>
                <Input value={customRole} onChange={e => setCustomRole(e.target.value)} placeholder="e.g. Business Analyst" />
              </>
            )}
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Opportunity Type *</Label>
            <Select value={opportunityType} onValueChange={v => setOpportunityType(v as OpportunityType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OPPORTUNITY_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Application Date *</Label>
            <Input
              type="date"
              value={applicationDate}
              onChange={e => setApplicationDate(e.target.value)}
              style={{ borderColor: 'var(--divider)', background: 'var(--muted-surface)' }}
            />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Industry</Label>
            <Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Consulting" />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Location</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Bengaluru" />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">CTC / Package</Label>
            <CurrencyInput value={packageValue} onChange={setPackageValue} placeholder="12,00,000" />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Stipend</Label>
            <CurrencyInput value={stipend} onChange={setStipend} placeholder="40,000" />
          </div>
        </div>

        <div>
          <Label className="text-xs mb-1.5 block">Notes</Label>
          <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything worth remembering about this one" />
        </div>

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
