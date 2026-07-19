# 011 — Raise entrance scale values up to the 0.9–0.97 floor

- **Status**: TODO
- **Commit**: 157ae7b
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Estimated scope**: 7 files, small (11 call sites)

## Problem

AUDIT.md §3 is explicit: *"Never `scale(0)` — nothing in the real world appears from nothing. Target: `scale(0.9–0.97)` + `opacity: 0`."* Eleven `initial={{ scale: ... }}` entrance values across 7 files sit well below that floor — some dramatically so (0.3, 0.6) — meaning these elements visually "pop from nothing" rather than growing from a near-final size, which reads as artificial/floaty rather than physical.

Confirmed via direct grep, the 11 violations (values already at or above 0.9, e.g. `0.92`/`0.95`/`0.96`/`0.98`/`0.9` itself, are compliant and NOT included below):

- `components/onboarding/steps/WelcomeStep.tsx:16` — `initial={{ scale: 0.8, opacity: 0 }}`
- `components/onboarding/steps/FinalStep.tsx:35` — `initial={{ scale: 0.7, opacity: 0 }}`
- `components/calculators/CurriculumScanner.tsx:458` — `initial={{ opacity: 0, scale: 0.85 }}`
- `components/calculators/CurriculumScanner.tsx:595` — `initial={{ opacity: 0, scale: 0.3 }}` (most extreme violation in the codebase)
- `components/calculators/GPATargetCalculator.tsx:215` — `initial={{ scale: 0.82, opacity: 0, y: 10 }}`
- `components/calculators/AttendanceCalculator.tsx:264` — `initial={{ scale: 0.8 }}` (no paired opacity)
- `components/calculators/AttendanceCalculator.tsx:354` — `initial={{ scale: 0.8, opacity: 0 }}`
- `components/calculators/PassCalculator.tsx:443` — `initial={{ scale: 0.85, opacity: 0 }}`
- `components/calculators/PassCalculator.tsx:475` — `initial={{ scale: 0.8, opacity: 0 }}`
- `components/calculators/PassCalculator.tsx:635` — `initial={{ scale: 0.8, opacity: 0 }}`
- `components/casecomp/CaseCompExperience.tsx:297` — `initial={{ opacity: 0, scale: 0.6 }}`

Note: three of these sites (`PassCalculator.tsx:443,475,635` and `AttendanceCalculator.tsx:264,354`) overlap with plan 001's "remove the remount-on-keystroke `key={value}` pattern" — if plan 001 has already landed by the time this plan executes, those specific `motion.span`/`motion.div` wrappers may have been converted to plain elements (with no `initial`/`scale` prop left at all). Check each site's current state before editing: if the `motion.*` wrapper and `initial` prop are already gone (because plan 001 removed them), skip that specific site here — there's nothing left to fix. If the wrapper is still present, apply this plan's fix as written.

## Target

Raise each violation's scale value to `0.95` (a single, consistent value near the middle of AUDIT.md's 0.9–0.97 range, chosen so all 11 sites converge on the same "how big does this start" feel rather than 11 slightly different values) while leaving every other prop (opacity, other transform values, transition timing) completely unchanged:

```tsx
// WelcomeStep.tsx:16 — before
initial={{ scale: 0.8, opacity: 0 }}
// after
initial={{ scale: 0.95, opacity: 0 }}
```

Apply the identical `0.8/0.7/0.85/0.3/0.82/0.6 → 0.95` substitution at each of the 11 sites listed above — change only the numeric scale value, nothing else in the object.

## Repo conventions to follow

- Several already-compliant sites in the same files use `0.95`/`0.96`/`0.98` as their entrance scale (e.g. `CurriculumScanner.tsx:284`, `CaseCompExperience.tsx:76`, `GPATargetCalculator.tsx:229`) — `0.95` keeps this plan's fixes consistent with the values the codebase already uses elsewhere, rather than introducing a 12th distinct number.
- Do not touch `opacity`, `y`, `delay`, `transition`, or any other property in these objects — this plan is strictly a single-number substitution at each site.

## Steps

1. For each of the 11 file:line citations above, open the file, locate the exact `initial={{ ... }}` object (search for the specific scale value if the line number has shifted, e.g. search `scale: 0.3` in `CurriculumScanner.tsx` — that value is unique enough in the file to relocate reliably), and change only the scale number to `0.95`.
2. For `AttendanceCalculator.tsx:264,354` and `PassCalculator.tsx:443,475,635`: first check whether plan 001 has already run and removed the `motion.*`/`initial` wrapper at that site (search for `key={result.currentPercentage}` / `key={maxBunks}` / `key={r.knownScore}` / `key={r.expectedTotal}` / `key={tier.score}` — if none of these `key=` patterns exist anymore in the file, plan 001 has already landed and removed these entrance animations entirely; skip that site, there's nothing to fix here). If the `key=`/`motion.*`/`initial` pattern is still present, apply step 1's fix normally.
3. After all edits, grep each of the 7 files for the specific old values (`scale: 0.8`, `scale: 0.7`, `scale: 0.85`, `scale: 0.3`, `scale: 0.82`, `scale: 0.6`) to confirm zero remain (except any sites correctly skipped per step 2).

## Boundaries

- Do NOT touch any `initial={{ scale: ... }}` site already at 0.9 or above (e.g. `GPATargetCalculator.tsx:229`'s `scale: 0.9`, `CurriculumScanner.tsx:284`'s `scale: 0.96`, `CaseCompExperience.tsx:76`'s `scale: 0.98`/`:465`'s `scale: 0.92`, `PassCalculator.tsx:563,586`'s `scale: 0.95`) — those are already compliant, not in scope.
- Do NOT change `opacity`, `y`, `transition`, `delay`, or any other prop at the 11 target sites — scale value only.
- Do NOT re-add an `initial`/`motion.*` wrapper at any site that plan 001 has already simplified to a plain element — respect that plan's outcome rather than reverting it.
- If any of the 11 cited lines has different code than described here (beyond the plan-001 overlap already anticipated), STOP and report rather than guessing.

## Verification

- **Mechanical**: `npx tsc --noEmit -p .` and `npm run test -- --run` — both clean.
- **Feel check**: For each of the 7 affected files, trigger the relevant entrance (onboarding Welcome/Final steps, CurriculumScanner's scan-progress and result reveal, GPA Target Calculator's result card, Attendance Calculator's percentage/bunks reveal if not already fixed by plan 001, Pass Calculator's score reveals if not already fixed by plan 001, CaseCompExperience's whatever renders at line 297). In DevTools' Animations panel, set playback to 10% and confirm each element now grows from a near-final size (subtly) rather than visibly "popping" from a much smaller point — most noticeable on the former `scale: 0.3` and `scale: 0.6` sites, which should look meaningfully more natural after this fix.
- **Done when**: all 11 target sites (minus any correctly skipped due to plan 001 overlap) animate in from `scale: 0.95`, and no other prop at those sites has changed.
