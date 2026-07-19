# 015 — Stagger the onboarding completion checklist's rows

- **Status**: TODO
- **Commit**: 157ae7b
- **Severity**: Missed opportunity (additive)
- **Category**: Missed opportunities
- **Estimated scope**: 1 file, small

## Problem

`components/onboarding/steps/FinalStep.tsx` is the rare, once-per-user completion moment at the end of onboarding — exactly where AUDIT.md's frequency table (§1) explicitly allows more delight: *"Rare / first-time (onboarding, feedback, celebrations) → Can add delight."* The card and its celebratory icon already get a nice entrance (fade/slide-in card, spring-pop icon), but the "Workspace Status" checklist below it — the actual payoff content showing what the user accomplished — renders all five rows in one static block with no per-item reveal, missing the stagger treatment AUDIT.md §7 calls for on group entrances (30-80ms) and that the rest of this codebase already uses elsewhere (`InsightsPanel.tsx`, `Navbar.tsx`).

Current, `components/onboarding/steps/FinalStep.tsx:47-59`:
```tsx
<div className="rounded-2xl p-5 mb-8 text-left" style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}>
  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">Workspace Status</div>
  <div className="space-y-2.5">
    {entries.map(([key, done]) => (
      <div key={key} className="flex items-center gap-2.5">
        {done
          ? <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          : <Square className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
        <span className={cn('text-sm', done ? 'text-foreground' : 'text-muted-foreground/60')}>{LABELS[key]}</span>
      </div>
    ))}
  </div>
</div>
```

## Target

Give each checklist row its own entrance (opacity + small rise), staggered by index, so the five items reveal in sequence rather than appearing as one static block:

```tsx
<div className="rounded-2xl p-5 mb-8 text-left" style={{ background: 'var(--muted-surface)', border: '1px solid var(--divider)' }}>
  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">Workspace Status</div>
  <div className="space-y-2.5">
    {entries.map(([key, done], i) => (
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
        className="flex items-center gap-2.5"
      >
        {done
          ? <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          : <Square className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
        <span className={cn('text-sm', done ? 'text-foreground' : 'text-muted-foreground/60')}>{LABELS[key]}</span>
      </motion.div>
    ))}
  </div>
</div>
```

The `delay: 0.3 + i * 0.05` base offset (0.3s) lets the checklist start revealing just after the card/icon entrance above it has mostly settled (the card fades in over 0.5s, the icon pops in with a `delay: 0.1` spring) — so the checklist doesn't compete with or visually collide with those earlier entrances. `i * 0.05` (50ms) sits within AUDIT.md's 30-80ms stagger band.

## Repo conventions to follow

- `motion` is already imported in this file (used for the card wrapper and the icon) — no new import needed.
- `0.05` (50ms) matches `InsightsPanel.tsx`'s stagger cadence family (`i * 0.08`) closely enough to feel consistent with the rest of the app, while being slightly snappier since there are 5 short rows here rather than 4 larger insight cards.

## Steps

1. Open `components/onboarding/steps/FinalStep.tsx`, locate the `{entries.map(([key, done]) => (...))}` block inside the "Workspace Status" card.
2. Add an index parameter to the map callback: `{entries.map(([key, done], i) => (...))}`.
3. Change the inner `<div key={key} className="flex items-center gap-2.5">` to a `<motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }} className="flex items-center gap-2.5">`, keeping the same closing tag change (`</div>` → `</motion.div>`) and all children (the `Check`/`Square` icon and label span) unchanged.

## Boundaries

- Do NOT change the card's own entrance (`initial={{ opacity: 0, y: 20 }}`, line 28-33) or the icon's spring pop (line 34-42, `scale: 0.7` — note: plan 011 separately fixes this same icon's scale value from 0.7 to 0.95; that's out of scope here, don't duplicate it in this plan) — only the checklist rows.
- Do NOT change the checklist's content, icons, or conditional done/not-done styling — only add the per-row entrance animation.
- Do NOT add new dependencies.
- If the checklist's JSX has changed shape since this plan was written, STOP and report rather than improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit -p .` and `npm run test -- --run` — both clean.
- **Feel check**: Complete onboarding (or navigate to wherever `FinalStep` renders in the flow) and confirm:
  - The five checklist rows reveal in a visible top-to-bottom cascade rather than appearing all at once.
  - The cascade starts after the card and icon have mostly finished their own entrances (no visual collision/overlap that looks chaotic).
  - In DevTools' Animations panel, set playback to 10% and confirm each row's fade-in is offset from the next by roughly 50ms.
- **Done when**: the Workspace Status checklist's five rows visibly stagger in, timed to follow the card/icon entrance rather than compete with it.
