# 013 — Add a success checkmark reveal before redirecting on email verification

- **Status**: TODO
- **Commit**: 157ae7b
- **Severity**: Missed opportunity (additive)
- **Category**: Missed opportunities
- **Estimated scope**: 1 file, small

## Problem

`app/auth/confirm/page.tsx` handles the once-per-user, genuinely rare moment of confirming a new account's email (or a password-recovery link). Its `status` state is typed `'verifying' | 'error'` (line 22) — there is no success state at all. On a successful `verifyOtp` call, the code goes straight from the "Verifying your email…" spinner to `router.replace(...)` with zero visual acknowledgment:

Current, `app/auth/confirm/page.tsx:19-55` (relevant excerpt):
```tsx
function ConfirmInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying')
  const supabase = createClient()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const tokenHash = params.get('token_hash')
    const type = (params.get('type') as EmailOtpType) || 'signup'
    if (!tokenHash) {
      setStatus('error')
      return
    }

    supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error }) => {
      if (error) {
        setStatus('error')
        return
      }
      if (type === 'recovery') {
        router.replace('/reset-password')
      } else {
        router.replace('/dashboard')
        router.refresh()
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* ...background blobs... */}
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4 }} className="relative w-full max-w-sm">
        {/* ...logo... */}
        <div className="rounded-2xl backdrop-blur-md p-8 text-center" style={{ /* glass styling */ }}>
          {status === 'verifying' ? (
            <>
              <div className="w-14 h-14 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
              </div>
              <h1 className="text-xl font-bold font-display mb-1">Verifying your email…</h1>
              <p className="text-sm text-muted-foreground">This only takes a moment.</p>
            </>
          ) : (
            <>{/* error state */}</>
          )}
        </div>
      </motion.div>
    </div>
  )
}
```
AUDIT.md §8: *"Rare, high-emotion moments (first-run, success, celebration) rendered with none of the delight budget they're allowed."* This is exactly that gap — the user never actually sees "you're verified," they just get redirected.

## Target

Add a `'success'` status, render it with a spring-scaled checkmark reveal (matching the app's existing celebratory-icon pattern in `components/onboarding/steps/FinalStep.tsx:34-42`), held for ~600ms before navigating away:

```tsx
import { GraduationCap, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

function ConfirmInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const supabase = createClient()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const tokenHash = params.get('token_hash')
    const type = (params.get('type') as EmailOtpType) || 'signup'
    if (!tokenHash) {
      setStatus('error')
      return
    }

    supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error }) => {
      if (error) {
        setStatus('error')
        return
      }
      setStatus('success')
      setTimeout(() => {
        if (type === 'recovery') {
          router.replace('/reset-password')
        } else {
          router.replace('/dashboard')
          router.refresh()
        }
      }, 600)
    })
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* ...background blobs, logo unchanged... */}
      <div className="rounded-2xl backdrop-blur-md p-8 text-center" style={{ /* unchanged */ }}>
        {status === 'verifying' ? (
          <>{/* unchanged spinner state */}</>
        ) : status === 'success' ? (
          <>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </motion.div>
            <h1 className="text-xl font-bold font-display mb-1">Verified!</h1>
            <p className="text-sm text-muted-foreground">Taking you to your dashboard…</p>
          </>
        ) : (
          <>{/* unchanged error state */}</>
        )}
      </div>
    </div>
  )
}
```

## Repo conventions to follow

- `components/onboarding/steps/FinalStep.tsx:34-42` is the exemplar for a celebratory icon reveal in this codebase: `initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}`. This plan reuses the same spring constants (`stiffness: 260, damping: 20`) for consistency, but starts from `scale: 0.9` rather than `0.7` per plan 011's fix to that same pattern (don't reintroduce a sub-0.9 scale here even though `FinalStep.tsx`'s current code — pre-plan-011 — uses 0.7; use `0.9` in this new code regardless of whether plan 011 has run yet).
- `CheckCircle2` from `lucide-react` is already used elsewhere in the app (e.g. `app/(auth)/verify-email/page.tsx`) for a success indicator — reuse the same icon for visual consistency across the auth flow.

## Steps

1. In `app/auth/confirm/page.tsx`, add `CheckCircle2` to the existing `import { GraduationCap, Loader2, AlertCircle } from 'lucide-react'` line.
2. Change the `status` state type from `useState<'verifying' | 'error'>('verifying')` to `useState<'verifying' | 'success' | 'error'>('verifying')`.
3. In the `verifyOtp(...).then(({ error }) => { ... })` callback: after the existing `if (error) { setStatus('error'); return }` check, replace the immediate `if (type === 'recovery') { router.replace(...) } else { router.replace(...); router.refresh() }` block with: `setStatus('success')` followed by `setTimeout(() => { /* the same existing if/else redirect logic, unchanged */ }, 600)`.
4. In the JSX, change the `status === 'verifying' ? (...) : (...)` ternary into a three-way branch: `status === 'verifying' ? (<>...unchanged...</>) : status === 'success' ? (<>...new success block from Target...</>) : (<>...unchanged error block...</>)`.
5. Confirm `motion` is already imported (it is, per the existing spinner-container `motion.div`) — no new import needed for the success icon's `motion.div`.

## Boundaries

- Do NOT change the `error` state's content or the outer `motion.div`'s entrance (the card-level `initial={{opacity:0,y:20,scale:0.98}}`) — only add the new `success` branch inside.
- Do NOT change the redirect destinations or the `type === 'recovery'` branching logic — only delay it by 600ms behind the new success state.
- Do NOT add new dependencies (`CheckCircle2` is already available from the installed `lucide-react` package).
- If the component's structure has changed materially since this plan was written, STOP and report rather than improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit -p .` and `npm run test -- --run` — both clean.
- **Feel check**: Trigger a real (or test) email verification link and confirm:
  - After the spinner, a green checkmark spring-pops in with "Verified!" text, visible for roughly half a second.
  - The page then navigates to `/dashboard` (or `/reset-password` for a recovery link) automatically, with no user action required.
  - The checkmark's spring pop should feel snappy and satisfying, not sluggish — compare against `FinalStep.tsx`'s existing icon reveal for a feel reference (should be very similar).
- **Done when**: a successful verification shows a distinct, brief success state before navigating away, and the error path is completely unaffected.
