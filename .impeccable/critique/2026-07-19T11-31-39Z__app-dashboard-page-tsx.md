---
target: dashboard (app/dashboard/page.tsx)
total_score: 24
p0_count: 2
p1_count: 2
timestamp: 2026-07-19T11-31-39Z
slug: app-dashboard-page-tsx
---
Method: dual-agent (A: a44ceb2de4eba510a · B: a7667babd49fcfd75)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading skeleton, count-up numbers, live-class indicator all work; fetch failures fail silently into empty states (see #9). |
| 2 | Match System / Real World | 3 | SGPA/CGPA/semester language fits; greeting assumes "classes going well" even on non-class days. |
| 3 | User Control and Freedom | 2 | `AcademicWorkspace` can't be collapsed/dismissed once 100% complete; program-length select auto-saves with no confirmation. |
| 4 | Consistency and Standards | 2 | `StatCard` (flat gradient, no blur) breaks the Glass-Not-Flat rule other cards on the same screen follow; a dead second implementation (`components/dashboard/StatsCard.tsx`) duplicates it with different visuals and no imports anywhere — two components claiming the same job. |
| 5 | Error Prevention | 3 | Low-stakes page; nothing destructive in scope. |
| 6 | Recognition Rather Than Recall | 3 | Icons+labels strong throughout; Degree Progress `<select>` has zero affordance it's interactive. |
| 7 | Flexibility and Efficiency | 2 | No shortcuts, no compact view, no way to skip the workspace nag for a returning user. |
| 8 | Aesthetic and Minimalist Design | 2 | Seven stacked modules before the page ends — busy for a brand principle of "quiet over loud." |
| 9 | Error Recovery | 1 | Network failures in `AcademicWorkspace.tsx:61` and `SummaryCards.tsx:22,37` are swallowed into the same UI as "no data yet" — indistinguishable from genuine empty state. |
| 10 | Help and Documentation | 2 | One micro-copy hint; no help affordance elsewhere. |
| **Total** | | **24/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**LLM assessment**: Not AI slop by this project's own standard. DESIGN.md documents the glass panels, the single indigo→violet gradient, and the Space Grotesk/Inter pairing as intentional identity, and the dashboard uses them correctly (one gradient on the greeting name, not stacked across headings). The one real slop-adjacent tell is the greeting subtitle copy ("You're making great progress today," "Don't forget to rest and recharge") — generic wellness-app filler that undercuts the "sharp, fintech, not a playful toy" personality PRODUCT.md asks for.

**Deterministic scan**: `detect.mjs` found 2 `gradient-text` warnings (`page.tsx:122`, `Navbar.tsx:480`) and 15 `ai-color-palette` warnings, all indigo/violet, across `StatCard.tsx`, the dead `StatsCard.tsx`, `SummaryCards.tsx`, `Navbar.tsx` (6 hits alone), and `button.tsx`. Per DESIGN.md these read as the documented brand gradient rather than AI-slop palette drift — genuine false positives against this project's identity — but the sheer count in `Navbar.tsx` is worth a manual check that the gradient hasn't spread past "wordmark + one emphasis" into decoration. Separately, and not shielded by the identity note: 24 `design-system-font-size` advisories for literal off-ramp px sizes (7.5px–11px) concentrated in `WeeklyTimetable.tsx`, `TodaysClasses.tsx`, `SummaryCards.tsx`, and `AcademicWorkspace.tsx` — real type-scale drift the LLM review didn't independently flag.

**Visual overlays**: Not available this run. `/dashboard` is a protected route; an unauthenticated browser session redirected to `/login` as expected, so no authenticated dashboard content was reachable for browser injection. This review is source-based.

## Overall Impression

The dashboard has real craft in its motion and micro-detail (count-up numbers, the live-class timeline, a genuinely calm empty state) and stays on-brand with the documented glass/gradient system. But it inverts its own stated value proposition: PRODUCT.md's whole pitch is "memory over computation, check your number like a banking app," yet the first thing rendered below the greeting is a document-completion nag, not the number. The page also reads busy — five stat cards, a five-tile workspace grid, two timetable widgets, a chart, and three quick-action tiles all compete at the same visual weight, with nothing marked as the thing that matters most today.

## What's Working

- **`components/shared/StatCard.tsx`'s `AnimatedNumber`** — count-up-on-mount for SGPA/CGPA/credits makes the numbers feel "arrived at," reinforcing "correctness reads as confidence."
- **`components/dashboard/TodaysClasses.tsx`** — the vertical timeline with a live-now indicator and per-subject color coding is a genuinely useful real-time view, not decorative motion.
- **The empty state (`app/dashboard/page.tsx:164-181`)** — calm tone, single clear CTA, correctly resists gamification or shame-based copy.

## Priority Issues

- **[P0] Workspace nag renders above the numbers.** `AcademicWorkspace` (`app/dashboard/page.tsx:144`) renders unconditionally before `SummaryCards` (`:147`) and never collapses even at 100% completion. Directly contradicts "memory over computation" / "quiet over loud" — the student's actual SGPA/CGPA sits below a checklist on every visit.
  **Fix**: collapse to a single-line status chip once complete, or move below `SummaryCards`.
  **Suggested command**: `/impeccable layout`

- **[P0] Weekly Timetable detail is mouse-only.** `components/dashboard/WeeklyTimetable.tsx:184-189` wires class-block detail to `onMouseEnter`/`onMouseLeave` only — no click, focus, `tabIndex`, or button role. Faculty/room/duration (lines 211-231) are unreachable by keyboard or screen reader and invisible on touch, which is how most students will use this.
  **Fix**: make slots real focusable buttons with click-to-toggle and keyboard support.
  **Suggested command**: `/impeccable harden`

- **[P1] CGPA trend chart has no accessible fallback.** `components/dashboard/CGPATrend.tsx` renders a bare Recharts `AreaChart` with no `aria-label`, caption, or data-table alternative. "Insight over time" is PRODUCT.md's entire differentiator over a one-off calculator — for a screen-reader user that differentiator doesn't exist.
  **Fix**: add a visually-hidden summary or table alternative.
  **Suggested command**: `/impeccable harden`

- **[P1] Silent fetch failures collapse into empty states.** `AcademicWorkspace.tsx:61` and `SummaryCards.tsx:22,37` all swallow errors into the same UI as "no data yet." A student can't tell whether they truly have no data or the network just failed.
  **Fix**: distinguish error vs. empty with a retry affordance.
  **Suggested command**: `/impeccable harden`

- **[P2] Duplicate, dead stat-card component.** `components/dashboard/StatsCard.tsx` (plural) is a fully-built second implementation of `components/shared/StatCard.tsx` — different visuals (flat gradient, no blur — breaks Glass-Not-Flat), different color map, zero imports anywhere in the codebase. Confusable naming caused the detector's own scan to attribute findings to the wrong file. This is exactly the "same job, two components" inconsistency the product register bans.
  **Fix**: delete `components/dashboard/StatsCard.tsx`.
  **Suggested command**: `/impeccable distill`

- **[P2] Generic, data-blind greeting copy.** `getGreeting()` (`app/dashboard/page.tsx:27-32`) produces unearned reassurance ("You're making great progress today") disconnected from the student's actual state — undercuts the "sharp, fintech, not a playful toy" personality.
  **Fix**: make copy neutral or data-aware.
  **Suggested command**: `/impeccable clarify`

## Persona Red Flags

**Alex (impatient power user)**: Must scroll past the 5-tile workspace grid and 5 `SummaryCards` before reaching the chart every visit, with no collapse option once already complete. The Degree Progress `<select>` (`SummaryCards.tsx:107`) has no visible affordance it's clickable.

**Sam (accessibility-dependent)**: `WeeklyTimetable.tsx` slot popovers are hover-only — unreachable by keyboard, invisible to assistive tech. `CGPATrend.tsx`'s chart has no accessible alternative. (Counter-example done right: `AcademicWorkspace.tsx`'s document tiles are real `<button>`s with correct `aria-label`s.)

**Stressed student checking CGPA** (project-specific): Lands on a completion nag before their number; gets no contextual framing near the CGPA/SGPA readout (no delta vs. last semester, no "on track for your target" callout) despite a `GPATargetCalculator` existing elsewhere in the app — a missed reassurance moment at exactly the high-stakes point this persona exists for.

## Minor Observations

- `StatCard.tsx` cards are flat gradient-fill with no `backdrop-blur`, while every sibling card on the same screen is true glass — breaks DESIGN.md's Glass-Not-Flat rule.
- The dark-mode `--glass-border` token is neutral white at 10% alpha, not indigo-tinted as DESIGN.md's prose describes; `AcademicWorkspace.tsx:75` manually overrides to an indigo border while sibling cards don't, producing a subtle inconsistency across cards on the same screen.
- The header's date/day glass panel (`page.tsx:129-140`) occupies a full card slot for information already visible on any device's own clock.
- The empty-state CTA (`page.tsx:173-179`) hand-rolls `bg-indigo-500 hover:bg-indigo-600` instead of reusing the shared `Button` `gradient` variant.
- Quick-action tiles duplicate items already in the Navbar's "Calculators" dropdown — fine as shortcuts, but worth noting as redundant IA.
- 24 `design-system-font-size` advisories (7.5px–11px literals) concentrated in `WeeklyTimetable.tsx`, `TodaysClasses.tsx`, `SummaryCards.tsx`, `AcademicWorkspace.tsx` — off the documented type ramp.

## Questions to Consider

1. If "memory over computation" is the entire value proposition, why is the first thing a returning student sees below the greeting a document-completion checklist rather than their number?
2. A banking app would never hide your balance behind a "complete your KYC" banner on every visit — why does this dashboard do exactly that with the Academic Workspace widget?
3. Right now a genuine fetch failure and "you truly have no data yet" render as the identical empty state across three components — was that fusion deliberate, or an oversight?
