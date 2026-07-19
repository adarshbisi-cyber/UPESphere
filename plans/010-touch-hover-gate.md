# 010 — Gate transform-based hover effects behind @media(hover:hover) on the highest-traffic primitives

- **Status**: TODO
- **Commit**: 157ae7b
- **Severity**: LOW
- **Category**: Accessibility
- **Estimated scope**: 2 files, small (targeted rollout, not a full sweep)

## Problem

No `@media (hover: hover)` or `(pointer: fine)` gate exists anywhere in the codebase (confirmed: zero matches for `hover: hover`, `pointer: fine`, `@media (hover`). Every `hover:scale-*`/`hover:-translate-*` Tailwind utility and every Framer Motion `whileHover` prop fires unconditionally, including on touch devices — where a tap-and-hold (or even a regular tap, on some browsers/OS combinations) can trigger a `:hover` state that never cleanly exits. AUDIT.md §6: *"`@media (hover: hover) and (pointer: fine) { .element:hover { transform: scale(1.05); } }` — touch fires false hovers on tap."*

This is a systemic, app-wide gap (dozens of `hover:scale`/`whileHover` sites), not a single-location bug. Per AUDIT.md's own framing, this plan does not attempt a full sweep — it establishes the pattern on the two highest-traffic primitives so the fix is real and testable, rather than a vague "add it everywhere" instruction with no concrete scope.

`components/ui/button.tsx:24` — the `gradient` variant, used for primary CTAs throughout the app:
```tsx
gradient:
  'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:shadow-xl hover:scale-[1.02]',
```

`components/shared/StatCard.tsx:60` — used by every Dashboard and Gradebook summary card:
```tsx
'hover:scale-[1.02] transition-transform duration-200 cursor-default'
```

## Target

Tailwind (as of v3.4+, already satisfied by this repo's Tailwind version — verify via `package.json` before proceeding, see Steps) supports the `hover:` variant automatically respecting `@media (hover: hover)` is NOT the default behavior — Tailwind's plain `hover:` utility compiles to a bare `:hover` selector with no media gate. To scope hover behavior to devices that actually support it, add a custom Tailwind variant once, then apply it at these two sites.

In `tailwind.config.ts`, add a custom variant (Tailwind's `addVariant` via the `plugins` array, or simpler — a `screens`-adjacent custom variant using `theme.extend`... actually the simplest, zero-plugin-code approach: define the variant using Tailwind's built-in arbitrary variant syntax directly at the call site, no config change needed):

```tsx
// button.tsx — gradient variant, target
gradient:
  'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:shadow-xl [@media(hover:hover)_and_(pointer:fine)]:hover:scale-[1.02]',
```

```tsx
// StatCard.tsx, target
'[@media(hover:hover)_and_(pointer:fine)]:hover:scale-[1.02] transition-transform duration-200 cursor-default'
```

The `[@media(...)]:` arbitrary-variant syntax is native to Tailwind (no plugin/config change required) and scopes just that one utility (`hover:scale-[1.02]`) to devices with real hover + a fine pointer, while leaving the `hover:shadow-*` utilities (color/shadow feedback, harmless on touch) ungated.

## Repo conventions to follow

- This introduces the pattern for the first time in the repo — there's no existing exemplar to imitate. Keep the arbitrary-variant syntax exactly as shown (`[@media(hover:hover)_and_(pointer:fine)]:hover:UTILITY`) so future call sites can copy this plan's two sites as the reference.
- Do not modify `tailwind.config.ts` for this plan — the arbitrary-variant syntax works without any config changes, keeping this a minimal, two-file, low-risk change.

## Steps

1. Confirm the installed Tailwind version supports arbitrary variants: check `package.json` for `"tailwindcss"` — any 3.x version supports `[...]:` arbitrary variants (this has been stable since Tailwind 3.0). If the installed version is older or this syntax fails to compile, STOP and report rather than adding a plugin.
2. In `components/ui/button.tsx`, locate the `gradient` variant string (search for `hover:scale-[1.02]` if the line has shifted). Replace `hover:scale-[1.02]` with `[@media(hover:hover)_and_(pointer:fine)]:hover:scale-[1.02]`. Leave `hover:shadow-indigo-500/40 hover:shadow-xl` untouched (color/shadow feedback is harmless on touch, no gate needed).
3. In `components/shared/StatCard.tsx`, locate the `StatCard` component's className string (search for `hover:scale-[1.02]`). Apply the identical replacement.
4. Run the dev server and confirm the utility still compiles (Tailwind's JIT should pick up the arbitrary variant with no config change) — inspect the generated class in DevTools to confirm a `@media (hover: hover) and (pointer: fine)` rule wraps the `:hover { transform: scale(1.02) }` rule.

## Boundaries

- Do NOT attempt to gate every `hover:scale`/`hover:-translate`/`whileHover` site in the codebase — this plan is deliberately scoped to these two files only, as the initial rollout of the pattern. Do not expand scope to `AcademicWorkspace.tsx:108`, `CaseCompExperience.tsx:80`, or any other site even though they have the identical issue — those are explicitly out of scope for this plan (a future plan can extend the pattern once it's proven here).
- Do NOT touch Framer Motion's `whileHover` props anywhere (e.g. `CaseCompExperience.tsx`'s `whileHover={{ y: -5 }}`) — gating a JS prop requires a `useMediaQuery` hook and is a different mechanism than the CSS arbitrary-variant approach used here; that's separate, unconfirmed scope.
- Do NOT modify `tailwind.config.ts`.
- Do NOT add new dependencies.
- If the cited className strings have changed since this plan was written, STOP and report rather than guessing where to add the variant.

## Verification

- **Mechanical**: `npx tsc --noEmit -p .` and `npm run test -- --run` — both clean. Run `npm run build` (or the dev server) and confirm no Tailwind compilation errors/warnings about the new arbitrary variant.
- **Feel check**:
  - In Chrome DevTools, open the Elements panel, select a `gradient`-variant button (e.g. login page's "Sign In"), and inspect its computed styles — confirm a `@media (hover: hover) and (pointer: fine)` block wraps the `scale-[1.02]` rule (visible in the "Styles" pane's media-query grouping).
  - Use DevTools' device toolbar to emulate a touch device (e.g. "iPhone 14") and confirm tapping the button no longer shows a lingering scale-up after the tap ends (compare against current behavior before this plan, where the hover scale can stick after a tap on some touch emulation modes).
  - On a real mouse/trackpad (non-touch), confirm hovering the gradient button and any StatCard still shows the 1.02 scale exactly as before — no regression for pointer users.
- **Done when**: the two target sites' hover-scale is confirmed (via DevTools computed styles) to be wrapped in a `(hover: hover) and (pointer: fine)` media condition, with zero visible change in behavior for mouse/trackpad users.
