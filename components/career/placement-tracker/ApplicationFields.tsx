'use client'

// The application's own details (everything except the recruitment journey),
// shared by AddApplicationModal and EditApplicationModal so the two forms
// can't drift apart — a field added here shows up in both.

import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { OPPORTUNITY_TYPES } from '@/lib/placementTracker/constants'
import { ROLE_SELECT_OPTIONS, type RoleChoice } from '@/lib/placementTracker/role'
import type { OpportunityType } from '@/lib/placementTracker/types'

export interface ApplicationFieldValues {
  companyName: string
  roleChoice: RoleChoice
  customRole: string
  opportunityType: OpportunityType
  applicationDate: string
  industry: string
  location: string
  packageValue: string
  stipend: string
  notes: string
}

export function ApplicationFields({
  values,
  onChange,
}: {
  values: ApplicationFieldValues
  onChange: (patch: Partial<ApplicationFieldValues>) => void
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1.5 block">Company Name *</Label>
          <Input value={values.companyName} onChange={e => onChange({ companyName: e.target.value })} placeholder="e.g. Bain & Company" />
        </div>
        <div>
          <Label className="text-xs mb-1.5 block">Role *</Label>
          <Select value={values.roleChoice} onValueChange={v => onChange({ roleChoice: v as RoleChoice })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLE_SELECT_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          {values.roleChoice === 'Other' && (
            <>
              <Label className="text-xs mb-1.5 mt-2 block">Please specify your role *</Label>
              <Input value={values.customRole} onChange={e => onChange({ customRole: e.target.value })} placeholder="e.g. Business Analyst" />
            </>
          )}
        </div>
        <div>
          <Label className="text-xs mb-1.5 block">Opportunity Type *</Label>
          <Select value={values.opportunityType} onValueChange={v => onChange({ opportunityType: v as OpportunityType })}>
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
            value={values.applicationDate}
            onChange={e => onChange({ applicationDate: e.target.value })}
            style={{ borderColor: 'var(--divider)', background: 'var(--muted-surface)' }}
          />
        </div>
        <div>
          <Label className="text-xs mb-1.5 block">Industry</Label>
          <Input value={values.industry} onChange={e => onChange({ industry: e.target.value })} placeholder="e.g. Consulting" />
        </div>
        <div>
          <Label className="text-xs mb-1.5 block">Location</Label>
          <Input value={values.location} onChange={e => onChange({ location: e.target.value })} placeholder="e.g. Bengaluru" />
        </div>
        <div>
          <Label className="text-xs mb-1.5 block">CTC / Package</Label>
          <CurrencyInput value={values.packageValue} onChange={v => onChange({ packageValue: v })} placeholder="12,00,000" />
        </div>
        <div>
          <Label className="text-xs mb-1.5 block">Stipend</Label>
          <CurrencyInput value={values.stipend} onChange={v => onChange({ stipend: v })} placeholder="40,000" />
        </div>
      </div>

      <div>
        <Label className="text-xs mb-1.5 block">Notes</Label>
        <Input value={values.notes} onChange={e => onChange({ notes: e.target.value })} placeholder="Anything worth remembering about this one" />
      </div>
    </>
  )
}
