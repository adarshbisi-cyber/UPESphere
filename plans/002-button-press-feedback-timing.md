# 002 — Split Button press feedback from its 200ms hover/color transition

- **Status**: TODO
- **Commit**: 157ae7b
- **Severity**: HIGH
- **Category**: Easing & duration
- **Estimated scope**: 1 file, tiny

## Problem

`components/ui/button.tsx:7` — current:
```tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  { /* variants */ }
)
```

The `active:scale-[0.98]` press-feedback transform shares the same `transition-all duration-200` used for hover/color-change transitions. AUDIT.md's duration table specifies **button press feedback: 100–160ms**; this runs at 200ms — 40 to 100ms above budget. `Button` is the single most-instantiated interactive primitive in the app (used on effectively every clickable action across dashboard, gradebook, calculators, onboarding, auth), so this small per-press delay compounds into a systemic "buttons feel slightly laggy" impression across the whole product — AUDIT.md's severity framing for "100+ times/day" elements applies directly here.

## Target

Split the press-feedback transform onto its own faster transition, separate from the 200ms transition used for hover/color/shadow changes:

```tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] active:duration-150 transition-transform',
  { /* variants unchanged */ }
)
```

Concretely: replace `transition-all duration-200` with two explicit Tailwind transition-property utilities — `transition-colors duration-200` for the color/background/border/ring changes, and `transition-transform duration-150` for the `scale-[0.98]` press feedback. Tailwind lets you combine multiple `transition-*` property utilities on one element (each sets the `transition-property` list); confirm the generated CSS ends up as something equivalent to `transition-property: color, background-color, border-color, ...; transition-duration: 200ms` plus `transition-property: transform; transition-duration: 150ms` not colliding — since Tailwind's utilities all set the same `transition-duration`/`transition-timing-function` custom properties by default, the cleanest implementation is an explicit arbitrary value:

```tsx
'transition-[color,background-color,border-color,box-shadow] duration-200 ... active:scale-[0.98] active:transition-transform active:duration-150'
```

Use whichever of these two forms actually compiles correctly (verify in the browser inspector that `:active` shows a 150ms transform transition and non-active hover shows 200ms color transition) — the important, non-negotiable target is: **transform duration must be 150ms (within the 100-160ms budget), color/shadow duration stays 200ms**, independently.

## Repo conventions to follow

- This is the only place in the codebase using `active:scale-[0.98]` as a shared cva base class (confirmed via grep) — there is no existing exemplar of split transition-property utilities elsewhere in the repo to imitate; this plan introduces the pattern here first, as cleanly as Tailwind allows.
- Do not touch any of the `variant`-specific classes (the `default`/`destructive`/`outline`/`secondary`/`ghost`/`link`/`gradient`/`gradient-outline` strings) — only the base string outside the `variants` object.

## Steps

1. Open `components/ui/button.tsx`.
2. In the `cva(...)` base class string (the first argument, currently `'inline-flex ... transition-all duration-200 ... active:scale-[0.98]'`), replace `transition-all duration-200` with `transition-[color,background-color,border-color,box-shadow] duration-200`.
3. Immediately after `active:scale-[0.98]` in that same string, append `active:duration-150 active:ease-out` and also add a `transition-transform` utility so the transform specifically animates over its own duration. The simplest robust approach: add `transition-transform` as a second transition utility alongside the arbitrary-property one from step 2 — Tailwind supports multiple transition-property utilities on one element (they don't conflict, since each maps to a different specificity of the same underlying `transition` shorthand via CSS layers) — but if in testing you find the two `duration-*` utilities collide (Tailwind's default duration utility sets one shared `--tw-duration` used by all transition-property utilities on the element), fall back to the fully explicit form instead:
   ```tsx
   'transition-[color,background-color,border-color,box-shadow,transform] duration-200 ... active:scale-[0.98] active:[transition-duration:150ms]'
   ```
   Use the arbitrary-value `active:[transition-duration:150ms]` syntax to force the transform's duration down specifically on `:active`, since Tailwind's utility classes for duration apply uniformly to all listed transition-properties otherwise. This is the more reliable of the two approaches — prefer it if unsure.
4. Save and let the dev server hot-reload.

## Boundaries

- Do NOT touch any other file — this is a single-file, single-class-string change.
- Do NOT change the `scale-[0.98]` value itself (it's already within AUDIT.md's 0.95-0.98 subtle-press-feedback range — only the duration is wrong).
- Do NOT add new dependencies (no need for a CSS-in-JS or custom transition library — Tailwind's arbitrary value syntax is sufficient).
- If the base class string has changed significantly since this plan was written (e.g. `active:scale-[0.98]` no longer present), STOP and report instead of guessing where to add the fix.

## Verification

- **Mechanical**: `npx tsc --noEmit -p .` and `npm run test -- --run` — both clean, zero new errors/failures.
- **Feel check**: Open any page with buttons (e.g. the login page's "Sign In" button, or the dashboard's "Add Grade Sheet" button). In Chrome DevTools, open the Elements panel, select the button, and check the Styles pane for the computed `transition` property while toggling `:active` state (use the "Force element state" pin icon) — confirm the transform's effective duration is 150ms while hover/color transitions remain 200ms.
  - Click and hold the button (mouse down, don't release) — the button should visibly and snappily shrink to 98% scale noticeably faster than before.
  - In DevTools' Rendering panel, throttle CPU 4x and repeat — the press feedback should still feel immediate, not sluggish.
- **Done when**: `:active` triggers a ~150ms transform transition independently of the 200ms color/shadow transition, verified in DevTools, with no visual regression to hover states.
