'use client'

import { cn } from '@/lib/utils'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/components/teamup/SkillPicker'
import type { Skill, SkillCategory } from '@/lib/teamup/api'

// Categorized skill-filter chips, shared between TeamFiltersBar and the
// student-discovery filter — both used to render skills as one flat,
// uncategorized 30+ chip list; this is the single grouped implementation
// both now reuse, so the taxonomy can't drift between the two surfaces again.
export function SkillFilterChips({
  skills,
  selected,
  onToggle,
  label,
}: {
  skills: Skill[]
  selected: string[]
  onToggle: (id: string) => void
  label?: string
}) {
  if (skills.length === 0) return null

  const grouped = new Map<SkillCategory, Skill[]>()
  for (const s of skills) {
    const list = grouped.get(s.category) ?? []
    list.push(s)
    grouped.set(s.category, list)
  }

  return (
    <div className="space-y-2.5">
      {label && <p className="text-[11px] text-muted-foreground">{label}</p>}
      {CATEGORY_ORDER.filter(c => grouped.has(c)).map(category => (
        <div key={category}>
          <p className="text-[11px] font-medium text-muted-foreground/70 mb-1.5">{CATEGORY_LABELS[category]}</p>
          <div className="flex flex-wrap gap-1.5">
            {grouped.get(category)!.map(s => {
              const active = selected.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onToggle(s.id)}
                  className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium border transition-colors',
                    active
                      ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                      : 'border-white/10 text-muted-foreground hover:text-foreground hover:border-white/25',
                  )}
                >
                  {s.name}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
