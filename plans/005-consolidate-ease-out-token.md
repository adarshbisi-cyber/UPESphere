# 005 — Consolidate the 35x duplicated ease-out curve into one shared token

- **Status**: TODO
- **Commit**: 157ae7b
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens
- **Estimated scope**: ~20 files, mechanical find-and-replace

## Problem

The literal array `[0.22, 1, 0.36, 1]` (a strong ease-out curve, functionally very close to AUDIT.md's recommended `cubic-bezier(0.23, 1, 0.32, 1)`) is hand-typed 35 times across the codebase, with no shared constant anywhere. Seven files additionally re-declare their own local `const EASE = [0.22, 1, 0.36, 1] as const` copy. AUDIT.md §7: *"Curves and durations should live as shared tokens. Five hand-typed cubic-beziers that almost match is a consolidation finding."* 35 byte-identical duplicates is a stronger case of the same rule — every one of these is a maintenance liability (a future "let's make the easing slightly snappier" change requires editing up to 35 places correctly).

Confirmed via direct grep (`grep -rn "0.22, 1, 0.36, 1" --include="*.tsx" .`), the full list of 35 occurrences across 26 files:

- `components/career/CareerTeaser.tsx:7` — `const EASE = [0.22, 1, 0.36, 1] as const`
- `components/landing/GPADemo.tsx:40` — `ease: [0.22, 1, 0.36, 1],`
- `components/landing/Hero.tsx:176` — `transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}`
- `components/landing/Features.tsx:71` — `show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },`
- `components/casecomp/CaseCompDatabase.tsx:13` — `const EASE = [0.22, 1, 0.36, 1] as const`
- `components/casecomp/CaseCompExperience.tsx:19` — `const EASE = [0.22, 1, 0.36, 1] as const`
- `components/landing/Feedback.tsx:23` — `transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}`
- `components/casecomp/CorporateCases.tsx:10` — `const EASE = [0.22, 1, 0.36, 1] as const`
- `components/shared/StatCard.tsx:29` — `ease: [0.22, 1, 0.36, 1],`
- `components/shared/StatCard.tsx:80` — `transition={{ duration: 0.8, delay: delay + 0.1, ease: [0.22, 1, 0.36, 1] }}`
- `components/calculators/GPACalculator.tsx:92` — `ease: [0.22, 1, 0.36, 1],`
- `components/shared/Navbar.tsx:112` — `transition: { duration: 0.22, delay: i * 0.045, ease: [0.22, 1, 0.36, 1] as number[] },`
- `components/shared/Navbar.tsx:162` — `transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}`
- `components/shared/Navbar.tsx:175` — `transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}`
- `components/shared/Navbar.tsx:474` — `transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}`
- `components/shared/Navbar.tsx:604` — `transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}`
- `components/workspace/UploadModalShell.tsx:39` — `transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}`
- `components/onboarding/ProgressBar.tsx:21` — `transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}`
- `components/academic/AcademicCalendar.tsx:13` — `const EASE = [0.22, 1, 0.36, 1] as const`
- `components/shared/MoreAcademicTools.tsx:78` — `transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },`
- `components/shared/MoreAcademicTools.tsx:98` — `transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}`
- `components/onboarding/steps/GradeCardStep.tsx:146` — `transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}`
- `components/community/CommunityTeaser.tsx:7` — `const EASE = [0.22, 1, 0.36, 1] as const`
- `components/dashboard/AcademicWorkspace.tsx:92` — `transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}`
- `components/onboarding/steps/BasicInfoStep.tsx:34` — `transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}`
- `components/calculators/CurriculumScanner.tsx:287` — `transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}`
- `components/onboarding/steps/WelcomeStep.tsx:12` — `transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}`
- `components/hackathons/HackathonsCalendar.tsx:10` — `const EASE = [0.22, 1, 0.36, 1] as const`
- `components/onboarding/steps/CurriculumStep.tsx:31` — `transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}`
- `components/calculators/PassCalculator.tsx:433` — `transition={{ delay: 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}`
- `components/calculators/PassCalculator.tsx:465` — `transition={{ delay: 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}`
- `components/calculators/PassCalculator.tsx:477` — `transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}`
- `components/calculators/PassCalculator.tsx:615` — `transition={{ delay: i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}`
- `components/onboarding/steps/FinalStep.tsx:31` — `transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}`
- `components/onboarding/steps/TimetableStep.tsx:62` — `transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}`
- `components/onboarding/steps/ResumeStep.tsx:39` — `transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}`

## Target

One export in `lib/utils.ts`:
```ts
// Shared strong ease-out curve for entering/exiting UI motion (Framer Motion
// transition.ease). Import this instead of hand-typing the array — see
// .claude/skills/improve-animations/AUDIT.md §2 for why a custom curve is
// used instead of a built-in CSS easing.
export const EASE_OUT = [0.22, 1, 0.36, 1] as const
```

Every call site above changes from a literal array to importing and using `EASE_OUT`. Example, `components/landing/Hero.tsx:176`:
```tsx
// before
transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
// after
transition={{ duration: 0.8, delay: 0.6, ease: EASE_OUT }}
```

The 7 files with a local `const EASE = [0.22, 1, 0.36, 1] as const` declaration should delete that local declaration and import `EASE_OUT` from `lib/utils.ts` instead, then use `EASE_OUT` wherever the file previously used its local `EASE`.

## Repo conventions to follow

- `lib/utils.ts` is the established shared-constants file — it already exports `cn`, `generateId`, `formatGPA`, `getGPAColor`, `getAttendanceColor`, `getAttendanceBg`, `getAttendanceGradient`, `clampNumber`, and every component in the app already imports from `@/lib/utils`. Add `EASE_OUT` as a new named export there, following the existing plain-function-export style (no default export, no class).
- `components/shared/Navbar.tsx:112` has a type annotation quirk: `ease: [0.22, 1, 0.36, 1] as number[]`. When replacing with `EASE_OUT` (typed as a readonly tuple via `as const`), check whether the `as number[]` cast is still needed — Framer Motion's `Transition['ease']` type accepts `number[]` or specific easing-function types; if TypeScript complains after the swap, keep a cast (e.g. `EASE_OUT as unknown as number[]`) rather than removing the readonly `as const` from the shared constant (other call sites may rely on the literal tuple type for correctness).

## Steps

1. In `lib/utils.ts`, add the `EASE_OUT` export shown in Target, near the other exported constants/functions (no strict ordering requirement — append near the bottom is fine).
2. For each of the 7 files with a local `const EASE = [0.22, 1, 0.36, 1] as const` declaration (`CareerTeaser.tsx`, `CaseCompDatabase.tsx`, `CaseCompExperience.tsx`, `CorporateCases.tsx`, `AcademicCalendar.tsx`, `CommunityTeaser.tsx`, `HackathonsCalendar.tsx`): delete the local `const EASE = ...` line, add `import { EASE_OUT } from '@/lib/utils'` (or add `EASE_OUT` to an existing `@/lib/utils` import if one already exists in that file), and find-and-replace every usage of the local `EASE` identifier in that file with `EASE_OUT`.
3. For each of the remaining files that inline the raw array directly in a `transition={{ ... ease: [0.22, 1, 0.36, 1] ... }}` (all sites in the list above not already covered by step 2): add `import { EASE_OUT } from '@/lib/utils'` (or extend an existing import), and replace `[0.22, 1, 0.36, 1]` with `EASE_OUT` at that exact call site only.
4. After all edits, grep the whole `components/` and `app/` tree for the literal string `0.22, 1, 0.36, 1` — it should return zero remaining matches (aside from inside `lib/utils.ts`'s own new `EASE_OUT` definition).
5. Run `npx tsc --noEmit -p .` and fix any type errors from the `as number[]`/tuple-typing quirk described in "Repo conventions to follow" above, on a file-by-file basis.

## Boundaries

- Do NOT change any `duration`, `delay`, or other transition property — only the `ease` value/import.
- Do NOT introduce a second easing token (e.g. don't also add `--ease-in-out`/`--ease-drawer` CSS variables from AUDIT.md §2 — those aren't used anywhere in this codebase yet; this plan is scoped strictly to consolidating the one curve that's already in use).
- Do NOT touch any file not in the 26-file list above, even if it happens to use a *different* but similar-looking easing array — that would be new, unconfirmed scope.
- If `lib/utils.ts` has changed shape significantly since this plan was written (e.g. converted to multiple files), STOP and report rather than guessing where to add the export.

## Verification

- **Mechanical**: `grep -rn "0.22, 1, 0.36, 1" --include="*.tsx" components app | grep -v "lib/utils.ts"` returns zero results. `npx tsc --noEmit -p .` — zero errors. `npm run test -- --run` — all existing tests pass.
- **Feel check**: This is a pure refactor with no intended visual change — spot-check 3-4 of the affected animations (e.g. the Navbar dropdown open, the onboarding WelcomeStep entrance, the Hero mockup card entrance) before and after and confirm they look and feel identical — same curve, same timing, just sourced from the shared constant instead of a literal.
- **Done when**: zero duplicated literal easing arrays remain outside `lib/utils.ts`, all 26 files import and use `EASE_OUT`, and there is no visible change in any animation's feel.
