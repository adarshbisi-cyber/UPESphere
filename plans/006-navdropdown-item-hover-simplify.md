# 006 — Simplify NavDropdown item hover to one cheap treatment

- **Status**: TODO
- **Commit**: 157ae7b
- **Severity**: MEDIUM
- **Category**: Purpose & frequency
- **Estimated scope**: 1 file, small

## Problem

`components/shared/Navbar.tsx:208-244` — every item inside the "Calculators"/"Calendar" nav dropdowns compounds four separately-animated properties on a single hover, current code:

```tsx
<motion.div
  key={item.href}
  custom={i}
  initial="hidden"
  animate="visible"
  variants={itemVariants}
  whileHover={
    active
      ? undefined
      : {
          y: -2,
          scale: 1.018,
          boxShadow: '0 6px 22px rgba(99,102,241,0.18), 0 2px 8px rgba(99,102,241,0.10)',
          transition: { type: 'spring', stiffness: 420, damping: 26 },
        }
  }
  className={cn(
    'group relative rounded-xl border transition-colors duration-200 cursor-pointer',
    i === items.length - 1 && items.length % 2 !== 0 && 'col-span-2',
    active
      ? item.activeBg
      : 'border-transparent hover:bg-indigo-500/[0.09] hover:border-indigo-500/30'
  )}
>
  <Link href={item.href} role="menuitem" onClick={() => setOpen(false)} className="flex items-start gap-3 p-3.5 focus-visible:outline-none">
    <div
      className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105',
        item.iconBg
      )}
    >
      <item.icon
        className={cn(
          'w-[18px] h-[18px] transition-all duration-200 group-hover:scale-110 group-hover:-rotate-6',
          item.iconClass
        )}
      />
    </div>
    {/* text */}
  </Link>
</motion.div>
```

This menu is opened and closed many times per session by a returning user, and every hover over any of its 5 items (Calculators has 5, Calendar has 3) simultaneously animates: a spring-based `y`/`scale` lift with a custom shadow on the row, a `scale-105` on the icon's background square, and a `scale-110` + `-rotate-6` on the icon glyph itself. AUDIT.md §1: *"Tens of times/day (hover effects, list navigation) → remove or drastically reduce"* and *"Hunt for: ...decorative motion on list items or hover states hit constantly."* This is well past "a simple, cheap transform/opacity change" for something hit this often.

## Target

Collapse to a single, cheap treatment: drop the spring lift, box-shadow, icon scale, and icon rotation entirely; keep only the existing background/border color change (already present via `hover:bg-indigo-500/[0.09] hover:border-indigo-500/30` in the className) plus one small, non-spring translate for tactile feedback.

```tsx
<motion.div
  key={item.href}
  custom={i}
  initial="hidden"
  animate="visible"
  variants={itemVariants}
  className={cn(
    'group relative rounded-xl border transition-colors duration-200 cursor-pointer',
    i === items.length - 1 && items.length % 2 !== 0 && 'col-span-2',
    active
      ? item.activeBg
      : 'border-transparent hover:bg-indigo-500/[0.09] hover:border-indigo-500/30'
  )}
>
  <Link href={item.href} role="menuitem" onClick={() => setOpen(false)} className="flex items-start gap-3 p-3.5 focus-visible:outline-none">
    <div
      className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
        item.iconBg
      )}
    >
      <item.icon className={cn('w-[18px] h-[18px]', item.iconClass)} />
    </div>
    {/* text unchanged */}
  </Link>
</motion.div>
```

The `whileHover` prop is removed entirely (the color-change hover feedback already comes from the Tailwind `hover:` classes on the outer div, which is sufficient). The icon's `group-hover:scale-105/110` and `-rotate-6` transforms and their `transition-transform`/`transition-all` utility classes are removed — the icon now just inherits the parent's simpler hover.

## Repo conventions to follow

- `components/dashboard/StatCard.tsx:60` (`hover:scale-[1.02] transition-transform duration-200`) is the repo's existing pattern for "cheap, single-property hover feedback" — if a bit of hover feedback beyond color is wanted here, follow that exact pattern (a single `hover:scale-[1.01]` or similar on the outer `motion.div`'s className) rather than reintroducing a spring or multi-property `whileHover` object.
- Do not remove the `variants={itemVariants}`/`initial="hidden"`/`animate="visible"` mount-stagger — that's the entrance animation (already correctly staggered per `itemVariants`, defined earlier in the file) and is out of scope; only the `whileHover` prop and the icon's hover-transform classes are being simplified here.

## Steps

1. Open `components/shared/Navbar.tsx`, locate the `NavDropdown` component's item-rendering `motion.div` (around the area described in Problem — search for `whileHover` if line numbers have shifted).
2. Delete the entire `whileHover={...}` prop (the ternary object with `y`, `scale`, `boxShadow`, `transition`).
3. On the icon-background `<div>` inside the `Link`, remove `transition-transform duration-200 group-hover:scale-105` from its className, leaving `'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0'` plus `item.iconBg`.
4. On the `<item.icon>` element, remove `transition-all duration-200 group-hover:scale-110 group-hover:-rotate-6` from its className, leaving `'w-[18px] h-[18px]'` plus `item.iconClass`.
5. Save and let the dev server hot-reload; the dropdown items should now only show the existing background/border color change on hover.

## Boundaries

- Do NOT touch the `MobileNavAccordion` component in the same file (it's a separate component for the mobile menu, not covered by this finding — confirm it doesn't have the same `whileHover` pattern before assuming it's out of scope; if it does have an identical pattern, report it rather than silently expanding this plan to fix it too).
- Do NOT touch `itemVariants` (the entrance/stagger animation) — only the hover behavior.
- Do NOT remove the `transition-colors duration-200` on the outer div's className — that's the correct, kept hover feedback.
- If the `whileHover` object or icon classNames have changed materially since this plan was written, STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit -p .` and `npm run test -- --run` — both clean.
- **Feel check**: Open the Navbar's "Calculators" dropdown and hover rapidly back and forth across all 5 items several times in a row (simulating a user scanning the menu). Confirm:
  - No lift/spring-bounce, no box-shadow pop, no icon scale/rotation on hover anymore.
  - Only a subtle background tint and border color change remain.
  - The menu feels calmer and less "busy" when scanned quickly, with no loss of the "this is clickable" affordance.
- **Done when**: hovering any dropdown item shows only a background/border color transition, with zero transform-based motion on the row or the icon.
