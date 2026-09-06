'use client'

// Shared recruitment-journey editor — used by both "Add Application" (before
// any round has a real id) and the application detail view (editing rounds
// that already exist in the DB). The user answers exactly one question per
// round — "what is this stage actually called?" — never "which analytics
// bucket does this belong to?". The analytics category is inferred
// automatically from the name (see categoryInference.ts) and stays hidden;
// it only surfaces as a question when a custom name is genuinely ambiguous.
//
// Round numbers are never stored or editable — they're just the row's
// position, so adding, removing, or reordering rounds can never leave a
// duplicate or broken sequence.

import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { inferAnalyticsCategory } from '@/lib/placementTracker/categoryInference'
import { ANALYTICS_CATEGORIES } from '@/lib/placementTracker/constants'
import type { AnalyticsCategory } from '@/lib/placementTracker/types'

export interface EditableRound {
  key: string // stable client-side key — a real DB id once persisted, a generated one until then
  displayName: string
  // null = couldn't be inferred from the name yet — the one case the editor
  // asks the user directly, rather than a category they picked themselves.
  analyticsCategory: AnalyticsCategory | null
}

export function RoundEditor({
  rounds,
  onChange,
}: {
  rounds: EditableRound[]
  onChange: (rounds: EditableRound[]) => void
}) {
  const update = (index: number, patch: Partial<EditableRound>) => {
    onChange(rounds.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }
  const renameRound = (index: number, displayName: string) => {
    // Re-infer on every keystroke so the hidden category stays in sync with
    // whatever the user is actually typing, without them ever seeing it happen.
    update(index, { displayName, analyticsCategory: inferAnalyticsCategory(displayName) })
  }
  const remove = (index: number) => onChange(rounds.filter((_, i) => i !== index))
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= rounds.length) return
    const next = [...rounds]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }
  const add = () => {
    onChange([...rounds, { key: `new-${Date.now()}-${rounds.length}`, displayName: '', analyticsCategory: null }])
  }

  return (
    <div className="space-y-2">
      {rounds.map((round, i) => {
        const needsCategory = round.displayName.trim().length > 0 && round.analyticsCategory === null
        return (
          <div key={round.key} className="p-2.5 rounded-xl" style={{ background: 'var(--muted-surface)' }}>
            <div className="flex items-center gap-2">
              <div className="flex flex-col shrink-0">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move round up"
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === rounds.length - 1}
                  aria-label="Move round down"
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Round {i + 1}</span>
                <Input
                  value={round.displayName}
                  onChange={e => renameRound(i, e.target.value)}
                  placeholder="e.g. Technical Interview"
                  className="h-9 text-sm mt-1"
                />
              </div>

              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove round"
                className="text-muted-foreground hover:text-red-400 transition-colors self-end mb-2 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {needsCategory && (
              <div className="mt-2 pl-6">
                <p className="text-[11px] text-muted-foreground mb-1.5">What type of round is this?</p>
                <Select value="" onValueChange={v => update(i, { analyticsCategory: v as AnalyticsCategory })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Choose a type" /></SelectTrigger>
                  <SelectContent>
                    {ANALYTICS_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )
      })}

      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={add}>
        <Plus className="w-3.5 h-3.5" />
        Add another round
      </Button>
    </div>
  )
}
