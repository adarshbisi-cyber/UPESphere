'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GraduationCap, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { EmailOtpType } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

// Confirms email links via verifyOtp with a token_hash, entirely client-side.
// Why not the default `?code=` PKCE exchange in /auth/callback: that link is
// verified at Supabase's server /auth/v1/verify endpoint, so an email scanner
// that merely fetches the URL consumes the one-time token before the user
// clicks (and PKCE also needs the exact code-verifier cookie from signup).
// verifyOtp with token_hash needs neither, and because the actual verification
// is a JS call, non-JS scanners fetching this page don't burn the token.
function ConfirmInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const supabase = createClient()
  const ran = useRef(false)

  useEffect(() => {
    // The token is single-use; React StrictMode double-invokes effects in dev,
    // so guard against a second verifyOtp that would fail on the used token.
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
      // Verified — a session now exists. Show a brief success state before
      // navigating (recovery links go set a new password; everything else
      // proceeds to the app, where middleware routes to onboarding if setup
      // isn't finished).
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-indigo-500/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/3 w-60 h-60 bg-violet-500/8 rounded-full blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm"
      >
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold font-display bg-gradient-to-r dark:from-white dark:to-white/70 from-slate-900 to-slate-700 bg-clip-text text-transparent">
            UPESphere
          </span>
        </div>

        <div className="rounded-2xl backdrop-blur-md p-8 text-center" style={{ background: `linear-gradient(135deg, var(--glass-from), var(--glass-to))`, border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
          {status === 'verifying' ? (
            <>
              <div className="w-14 h-14 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
              </div>
              <h1 className="text-xl font-bold font-display mb-1">Verifying your email…</h1>
              <p className="text-sm text-muted-foreground">This only takes a moment.</p>
            </>
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
            <>
              <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <h1 className="text-xl font-bold font-display mb-1">Link expired</h1>
              <p className="text-sm text-muted-foreground mb-6">
                This verification link is invalid or has already been used. Sign in to request a fresh one.
              </p>
              <Link href="/login">
                <Button variant="gradient" className="w-full">Back to sign in</Button>
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmInner />
    </Suspense>
  )
}
