# 008 — Gate Hero's infinite background blobs and entrance behind prefers-reduced-motion

- **Status**: TODO
- **Commit**: 157ae7b
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 file, small-medium

## Problem

`components/landing/Hero.tsx` is the first thing every visitor sees, and has zero reduced-motion handling anywhere in the file (confirmed: no `useReducedMotion` import, no `prefers-reduced-motion` reference). It contains the single largest-amplitude, most persistent movement in the entire codebase:

`components/landing/Hero.tsx:69-86` — three background blobs, current:
```tsx
{/* Blob 1 — large indigo, slow organic drift */}
<motion.div
  className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]"
  animate={{ x: [0, 45, -18, 12, 0], y: [0, -28, 22, -12, 0], scale: [1, 1.08, 0.96, 1.04, 1] }}
  transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
/>
{/* Blob 2 — violet, different phase */}
<motion.div
  className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px]"
  animate={{ x: [0, -32, 18, -8, 0], y: [0, 22, -28, 14, 0], scale: [1, 0.96, 1.08, 0.98, 1] }}
  transition={{ duration: 22, repeat: Infinity, ease: 'linear', delay: 4 }}
/>
{/* Blob 3 — centre ambient, breathes */}
<motion.div
  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/5 rounded-full blur-[140px]"
  animate={{ scale: [1, 1.06, 0.97, 1.04, 1], opacity: [0.5, 0.7, 0.5, 0.65, 0.5] }}
  transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
/>
```
Blobs 1 and 2 translate up to 45px/32px horizontally and 28px/28px vertically, on an infinite 22-28s loop, forever, from the moment the page loads. Blob 3 only scales/breathes (no translate) — lower vestibular risk, not part of this fix.

`components/landing/Hero.tsx:172-179` — the hero mockup card entrance:
```tsx
<motion.div
  initial={{ opacity: 0, y: 60, scale: 0.95 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
  style={{ x: cardX, y: cardY }}
  className="mt-20 max-w-4xl mx-auto"
>
```
A 60px translateY + scale entrance on first paint, plus a continuous `style={{ x: cardX, y: cardY }}` mouse-parallax effect (from `useTransform`, defined earlier in the file) layered on top.

AUDIT.md §6: *"Reduced motion means fewer and gentler animations, not zero... movement with no `prefers-reduced-motion` handling"* is explicitly called out as a hunt target.

## Target

Import `useReducedMotion` and branch the two blobs' translate ranges to flat (no movement, keep the scale "breathing" if you judge it low-risk, or drop it too for simplicity — this plan keeps only opacity/scale on the reduced path to be conservative) and the entrance's `y`/mouse-parallax to zero:

```tsx
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'framer-motion'

export function Hero() {
  const reduce = useReducedMotion()
  // ...existing heroRef/mouseX/mouseY/cardX/cardY setup unchanged...
```

Blob 1:
```tsx
<motion.div
  className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]"
  animate={reduce ? { scale: [1, 1.04, 1] } : { x: [0, 45, -18, 12, 0], y: [0, -28, 22, -12, 0], scale: [1, 1.08, 0.96, 1.04, 1] }}
  transition={{ duration: reduce ? 8 : 28, repeat: Infinity, ease: 'linear' }}
/>
```
Blob 2 — identical pattern, its own values:
```tsx
<motion.div
  className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px]"
  animate={reduce ? { scale: [1, 1.03, 1] } : { x: [0, -32, 18, -8, 0], y: [0, 22, -28, 14, 0], scale: [1, 0.96, 1.08, 0.98, 1] }}
  transition={{ duration: reduce ? 8 : 22, repeat: Infinity, ease: 'linear', delay: reduce ? 0 : 4 }}
/>
```
(Blob 3 is unchanged — it has no translate to begin with.)

Hero card entrance:
```tsx
<motion.div
  initial={{ opacity: 0, y: reduce ? 0 : 60, scale: reduce ? 1 : 0.95 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
  style={{ x: reduce ? 0 : cardX, y: reduce ? 0 : cardY }}
  className="mt-20 max-w-4xl mx-auto"
>
```

## Repo conventions to follow

- `components/casecomp/CaseCompExperience.tsx` (see plan 007) uses the exact `const reduce = useReducedMotion()` pattern — follow that same variable name and placement (declared once near the top of the component, after other hooks) for consistency across the two files.
- Framer Motion's `useReducedMotion()` returns `boolean | null` — TypeScript may complain if used directly in a strict boolean context; if so, use `!!reduce` or `Boolean(reduce)` where a plain boolean is required (e.g. in the ternaries above, a nullish value is falsy so the ternaries work as-is without coercion, but double check `tsc` output).

## Steps

1. Open `components/landing/Hero.tsx`. Add `useReducedMotion` to the existing `import { motion, useMotionValue, useTransform, animate } from 'framer-motion'` line.
2. Inside `export function Hero() {`, add `const reduce = useReducedMotion()` as the first line of the function body (before the existing `useRef`/`useMotionValue` calls, or immediately after — either is fine, just keep it near the top).
3. Locate Blob 1 and Blob 2's `motion.div`s (search for `blur-[120px]` and `blur-[100px]` if line numbers have shifted) and apply the `reduce ? ... : ...` branching shown in Target to each one's `animate` and `transition` props. Leave Blob 3 untouched.
4. Locate the hero mockup card's `motion.div` (search for `mt-20 max-w-4xl mx-auto` if the line number has shifted) and apply the `reduce ? ... : ...` branching shown in Target to its `initial` and `style` props. Leave its `animate`/`transition` unchanged (the end-state and curve don't need branching — only the starting displacement and the ongoing mouse-parallax).
5. Run `npx tsc --noEmit -p .`; if `reduce` (typed `boolean | null`) causes a strict-mode complaint in any ternary, wrap it as `!!reduce` at that specific usage.

## Boundaries

- Do NOT touch Blob 3 (`blur-[140px]`, centre ambient) — it has no translate, out of scope.
- Do NOT touch the `MagneticButton` component in the same file (its motion is gesture-driven mouse-follow on the CTA button, a separate concern not covered by this plan).
- Do NOT remove the blobs/entrance animation entirely — AUDIT.md is explicit that reduced motion means "fewer and gentler," not zero; keep opacity and (reduced-amplitude) scale motion as shown in Target.
- Do NOT add new dependencies — `useReducedMotion` is already part of the installed `framer-motion` package.
- If the blob or entrance JSX has changed shape since this plan was written, STOP and report rather than improvising against different code.

## Verification

- **Mechanical**: `npx tsc --noEmit -p .` and `npm run test -- --run` — both clean.
- **Feel check**:
  - In Chrome DevTools' Rendering tab, set "Emulate CSS media feature prefers-reduced-motion" to "reduce". Reload the landing page.
  - Confirm the two background blobs no longer drift across the screen (only a subtle scale breathe remains, or none if you chose to drop it).
  - Confirm the hero mockup card fades in without the 60px slide-up, and no longer shifts position when you move the mouse over it.
  - Set the emulation back to "no preference", reload, and confirm the blobs drift and the card entrance/parallax are pixel-identical to before this plan.
- **Done when**: with reduced motion emulated, both blobs stop translating and the hero card entrance/parallax stop moving, while opacity feedback is preserved; with no preference, nothing has visibly changed.
