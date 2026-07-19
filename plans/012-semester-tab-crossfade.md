# 012 — Crossfade the Gradebook's semester tab content instead of teleporting it

- **Status**: TODO
- **Commit**: 157ae7b
- **Severity**: Missed opportunity (additive)
- **Category**: Missed opportunities
- **Estimated scope**: 1 file, small

## Problem

`components/gradebook/SemesterGradebookTable.tsx` has no `framer-motion` import at all (confirmed — the file's only import beyond React/`useState` is `GlassCard` and `cn`). Clicking a semester tab (`onClick={() => setActiveId(s.id)}`, line 22) instantly swaps the entire subject table (desktop) or card list (mobile) to the newly-selected semester's data, with no transition. This is a control the user clicks repeatedly within one Gradebook session while comparing semesters — exactly the kind of "state change that teleports" AUDIT.md §8 flags: *"State changes that teleport (content swaps, layout jumps) where a brief transition would prevent a jarring change."*

Current structure (`components/gradebook/SemesterGradebookTable.tsx:1-96`, full file):
```tsx
'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { GradebookSemester } from '@/lib/gradebook/api'

export function SemesterGradebookTable({ semesters }: { semesters: GradebookSemester[] }) {
  const [activeId, setActiveId] = useState(semesters[0]?.id)
  const active = semesters.find(s => s.id === activeId) ?? semesters[0]
  if (!active) return null

  return (
    <GlassCard className="p-6">
      <h3 className="text-base font-semibold font-display mb-4">Semester Gradebook</h3>

      {/* Tabs — only for semesters that actually have parsed data */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1">
        {semesters.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveId(s.id)}
            className={cn(
              'shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap',
              s.id === active.id
                ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                : 'border-white/10 text-muted-foreground hover:text-foreground hover:border-white/25'
            )}
          >
            {s.name || `Semester ${s.semesterNumber}`}
          </button>
        ))}
      </div>

      {active.subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No subject-level data was found in this semester's grade sheet.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            {/* ...table keyed only by row index `i`, not by semester... */}
          </div>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {/* ...cards keyed only by row index `i`, not by semester... */}
          </div>
        </>
      )}

      <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: '1px solid var(--divider)' }}>
        {/* SGPA / Total Credits footer */}
      </div>
    </GlassCard>
  )
}
```

## Target

Wrap the swappable content block (the subject table/cards + the empty-state message, i.e. everything between the tabs and the SGPA/credits footer) in an `AnimatePresence mode="wait"` with a `motion.div` keyed on `active.id`, using a ~180ms opacity-only crossfade (no transform — a pure content swap doesn't need physical motion, just enough of a fade to prevent a jarring instant replace):

```tsx
'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { GradebookSemester } from '@/lib/gradebook/api'

export function SemesterGradebookTable({ semesters }: { semesters: GradebookSemester[] }) {
  const [activeId, setActiveId] = useState(semesters[0]?.id)
  const active = semesters.find(s => s.id === activeId) ?? semesters[0]
  if (!active) return null

  return (
    <GlassCard className="p-6">
      <h3 className="text-base font-semibold font-display mb-4">Semester Gradebook</h3>

      {/* Tabs unchanged */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1">
        {/* ...unchanged... */}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {active.subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No subject-level data was found in this semester's grade sheet.</p>
          ) : (
            <>
              {/* Desktop table — unchanged content */}
              {/* Mobile cards — unchanged content */}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* SGPA / Total Credits footer unchanged, outside the AnimatePresence so it doesn't refade (its own values update instantly, which is fine — it's a small text change, not a full content swap) */}
    </GlassCard>
  )
}
```

## Repo conventions to follow

- `components/dashboard/AcademicWorkspace.tsx` and several onboarding steps already use the `AnimatePresence` + `motion.div` + `key`-based crossfade pattern for step/modal transitions — follow that same structural pattern (import `AnimatePresence, motion` from `'framer-motion'`, wrap the swappable region, key it on the value that changes).
- Use `duration: 0.18` (within AUDIT.md's tooltip/small-popover-adjacent budget of 125-200ms, since this is a lightweight in-place content swap, not a modal) rather than importing `EASE_OUT`/plan 005's token — a plain opacity crossfade this short doesn't need a custom curve; Framer Motion's default ease is acceptable here since there's no directional/physical motion to shape, just a fade.

## Steps

1. Add `import { AnimatePresence, motion } from 'framer-motion'` to `components/gradebook/SemesterGradebookTable.tsx`.
2. Wrap the JSX block that currently reads `{active.subjects.length === 0 ? (...) : (...)}` (the empty-state message OR the desktop-table + mobile-cards fragment) in `<AnimatePresence mode="wait"><motion.div key={active.id} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.18}}> ... </motion.div></AnimatePresence>`, moving the existing conditional entirely inside the new `motion.div` with no changes to its internal content.
3. Leave the tabs row and the SGPA/Total Credits footer exactly as they are, outside the new `AnimatePresence` wrapper.
4. Verify the table/card `key={i}` props on individual rows (currently keyed by array index) don't need to change — they're scoped inside the outer `key={active.id}` remount already, so index-based keys within a single semester's render are fine.

## Boundaries

- Do NOT change the tabs' own styling, the SGPA/Total Credits footer, or any table/card column content — only wrap the swappable middle section.
- Do NOT add a stagger to individual table rows within a semester — this plan is scoped to the semester-level swap only, not per-row entrance.
- Do NOT add exit animations elsewhere in this file.
- If the component's structure has changed materially since this plan was written (e.g. the table/cards conditional has been refactored into a separate component), STOP and report rather than improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit -p .` and `npm run test -- --run` — both clean.
- **Feel check**: On the Gradebook page (`/gradebook`) with at least 2 semesters of data, click back and forth between semester tabs several times in a row. Confirm:
  - The subject table/cards briefly fade out and the new semester's content fades in, rather than instantly replacing.
  - The crossfade feels quick and unobtrusive (~180ms) — not slow enough to feel laggy when clicking tabs rapidly.
  - Clicking a tab while a previous crossfade is still in-flight doesn't visually glitch (AnimatePresence's `mode="wait"` should handle this correctly by waiting for the exit to finish before the next enter starts — if this makes rapid tab-clicking feel too delayed, that's worth noting in your report, but implement `mode="wait"` first as specified).
- **Done when**: switching semester tabs shows a visible, quick crossfade instead of an instant content swap.
