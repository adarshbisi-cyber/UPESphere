# 001 — Remove remount-on-keystroke result animations in calculators

- **Status**: TODO
- **Commit**: 157ae7b
- **Severity**: HIGH
- **Category**: Purpose & frequency
- **Estimated scope**: 3 files, small-medium (6 call sites)

## Problem

Six result displays across three calculators use `key={value}` on a `motion.div`/`motion.span`, where `value` is the exact number that recomputes on every keystroke as the student edits any input. React treats a changed `key` as "this is a new element" — it unmounts the old one and mounts a fresh one, replaying the full entrance animation (scale-and-fade or spring pop-in) on every single keystroke. This is a calculator a student uses repeatedly in one sitting (adding many subjects/marks one at a time), so this decorative entrance fires dozens of times per session — exactly the "hunt for: decorative motion... hit constantly" case in AUDIT.md §1.

`components/calculators/CGPACalculator.tsx:165-173` — current:
```tsx
<motion.div
  key={result.cgpa}
  initial={{ scale: 0.9, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  className={`text-7xl font-bold font-display ${getGPAColor(result.cgpa)}`}
>
  {result.cgpa.toFixed(2)}
</motion.div>
```

`components/calculators/PassCalculator.tsx:441-448` — current:
```tsx
<motion.span key={r.knownScore} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
  {/* score value */}
</motion.span>
```

`components/calculators/PassCalculator.tsx:472-481` — current:
```tsx
<motion.span key={r.expectedTotal} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
  {/* expectedTotal value */}
</motion.span>
```

`components/calculators/PassCalculator.tsx:633-641` — current:
```tsx
<motion.span key={tier.score} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.07 + 0.1 }}>
  {/* tier.score value */}
</motion.span>
```

`components/calculators/AttendanceCalculator.tsx:262-269` — current:
```tsx
<motion.span key={result.currentPercentage} initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
  {result.currentPercentage.toFixed(1)}%
</motion.span>
```

`components/calculators/AttendanceCalculator.tsx:352-359` — current:
```tsx
<motion.div key={maxBunks} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
  {maxBunks}
</motion.div>
```

Note the file may have shifted a few lines since this plan was written (other unrelated edits could land first) — if the `key={...}` prop or the exact values described here aren't at the cited line, search the file for `key={result.` / `key={r.` / `key={tier.` / `key={maxBunks}` to relocate them before proceeding, per the Boundaries section below.

## Target

Remove the `key` prop entirely from all six sites so React re-renders the existing element in place instead of remounting it, and remove the now-pointless entrance `initial`/`animate`/`transition` (there is nothing left to animate on a value that just updates in place — a static `<span>`/`<div>` displaying the number is correct). If a "value changed" pulse is still wanted, that would be a separate, deliberate micro-interaction (not in scope here — do not add one unless a future plan asks for it).

Example, `CGPACalculator.tsx:165-173`:
```tsx
<div className={`text-7xl font-bold font-display ${getGPAColor(result.cgpa)}`}>
  {result.cgpa.toFixed(2)}
</div>
```

Apply the same transformation (drop `key`, drop the motion wrapper down to a plain element with the same className) to the other five sites, preserving every existing className/style exactly as-is — only the animation wrapper and `key` prop are removed.

## Repo conventions to follow

- `components/calculators/GPACalculator.tsx:82-97` already solves this correctly for its own animated counter — it uses a `useEffect` + Framer Motion's `animate()` function to interpolate the displayed number smoothly between old and new values, with no remount and no jarring pop. That file is the exemplar for "how this app handles a live-updating number" — do not copy its interpolation approach into this plan's six sites (that would be a larger, separate enhancement); this plan's scope is strictly to stop the remount-and-replay pattern, i.e. remove `key`/`motion.*`/entrance props and render a plain element. A follow-up plan could later apply `GPACalculator.tsx`'s interpolation technique to these six sites if delight is wanted back — note that as a natural next step but do not implement it here.

## Steps

1. In `components/calculators/CGPACalculator.tsx`, locate the `motion.div` at (originally) line 165. Replace the `<motion.div key={result.cgpa} initial={...} animate={...} transition={...} className={...}>` with `<div className={...}>`, keeping the exact same `className` template string and children unchanged. Remove the `motion` import from this file only if it becomes unused after this change (check for other `motion.` usages in the file first — if any remain, keep the import).
2. In `components/calculators/PassCalculator.tsx`, locate the three `motion.span` sites (`key={r.knownScore}`, `key={r.expectedTotal}`, `key={tier.score}`). For each, replace the `motion.span` (with its `key`, `initial`, `animate`, `transition` props) with a plain `<span className={...}>` carrying the same className and children. Do not touch any other `motion.` usage in this file (e.g. surrounding container animations) — only these three specific spans.
3. In `components/calculators/AttendanceCalculator.tsx`, locate the two sites (`key={result.currentPercentage}` on a `motion.span`, `key={maxBunks}` on a `motion.div`). Replace each with a plain element (`span`/`div` respectively) carrying the same className and children, dropping `key`/`initial`/`animate`/`transition`.
4. After all edits, grep each of the three files for `from 'framer-motion'` and for remaining `motion.` usages — if a file has zero remaining `motion.` references, remove the now-unused import; otherwise leave the import in place for the file's other animations.

## Boundaries

- Do NOT touch `components/calculators/GPACalculator.tsx` (it's already correct — the exemplar, not a target).
- Do NOT touch `components/calculators/CGPATargetCalculator.tsx` or `GPATargetCalculator.tsx` unless you find the identical `key={value}`-on-result pattern there — if you do find it, stop and report it rather than silently expanding scope; it is not confirmed in this plan.
- Do NOT change any layout, className, or visual styling — only remove the animation wrapper and `key` prop.
- Do NOT add a new interpolating counter (that's a separate, future enhancement, not this plan).
- Do NOT add new dependencies.
- If the cited code has drifted (the `key={...}` pattern isn't found at/near the cited lines), STOP and report instead of improvising a fix on different code.

## Verification

- **Mechanical**: `npx tsc --noEmit -p .` — must report zero new errors. `npm run test -- --run` — all existing tests must still pass (none of these files are directly under test, so this is a regression check).
- **Feel check**: Run the dev server, open the GPA/CGPA calculator, add several subjects and edit their grades/credits rapidly (type digits one at a time in a credits field). Confirm:
  - The result number updates in place with no flash, scale-pop, or flicker on each keystroke.
  - Do the same in the Pass % calculator (edit "known score" and "expected total" inputs) and the Attendance calculator (edit attended/total classes) — same check: no pop-in animation replays per keystroke.
  - The very first time a result appears (e.g. after entering the first valid input) should still just display the number — no entrance animation is expected anymore, and that's correct per this plan's fix.
- **Done when**: typing in any of the three calculators' inputs no longer triggers a visible scale/fade animation on the result value, and `tsc`/tests are clean.
