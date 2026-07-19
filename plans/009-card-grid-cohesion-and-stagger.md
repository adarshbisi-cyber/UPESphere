# 009 — Apply one consistent entrance + stagger across the three case/hackathon card grids

- **Status**: TODO
- **Commit**: 157ae7b
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens
- **Estimated scope**: 3 files, small-medium

## Problem

Three components render the same UI pattern — a filterable grid of compact info cards — in the same product area (Case Comp / Hackathon calendars), but only one of them animates at all, and even that one has no entrance stagger. AUDIT.md §7: *"Motion should match the product's personality... Mismatched personality across components is a finding"* and *"Everything-at-once group entrances where a 30-80ms stagger belongs."*

`components/casecomp/CorporateCases.tsx:33-55` (`CaseCard`) — animated, current:
```tsx
function CaseCard({ c }: { c: (typeof CORPORATE_CASES)[number] }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ duration: 0.35, ease: EASE }}
      whileHover={{ y: -4 }}
      className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 overflow-hidden"
    >
      {/* ...content... */}
    </motion.div>
  )
}
```
Rendered at line 123: `{filtered.map(c => <CaseCard key={c.id} c={c} />)}` — no index passed, so every visible card animates in simultaneously with identical timing (no stagger).

`components/casecomp/CaseCompDatabase.tsx:35-86` (`CompCard`) — completely unanimated, current:
```tsx
function CompCard({ comp }: { comp: (typeof CASE_COMP_DATABASE)[number] }) {
  const primary = comp.categories[0]
  const meta = DB_CATEGORY_META[primary]
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 flex flex-col gap-2">
      {/* ...content... */}
    </div>
  )
}
```
Rendered at line 197: `{shown.map(c => <CompCard key={c.id} comp={c} />)}`.

`components/hackathons/HackathonsCalendar.tsx:42-75` (`HackCard`) — same, completely unanimated:
```tsx
function HackCard({ h }: { h: (typeof HACKATHONS)[number] }) {
  const meta = CAT_META[h.category] ?? { /* fallback */ }
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 flex flex-col gap-2">
      {/* ...content... */}
    </div>
  )
}
```
Rendered at line 166: `{shown.map(h => <HackCard key={h.id} h={h} />)}`.

Both `CaseCompDatabase.tsx` and `HackathonsCalendar.tsx` already `import { motion } from 'framer-motion'` (used elsewhere in each file for their filter-panel UI), so no new import is needed to animate these two cards.

## Target

Give all three cards the identical entrance treatment already used by `CaseCard` (fade + slight rise + scale-up from 0.98), each keyed to its own `EASE_OUT` import (see plan 005 — if plan 005 has already landed, import `EASE_OUT` from `@/lib/utils`; if it hasn't, use the literal `[0.22, 1, 0.36, 1]` array directly and note that plan 005 will later consolidate it), plus a `delay: i * 0.04` stagger (within AUDIT.md's 30-80ms band) driven by each card's index in its rendered list.

`CorporateCases.tsx` — add index-based stagger to the existing animated card (currently has none):
```tsx
function CaseCard({ c, index }: { c: (typeof CORPORATE_CASES)[number]; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: EASE }}
      whileHover={{ y: -4 }}
      className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 overflow-hidden"
    >
      {/* ...content unchanged... */}
    </motion.div>
  )
}
```
And its call site: `{filtered.map((c, i) => <CaseCard key={c.id} c={c} index={i} />)}`.

`CaseCompDatabase.tsx` — add the same entrance to the previously-unanimated card:
```tsx
function CompCard({ comp, index }: { comp: (typeof CASE_COMP_DATABASE)[number]; index: number }) {
  const primary = comp.categories[0]
  const meta = DB_CATEGORY_META[primary]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 flex flex-col gap-2"
    >
      {/* ...content unchanged... */}
    </motion.div>
  )
}
```
And its call site: `{shown.map((c, i) => <CompCard key={c.id} comp={c} index={i} />)}`.

`HackathonsCalendar.tsx` — identical treatment:
```tsx
function HackCard({ h, index }: { h: (typeof HACKATHONS)[number]; index: number }) {
  const meta = CAT_META[h.category] ?? { /* fallback unchanged */ }
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 flex flex-col gap-2"
    >
      {/* ...content unchanged... */}
    </motion.div>
  )
}
```
And its call site: `{shown.map((h, i) => <HackCard key={h.id} h={h} index={i} />)}`.

## Repo conventions to follow

- `components/dashboard/InsightsPanel.tsx` (`delay: i * 0.08`) and `components/shared/Navbar.tsx:112` (`delay: i * 0.045`) are the repo's existing stagger exemplars — this plan's `i * 0.04` sits in the same family and within AUDIT.md's 30-80ms band.
- Both target files already have `EASE` declared as a local const (`CaseCompDatabase.tsx:13`, confirmed present but currently **unused** — this plan makes it used for the first time) or can reference the literal array directly (`HackathonsCalendar.tsx:10` — same situation, declared but unused). Use each file's own existing local `EASE` constant rather than the literal array where one already exists, since it's already in scope; only fall back to the literal `[0.22, 1, 0.36, 1]` if no local constant exists in that file.
- Cap the stagger — with grids potentially showing many cards after filtering, an unbounded `i * 0.04` could make the 40th card wait 1.6s. Follow `InsightsPanel.tsx`'s approach of only staggering a reasonable visible window, or clamp the delay: use `Math.min(index, 12) * 0.04` in all three cards so the stagger caps at ~480ms regardless of how many cards are shown, rather than growing unbounded.

## Steps

1. In `components/casecomp/CorporateCases.tsx`: add an `index: number` prop to `CaseCard`, use `Math.min(index, 12) * 0.04` as the `delay` in its `transition`, and update the call site (`filtered.map(c => <CaseCard key={c.id} c={c} />)`) to `filtered.map((c, i) => <CaseCard key={c.id} c={c} index={i} />)`.
2. In `components/casecomp/CaseCompDatabase.tsx`: change `CompCard`'s return from a plain `<div>` to a `motion.div` with the `initial`/`animate`/`transition`/`whileHover` props shown in Target, add an `index: number` prop, use `Math.min(index, 12) * 0.04` as the delay (using the file's existing local `EASE` constant if present, otherwise the literal array), and update its call site to pass `index={i}`.
3. In `components/hackathons/HackathonsCalendar.tsx`: identical treatment to step 2, for `HackCard`.
4. Confirm all three files still import `motion` from `framer-motion` (they should already, per the recon above) — no new imports needed.

## Boundaries

- Do NOT change any card's visual content, layout, colors, or the `AnimatePresence`/`layout` behavior already present on `CaseCard` in `CorporateCases.tsx` — only add the `index` prop, `motion.div` wrapper (for the two currently-unanimated cards), and stagger delay.
- Do NOT add exit animations to `CompCard`/`HackCard` (only `CaseCard` currently has an `exit` prop, tied to its `AnimatePresence mode="popLayout"` wrapper — check whether `CaseCompDatabase.tsx`/`HackathonsCalendar.tsx` use `AnimatePresence` around their grids before considering adding `exit`; if they don't, an `exit` prop with no `AnimatePresence` ancestor is inert and not worth adding in this plan).
- Do NOT introduce a shared `CardGrid`/`AnimatedCard` component to deduplicate the three implementations — that's a larger refactor beyond this plan's scope; three copies of the same JSX pattern is an acceptable outcome here.
- If any of the three call sites or card components has changed shape since this plan was written, STOP and report rather than improvising against different code.

## Verification

- **Mechanical**: `npx tsc --noEmit -p .` and `npm run test -- --run` — both clean.
- **Feel check**:
  - Visit `/case-comp`, switch to the "Corporate Cases" tab and to the main case comp database — confirm cards fade/rise in with a visible left-to-right or top-to-bottom cascade rather than popping in all at once.
  - Visit `/hackathons` — confirm the same cascading entrance.
  - Apply a filter/search on each page that reduces the visible card count, then clear it — confirm the stagger still feels natural and doesn't noticeably lag even when many cards re-appear (the `Math.min(index, 12)` cap should prevent late cards from waiting too long).
  - In DevTools Animations panel, set playback to 10% and confirm each grid's cards visibly stagger rather than animating in lockstep.
- **Done when**: all three card grids share the same entrance treatment and stagger cadence, verified visually across all three pages.
