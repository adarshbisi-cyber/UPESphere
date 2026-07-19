# 007 — Wire CaseCompExperience's existing useReducedMotion() into its actual movement

- **Status**: TODO
- **Commit**: 157ae7b
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 file, small

## Problem

`components/casecomp/CaseCompExperience.tsx` already imports and calls `useReducedMotion()` (line 145: `const reduce = useReducedMotion()`), but its only effect is zeroing a stagger delay (line 165: `staggerChildren: reduce ? 0 : 0.08`). The actual translate movement this component uses — which is what `prefers-reduced-motion` is meant to protect against — is left completely ungated:

```tsx
// line 163-166
const heroStagger = {
  hidden: {},
  show: { transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.05 } },
}
// line 167-170
const heroItem = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}
```

And four separate `whileHover` lifts elsewhere in the same file, confirmed via grep:
- line 80: `whileHover={{ y: -5 }}`
- line 245: `whileHover={{ y: -4 }}`
- line 301: `whileHover={{ y: -2 }}`
- line 469: `whileHover={{ y: -3 }}`

AUDIT.md §6: *"Reduced motion means fewer and gentler animations, not zero — keep transitions that aid comprehension, remove position changes. In JS: `useReducedMotion()` and branch transform values."* This file has the hook already in scope and partially wired — this is the cheapest possible reduced-motion fix in the whole codebase (no new state, no new import, just extending an existing branch to the values it should have covered from the start).

## Target

Branch `heroItem`'s `y` value on `reduce`, and branch each `whileHover`'s `y` value on `reduce` (falling back to `undefined`/no-op when reduced motion is requested, so opacity-only feedback remains where applicable, or the hover effect becomes a no-op where the lift was its only purpose):

```tsx
const heroItem = {
  hidden: { opacity: 0, y: reduce ? 0 : 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}
```

For each `whileHover={{ y: N }}` site, change to:
```tsx
whileHover={reduce ? undefined : { y: N }}
```
(substituting each site's own existing `N` value: -5, -4, -2, -3 respectively — do not change the values themselves, only gate them.)

## Repo conventions to follow

- `reduce` is already computed once at the top of the component (line 145) and is in scope everywhere in this file — no need to recompute or pass it down as a prop; just reference the existing `reduce` variable at each site.
- Keep `opacity` transitions un-gated everywhere (per AUDIT.md, opacity/color feedback should remain even under reduced motion) — only the `y` translate values are branched.

## Steps

1. Open `components/casecomp/CaseCompExperience.tsx`, locate `heroItem` (search for `const heroItem = {` if the line number has shifted from 167).
2. Change `hidden: { opacity: 0, y: 22 }` to `hidden: { opacity: 0, y: reduce ? 0 : 22 }`.
3. Locate each of the four `whileHover={{ y: N }}` sites (search for `whileHover` — there should be exactly 4 matches in this file). For each, wrap the object in a ternary: `whileHover={reduce ? undefined : { y: N }}`, preserving each site's original `N` value unchanged.
4. Save and let the dev server hot-reload.

## Boundaries

- Do NOT touch `heroStagger`'s `staggerChildren` line — it's already correctly gated.
- Do NOT touch any other file — this plan is scoped to this one file only.
- Do NOT add a CSS `@media (prefers-reduced-motion)` block to this file — the JS `useReducedMotion()` hook is the correct, already-established mechanism here per AUDIT.md ("In JS: `useReducedMotion()` and branch transform values") and the repo convention already started in this exact file.
- If any of the 4 `whileHover` sites or `heroItem` has changed since this plan was written, STOP and report rather than guessing.

## Verification

- **Mechanical**: `npx tsc --noEmit -p .` and `npm run test -- --run` — both clean.
- **Feel check**:
  - In Chrome DevTools, open the Rendering tab (Cmd+Shift+P → "Show Rendering"), set "Emulate CSS media feature prefers-reduced-motion" to "reduce".
  - Reload the Case Comp Calendar page (`/case-comp`) — confirm the hero content still fades in (opacity) but no longer slides up 22px.
  - Hover over case-comp cards/chips that use the 4 `whileHover` sites — confirm they no longer lift on hover when reduced motion is emulated.
  - Turn the emulation back to "no preference" and confirm all four hover lifts and the hero entrance slide are unchanged from before this plan (full motion still present for users who haven't requested reduction).
- **Done when**: with `prefers-reduced-motion: reduce` emulated, the hero entrance and all 4 hover lifts stop translating (opacity motion may remain), and with no preference set, behavior is pixel-identical to before this plan.
