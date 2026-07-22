'use client'

import { useState } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createCustomSkill, findSimilarSkill, type Skill, type SkillCategory } from '@/lib/teamup/api'

// Exported so every other skill-grouping surface (TeamFiltersBar,
// SkillFilterChips, the students-discovery filter) shares this exact
// category order/labels rather than drifting into their own flat lists.
export const CATEGORY_LABELS: Record<SkillCategory, string> = {
  business: 'Business',
  technology: 'Technology',
  analytics: 'Analytics',
  product_design: 'Product & Design',
  communication: 'Communication',
}

export const CATEGORY_ORDER: SkillCategory[] = ['business', 'technology', 'analytics', 'product_design', 'communication']

function isDuplicateSkillError(err: unknown): boolean {
  return !!err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === '23505'
}

// Grouped multi-select skill chips — shared between the Create Team form
// (skills required) and competition profile editing (a student's own
// skills), so the taxonomy always renders identically in both places. Every
// category also gets a "+ Other" chip so a student can add a skill the
// predefined list is missing; it's persisted as a real row in `skills`
// (is_custom = true) so future users see it as a normal selectable chip too.
export function SkillPicker({
  skills,
  selected,
  onChange,
  userId,
  onSkillCreated,
}: {
  skills: Skill[]
  selected: string[]
  onChange: (ids: string[]) => void
  userId: string
  onSkillCreated: (skill: Skill) => void
}) {
  const [openCategory, setOpenCategory] = useState<SkillCategory | null>(null)
  const [draft, setDraft] = useState('')
  const [suggestion, setSuggestion] = useState<Skill | null>(null)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  const grouped = new Map<SkillCategory, Skill[]>()
  for (const s of skills) {
    const list = grouped.get(s.category) ?? []
    list.push(s)
    grouped.set(s.category, list)
  }

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }

  const openOther = (category: SkillCategory) => {
    setOpenCategory(category)
    setDraft('')
    setSuggestion(null)
    setError('')
  }

  const closeOther = () => {
    setOpenCategory(null)
    setDraft('')
    setSuggestion(null)
    setError('')
    setCreating(false)
  }

  const selectExisting = (skill: Skill) => {
    if (selected.includes(skill.id)) {
      setError(`${skill.name} is already selected.`)
      return
    }
    onChange([...selected, skill.id])
    closeOther()
  }

  const createAndSelect = async (category: SkillCategory, name: string) => {
    setCreating(true)
    setError('')
    try {
      const created = await createCustomSkill(userId, name, category)
      onSkillCreated(created)
      onChange([...selected, created.id])
      closeOther()
    } catch (err) {
      setError(isDuplicateSkillError(err) ? 'That skill already exists — try refreshing.' : 'Could not add that skill. Try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleAdd = (category: SkillCategory) => {
    const trimmed = draft.trim()
    if (!trimmed) {
      setError('Enter a skill name.')
      return
    }
    setError('')
    const match = findSimilarSkill(trimmed, grouped.get(category) ?? [])
    if (match?.exact) {
      selectExisting(match.skill)
      return
    }
    if (match) {
      setSuggestion(match.skill)
      return
    }
    void createAndSelect(category, trimmed)
  }

  return (
    <div className="space-y-3">
      {CATEGORY_ORDER.map(category => {
        const categorySkills = grouped.get(category) ?? []
        const isOpen = openCategory === category

        return (
          <div key={category}>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">{CATEGORY_LABELS[category]}</p>
            <div className="flex flex-wrap gap-1.5">
              {categorySkills.map(s => {
                const active = selected.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                      active
                        ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                        : 'border-white/10 text-muted-foreground hover:text-foreground hover:border-white/25'
                    )}
                  >
                    {s.name}
                  </button>
                )
              })}
              {!isOpen && (
                <button
                  type="button"
                  onClick={() => openOther(category)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-white/15 text-muted-foreground hover:text-foreground hover:border-white/30 transition-colors inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Other
                </button>
              )}
            </div>

            {isOpen && (
              <div className="mt-2 p-3 rounded-xl space-y-2" style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">Other {CATEGORY_LABELS[category]} Skill</p>
                  <button type="button" onClick={closeOther} aria-label="Cancel" className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={draft}
                    onChange={e => { setDraft(e.target.value); setSuggestion(null); setError('') }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(category) } }}
                    placeholder="e.g. Blender"
                    className="h-9 text-sm flex-1"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="gradient"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    disabled={creating}
                    onClick={() => handleAdd(category)}
                  >
                    {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Add'}
                  </Button>
                </div>

                {suggestion && (
                  <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                    <span>Did you mean &ldquo;{suggestion.name}&rdquo;?</span>
                    <button type="button" onClick={() => selectExisting(suggestion)} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                      Use &ldquo;{suggestion.name}&rdquo;
                    </button>
                    <button
                      type="button"
                      disabled={creating}
                      onClick={() => void createAndSelect(category, draft.trim())}
                      className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                    >
                      Add &ldquo;{draft.trim()}&rdquo; anyway
                    </button>
                  </div>
                )}

                {error && <p className="text-xs text-red-400">{error}</p>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
