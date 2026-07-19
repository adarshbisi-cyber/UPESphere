# 004 — Anchor trigger-scaled popovers to their transform-origin

- **Status**: TODO
- **Commit**: 157ae7b
- **Severity**: HIGH
- **Category**: Physicality & origin
- **Estimated scope**: 2 files, small (3 call sites)

## Problem

Three popover-style panels scale in/out with no `transform-origin` set, so they default to `center` — meaning they visually "balloon" from their own middle rather than growing from the trigger button that opened them. AUDIT.md §3: *"Popovers/dropdowns/tooltips scale from their trigger, not center... Modals are exempt — they appear centered; do not report it."* These three are anchored dropdowns opened from a specific button, not centered modals, so they are not exempt.

`components/shared/Navbar.tsx:169-177` (NavDropdown panel, opened from the "Calculators"/"Calendar" nav buttons) — current:
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.96, y: -8 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.96, y: -8 }}
  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
  role="menu"
  className="absolute left-0 top-[calc(100%+10px)] w-[460px] rounded-2xl z-50 overflow-hidden backdrop-blur-2xl"
  style={{
    background: 'var(--dropdown-bg)',
    border: '1px solid var(--dropdown-border)',
    boxShadow: 'var(--dropdown-shadow)',
  }}
>
```
Positioned `absolute left-0 top-[calc(100%+10px)]` — i.e. below and left-aligned with its trigger — but no `transform-origin` anywhere in the style block, so it scales from its own center (50% 50%) instead of its top-left corner (nearest the trigger button above it).

`components/shared/Navbar.tsx:398-410` (UserMenu, the profile avatar dropdown) — current:
```tsx
<motion.div
  initial={{ opacity: 0, y: 6, scale: 0.97 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: 6, scale: 0.97 }}
  transition={{ duration: 0.15 }}
  className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-50"
  style={{
    background: 'var(--glass-from)',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--glass-shadow)',
  }}
>
```
Positioned `absolute right-0 top-full` (below, right-aligned with the avatar button) — same missing `transform-origin` issue, should scale from top-right.

`components/ui/select.tsx:65-84` (`SelectContent`, the shared Radix `<Select>` dropdown used by GPA/CGPA calculators for grade pickers) — current:
```tsx
const SelectContent = React.forwardRef<...>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      style={{ background: 'hsl(var(--card))', border: '1px solid var(--divider)' }}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-xl text-popover-foreground shadow-2xl backdrop-blur-md',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2',
        position === 'popper' && 'data-[side=bottom]:translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
```
Uses `zoom-in-95`/`zoom-out-95` (tailwindcss-animate utilities) with no `transform-origin` override, so — same issue — scales from center instead of from wherever the select trigger sits. Radix exposes exactly the CSS variable AUDIT.md recommends for this: `--radix-select-content-transform-origin`.

## Target

`components/shared/Navbar.tsx` NavDropdown panel — add `style={{ transformOrigin: 'top left', ...existing style }}` (merge into the existing `style` object rather than replacing it):
```tsx
style={{
  background: 'var(--dropdown-bg)',
  border: '1px solid var(--dropdown-border)',
  boxShadow: 'var(--dropdown-shadow)',
  transformOrigin: 'top left',
}}
```

`components/shared/Navbar.tsx` UserMenu panel — same, but `top right` (it's right-aligned via `right-0`):
```tsx
style={{
  background: 'var(--glass-from)',
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--glass-shadow)',
  transformOrigin: 'top right',
}}
```

`components/ui/select.tsx` `SelectContent` — add the Radix-provided CSS variable to the `style` prop:
```tsx
style={{
  background: 'hsl(var(--card))',
  border: '1px solid var(--divider)',
  transformOrigin: 'var(--radix-select-content-transform-origin)',
}}
```

## Repo conventions to follow

- All three components already pass a `style` object alongside a `className` — follow that exact pattern (add the `transformOrigin` key into the existing `style` object literal; do not introduce a separate inline `style` attribute or a new CSS class).
- This is the first place in the repo using a Radix `--radix-*-transform-origin` CSS variable — `components/ui/select.tsx` is the only Radix content component with a scale-based open/close animation (confirmed: `Dialog`/`DropdownMenu`/`Tabs`/`Accordion`/`Toast`/`Tooltip` primitives are installed but not all have this exact zoom animation wired — do not touch primitives outside `select.tsx` as part of this plan even if you notice a similar gap; that would be new, unconfirmed scope).

## Steps

1. In `components/shared/Navbar.tsx`, find the `NavDropdown` component's panel `motion.div` (the one with `role="menu"` and `className="absolute left-0 top-[calc(100%+10px)]..."`). Add `transformOrigin: 'top left'` as a new key in its existing `style={{ ... }}` object.
2. In the same file, find the `UserMenu` component's panel `motion.div` (`className="absolute right-0 top-full mt-2..."`). Add `transformOrigin: 'top right'` as a new key in its existing `style={{ ... }}` object.
3. In `components/ui/select.tsx`, find `SelectContent`'s `style={{ background: 'hsl(var(--card))', border: '1px solid var(--divider)' }}` and add `transformOrigin: 'var(--radix-select-content-transform-origin)'` as a third key.
4. Save and let the dev server hot-reload.

## Boundaries

- Do NOT touch any other Radix primitive file (`dropdown-menu.tsx`, `dialog.tsx`, `tabs.tsx`, `accordion.tsx`, `toast.tsx`, `tooltip.tsx` if they exist as separate files under `components/ui/`) — only `select.tsx` is confirmed in scope here.
- Do NOT change the `scale`/`zoom` values themselves, the durations, or any other animation property — only add the missing `transformOrigin`.
- Do NOT add new dependencies.
- If any of the three cited `style`/`className` blocks has changed shape since this plan was written (e.g. `style` prop removed in favor of a CSS module), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit -p .` and `npm run test -- --run` — both clean.
- **Feel check**:
  - Open the Navbar's "Calculators" dropdown — confirm it visually grows from its top-left corner (nearest the "Calculators" button) rather than ballooning from its own center.
  - Open the profile avatar dropdown (top-right of the Navbar) — confirm it grows from its top-right corner.
  - Open a grade-select dropdown in the GPA Calculator — confirm it scales from near the select trigger, not from the dropdown's own center.
  - In Chrome DevTools' Animations panel, set playback to 10% for each of the three and visually confirm the anchor point matches the trigger side described above.
- **Done when**: all three popovers visibly scale from their trigger-adjacent corner, not their own center, verified in slow motion.
