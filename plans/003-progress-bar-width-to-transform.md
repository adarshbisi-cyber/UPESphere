# 003 — Animate progress bars via transform: scaleX, not width

- **Status**: TODO
- **Commit**: 157ae7b
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 2 files, small

## Problem

Two progress-bar fills on the app's two busiest pages (Dashboard and Gradebook, both load this component on every visit) animate the CSS `width` property directly via Framer Motion. `width` is a layout-triggering property — animating it forces layout recalculation on every frame, unlike `transform`/`opacity` which are composited on the GPU. AUDIT.md §5: *"Animate `transform` and `opacity` only. `width`/`height`/`margin`/`padding`/`top`/`left` trigger layout + paint + composite."*

`components/shared/StatCard.tsx:72-84` (`StatProgressBar`, used by both `components/dashboard/SummaryCards.tsx` and `components/gradebook/AcademicSummaryCards.tsx`) — current:
```tsx
export function StatProgressBar({ pct, accent, delay }: { pct: number; accent: Accent; delay: number }) {
  const c = ACCENT[accent]
  return (
    <div className="h-1 rounded-full overflow-hidden mt-1.5" style={{ background: 'var(--divider)' }}>
      <motion.div
        className={cn('h-full rounded-full', c.bar)}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        transition={{ duration: 0.8, delay: delay + 0.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
```

Also, separately in the same file, `components/shared/StatCard.tsx:52-54` (`StatCard`'s own mount animation) uses a bare Framer Motion shorthand:
```tsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay }}
  ...
```
AUDIT.md §5: *"Framer Motion `x`/`y`/`scale` shorthands are not hardware-accelerated the way a full `transform` string is... Target: the full transform string, `animate={{ transform: "translateX(100px)" }}`."* This mounts once per card, 4-5 times per page load on both busy pages — lower urgency than the `width` issue but bundled here since it's the same file, same audit visit.

`components/dashboard/AcademicWorkspace.tsx:86-93` — the exact same `width`-animation pattern, independently implemented:
```tsx
<div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--divider)' }}>
  <motion.div
    className="h-full rounded-full"
    style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }}
    initial={{ width: 0 }}
    animate={{ width: `${pct}%` }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
  />
</div>
```

## Target

Replace `width: '0%' → 'N%'` with `transform: 'scaleX(0)' → 'scaleX(N/100)'` on a track that's always full-width, using `transform-origin: left` so the fill grows rightward from the left edge (matching the current visual behavior of a width-based fill).

`components/shared/StatCard.tsx` target:
```tsx
export function StatProgressBar({ pct, accent, delay }: { pct: number; accent: Accent; delay: number }) {
  const c = ACCENT[accent]
  const scale = Math.min(100, Math.max(0, pct)) / 100
  return (
    <div className="h-1 rounded-full overflow-hidden mt-1.5" style={{ background: 'var(--divider)' }}>
      <motion.div
        className={cn('h-full w-full rounded-full origin-left', c.bar)}
        initial={{ transform: 'scaleX(0)' }}
        animate={{ transform: `scaleX(${scale})` }}
        transition={{ duration: 0.8, delay: delay + 0.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
```

`StatCard`'s own entrance, target (full transform string instead of `y` shorthand):
```tsx
<motion.div
  initial={{ opacity: 0, transform: 'translateY(16px)' }}
  animate={{ opacity: 1, transform: 'translateY(0px)' }}
  transition={{ duration: 0.4, delay }}
  ...
```

`components/dashboard/AcademicWorkspace.tsx` target (same `scaleX` treatment):
```tsx
<div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--divider)' }}>
  <motion.div
    className="h-full w-full rounded-full origin-left"
    style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }}
    initial={{ transform: 'scaleX(0)' }}
    animate={{ transform: `scaleX(${pct / 100})` }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
  />
</div>
```

## Repo conventions to follow

- The `[0.22, 1, 0.36, 1]` easing array used in both files' `transition` should NOT be touched or replaced as part of this plan — that's covered separately by plan 005 (token consolidation). Keep the literal array as-is here; only change `width`→`transform` and the `y` shorthand→full transform string.
- `w-full` + `origin-left` on the inner bar (replacing the old `width: 0 → N%` sizing) is the standard Tailwind way to make an element always full-width but visually clipped by `scaleX` — the parent `overflow-hidden` container already handles clipping correctly with no other changes needed.

## Steps

1. In `components/shared/StatCard.tsx`, update `StatProgressBar`: compute `const scale = Math.min(100, Math.max(0, pct)) / 100` before the `return`, change the inner `motion.div`'s className to add `w-full origin-left` (keep `h-full rounded-full` and `c.bar`), and replace `initial={{ width: 0 }}` / `animate={{ width: ... }}` with `initial={{ transform: 'scaleX(0)' }}` / `animate={{ transform: \`scaleX(${scale})\` }}`.
2. In the same file, update `StatCard`'s own `motion.div` (the outer card wrapper): replace `initial={{ opacity: 0, y: 16 }}` / `animate={{ opacity: 1, y: 0 }}` with `initial={{ opacity: 0, transform: 'translateY(16px)' }}` / `animate={{ opacity: 1, transform: 'translateY(0px)' }}`.
3. In `components/dashboard/AcademicWorkspace.tsx`, apply the identical `scaleX` transformation to its progress-bar `motion.div`: add `w-full origin-left` to the className, replace `initial={{ width: 0 }}` / `animate={{ width: \`${pct}%\` }}` with `initial={{ transform: 'scaleX(0)' }}` / `animate={{ transform: \`scaleX(${pct / 100})\` }}`.
4. Visually confirm in the browser that both progress bars still fill left-to-right to the correct percentage width, just via a different CSS mechanism.

## Boundaries

- Do NOT touch `components/gradebook/GradeDistribution.tsx`'s bars — those use a plain CSS `transition-all` on `width` (not Framer Motion), which is a separate, lower-priority finding not included in this plan's scope.
- Do NOT change the visual appearance, colors, or sizing of either progress bar — only the underlying animated property.
- Do NOT add new dependencies.
- If `StatProgressBar` or `AcademicWorkspace.tsx`'s progress bar JSX has changed structurally since this plan was written, STOP and report rather than improvising against different code.

## Verification

- **Mechanical**: `npx tsc --noEmit -p .` and `npm run test -- --run` — both clean.
- **Feel check**: Load the Dashboard and the Gradebook page (need a signed-in account with at least one semester of data for the progress bars to show a non-zero value). Confirm:
  - Both "Degree Progress"-style bars (Dashboard's AcademicWorkspace and the Gradebook's summary card using `StatProgressBar`) still visually fill from empty to their correct percentage, left to right, on load.
  - In Chrome DevTools' Performance panel, record a reload and confirm the progress-bar animation no longer shows a "Layout" purple block in the flame chart during its animation window (it should show only "Composite"/"Paint" activity, confirming it's now GPU-composited).
  - In the Animations panel, set playback to 10% and confirm the bar visibly scales in from the left edge rather than "growing" — the effect should look the same as before to the naked eye at normal speed.
- **Done when**: neither progress bar animates the `width` CSS property anymore (confirmed via DevTools' Elements/Computed panel showing `transform` changing, not `width`), and the visual fill behavior is unchanged.
