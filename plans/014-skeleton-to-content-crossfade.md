# 014 — Crossfade loading skeleton into real content on Dashboard and Gradebook

- **Status**: TODO
- **Commit**: 157ae7b
- **Severity**: Missed opportunity (additive)
- **Category**: Missed opportunities
- **Estimated scope**: 2 files, medium (structural — merges two early-return blocks into one conditional render per file)

## Problem

Both `app/dashboard/page.tsx` and `app/gradebook/page.tsx` use an early-return pattern: while data is loading, the component `return`s one JSX tree (a `<main><Navbar/><div className="animate-pulse">...skeleton...</div></main>`); once loaded, a completely separate `return` renders the real `<main><Navbar/><div>...real content...</div></main>`. React unmounts the first tree and mounts the second the instant loading finishes — a hard content swap with no transition, on every single page load. AUDIT.md §8: *"State changes that teleport (content swaps, layout jumps) where a brief transition would prevent a jarring change."*

`app/dashboard/page.tsx:86-99` — current:
```tsx
if (authLoading || fetching || now === null) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded-xl bg-white/5" />
          <div className="h-6 w-96 rounded-xl bg-white/5" />
          <div className="h-40 rounded-2xl bg-white/5 mt-8" />
        </div>
      </div>
    </main>
  )
}

return (
  <main className="min-h-screen bg-background text-foreground">
    <Navbar />
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* real header, AcademicWorkspace, SummaryCards, etc. */}
    </div>
  </main>
)
```

`app/gradebook/page.tsx:47-98` (approximate) — same pattern:
```tsx
if (loading) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded-xl bg-white/5" />
          <div className="h-6 w-96 rounded-xl bg-white/5" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-white/5" />)}
          </div>
          <div className="h-72 rounded-2xl bg-white/5 mt-6" />
        </div>
      </div>
    </main>
  )
}

if (!user) return null

return (
  <main className="min-h-screen bg-background text-foreground">
    <Navbar />
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* real header, summary cards, trend chart, etc. */}
    </div>
  </main>
)
```

## Target

In both files, keep `<Navbar />` mounted persistently (don't remount it — it has its own entrance animation that shouldn't replay), and merge the two early-return JSX trees into a single conditional render *inside* one `<main><Navbar/>...</main>`, wrapping just the inner content area in an `AnimatePresence mode="wait"` keyed on the loading state:

```tsx
// app/dashboard/page.tsx — target shape
import { AnimatePresence, motion } from 'framer-motion'
// ...other imports unchanged...

export default function DashboardPage() {
  // ...all existing hooks/state/effects unchanged...

  const isLoading = authLoading || fetching || now === null

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
          >
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-64 rounded-xl bg-white/5" />
              <div className="h-6 w-96 rounded-xl bg-white/5" />
              <div className="h-40 rounded-2xl bg-white/5 mt-8" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
          >
            {/* exact same real-content JSX that currently lives in the second return's inner div — unchanged, just moved inside this motion.div */}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
```

Apply the identical restructuring to `app/gradebook/page.tsx`, additionally preserving its `if (!user) return null` guard (keep that check exactly where it is, before the single merged `return`, since it's an unrelated "not signed in" bail-out, not part of the loading/content crossfade).

## Repo conventions to follow

- This is the first use of `AnimatePresence`/`motion` in either of these two files — both currently have zero `framer-motion` import. Add `import { AnimatePresence, motion } from 'framer-motion'` to each.
- Use a plain `duration: 0.2` opacity fade (no custom easing import needed — a content-swap crossfade doesn't need a physical curve, matching plan 012's reasoning for the same kind of fix).
- Preserve every existing class name, prop, and piece of content exactly — this plan changes only the *wrapping* structure (early-return → single conditional inside AnimatePresence), not any visual content.

## Steps (apply to both files, once each)

1. Add `import { AnimatePresence, motion } from 'framer-motion'` to the file's import block.
2. Identify the loading-state early return (`if (authLoading || fetching || now === null) { return (...) }` in `dashboard/page.tsx`; `if (loading) { return (...) }` in `gradebook/page.tsx`) and the final real-content `return (...)`.
3. Compute a single boolean for "is loading" if one doesn't already exist as a clean expression (`dashboard/page.tsx` can use `authLoading || fetching || now === null` directly; `gradebook/page.tsx` already computes `const loading = authLoading || (!!user && semesters === null && !fetchError)` — reuse that existing variable, don't recompute).
4. Delete the early `if (isLoading) { return (...) }` block entirely (do not delete `gradebook/page.tsx`'s separate `if (!user) return null` guard — that stays as its own early return, unrelated to this crossfade).
5. Replace the final `return (<main>...<Navbar/><div className="pt-24...">{realContent}</div></main>)` with the merged structure shown in Target: `<main><Navbar/><AnimatePresence mode="wait">{isLoading ? <motion.div key="skeleton" .../* the old skeleton's inner JSX */></motion.div> : <motion.div key="content" .../* the old real content's inner JSX, unchanged */></motion.div>}</AnimatePresence></main>`.
6. Move the `className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"` (currently on the wrapping `<div>` in both the skeleton and content trees) onto each `motion.div` respectively — both branches already use the identical className today, so no visual change results from this move.
7. Repeat steps 1-6 for the second file.

## Boundaries

- Do NOT change any content, styling, or logic inside either the skeleton markup or the real-content markup — only the wrapping structure (two early returns → one conditional inside AnimatePresence).
- Do NOT remove or move `<Navbar />` — it stays outside the `AnimatePresence`, mounted once, unaffected by the loading→content transition.
- Do NOT touch `gradebook/page.tsx`'s `if (!user) return null` guard — leave it as a separate, un-animated early return exactly where it is.
- Do NOT add new dependencies.
- If either file's structure has changed materially since this plan was written (e.g. additional early returns, or the skeleton/content JSX no longer matches what's quoted above), STOP and report rather than improvising a merge against different code.

## Verification

- **Mechanical**: `npx tsc --noEmit -p .` and `npm run test -- --run` — both clean.
- **Feel check**: Reload the Dashboard and the Gradebook page (throttle network to "Slow 3G" in DevTools' Network panel first, to make the loading window long enough to observe clearly). Confirm:
  - The skeleton fades out and the real content fades in, rather than an instant pop/replace.
  - `<Navbar />` does not flicker, remount, or replay its own entrance animation during this transition — it should stay static and unaffected throughout.
  - The crossfade duration feels appropriate for a once-per-load transition (not distractingly slow).
- **Done when**: on both pages, the loading skeleton visibly crossfades into the real content instead of teleporting, with the Navbar unaffected.
