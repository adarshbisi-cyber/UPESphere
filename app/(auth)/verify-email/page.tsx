'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GraduationCap, MailCheck, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { friendlyAuthError } from '@/lib/auth/errors'

function VerifyEmailInner() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleResend = async () => {
    if (!email || resending) return
    setResending(true)
    setError(null)
    setResent(false)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (error) setError(friendlyAuthError(error.message))
    else setResent(true)
    setResending(false)
  }

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
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <MailCheck className="w-7 h-7 text-emerald-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-semibold mb-2">
            <CheckCircle2 className="w-4 h-4" /> Verification Email Sent
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            We&apos;ve sent a verification link to your email address.
          </p>
          {email && <p className="text-sm text-foreground font-medium mb-6">{email}</p>}
          {!email && <div className="mb-6" />}

          {error && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 mb-4 text-left">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          {resent && !error && (
            <p className="text-sm text-emerald-400 mb-4">Verification email resent — check your inbox.</p>
          )}

          <Button
            variant="gradient"
            className="w-full mb-3"
            onClick={handleResend}
            disabled={resending || !email}
          >
            {resending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Resend Verification Email'
            )}
          </Button>

          <Link href="/login">
            <Button variant="ghost" className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  )
}
