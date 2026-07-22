'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { GlassCard } from '@/components/ui/card'
import { SkillFilterChips } from '@/components/teamup/SkillFilterChips'
import type { CompetitionType, Skill, TeamFilters } from '@/lib/teamup/api'

const selectClass = 'h-9 rounded-xl border px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50'
const selectStyle = { borderColor: 'var(--divider)', background: 'var(--muted-surface)' } as const

export function TeamFiltersBar({
  types,
  skills,
  filters,
  onChange,
}: {
  types: CompetitionType[]
  skills: Skill[]
  filters: TeamFilters
  onChange: (f: TeamFilters) => void
}) {
  const [open, setOpen] = useState(false)
  const activeCount = [filters.competitionTypeId, filters.deadlineWithinDays, filters.minSlotsNeeded].filter(Boolean).length
    + (filters.skillIds?.length ?? 0)

  const toggleSkill = (id: string) => {
    const current = filters.skillIds ?? []
    onChange({ ...filters, skillIds: current.includes(id) ? current.filter(x => x !== id) : [...current, id] })
  }

  return (
    <GlassCard className="p-4 mb-6">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            value={filters.search ?? ''}
            onChange={e => onChange({ ...filters, search: e.target.value })}
            placeholder="Search competitions, skills, or descriptions…"
            className="w-full h-10 rounded-xl border pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            style={selectStyle}
          />
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className="h-10 px-3 rounded-xl border flex items-center gap-1.5 text-sm shrink-0 transition-colors"
          style={{
            borderColor: activeCount > 0 ? 'rgba(99,102,241,0.4)' : 'var(--divider)',
            background: activeCount > 0 ? 'rgba(99,102,241,0.08)' : 'var(--muted-surface)',
          }}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filters</span>
          {activeCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center">{activeCount}</span>
          )}
        </button>
      </div>

      {open && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--divider)' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <select
              value={filters.competitionTypeId ?? ''}
              onChange={e => onChange({ ...filters, competitionTypeId: e.target.value || undefined })}
              className={selectClass} style={selectStyle}
            >
              <option value="">All Types</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <select
              value={filters.deadlineWithinDays ?? ''}
              onChange={e => onChange({ ...filters, deadlineWithinDays: e.target.value ? (Number(e.target.value) as 1 | 3 | 7) : undefined })}
              className={selectClass} style={selectStyle}
            >
              <option value="">Any Deadline</option>
              <option value="1">Within 24 hours</option>
              <option value="3">Within 3 days</option>
              <option value="7">Within 7 days</option>
            </select>

            <select
              value={filters.minSlotsNeeded ?? ''}
              onChange={e => onChange({ ...filters, minSlotsNeeded: e.target.value ? (Number(e.target.value) as 1 | 2) : undefined })}
              className={selectClass} style={selectStyle}
            >
              <option value="">Any Slots</option>
              <option value="1">Need 1 member</option>
              <option value="2">Need 2+ members</option>
            </select>
          </div>

          {skills.length > 0 && (
            <div className="mt-3">
              <SkillFilterChips skills={skills} selected={filters.skillIds ?? []} onToggle={toggleSkill} label="Skills Needed" />
            </div>
          )}

          {activeCount > 0 && (
            <button
              onClick={() => onChange({ search: filters.search })}
              className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
      )}
    </GlassCard>
  )
}
