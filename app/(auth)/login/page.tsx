'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, Check, X, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { isValidName, isValidEmail, isValidPassword, checkPassword } from '@/lib/auth/validation'
import { friendlyAuthError } from '@/lib/auth/errors'
import { safeRedirectPath } from '@/lib/auth/redirect'

type Mode = 'signin' | 'signup' | 'forgot'

export default function LoginPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'link_invalid'
      ? 'That link is invalid or has expired. Sign in, or resend the verification email.'
      : null
  )
  const [resetSent, setResetSent] = useState(false)
  const [noAccount, setNoAccount] = useState(false)
  // "Create Account" in the nav's profile menu links here with ?mode=signup
  // so it actually opens the signup view instead of landing on sign-in twice.
  const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'signup' ? 'signup' : 'signin')
  const router = useRouter()
  const redirect = safeRedirectPath(searchParams.get('redirect'))

  const supabase = createClient()

  // Respect the OS-level "reduce motion" preference — fall back to the
  // static gradient blobs instead of autoplaying the background video.
  const [reduceMotion, setReduceMotion] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(query.matches)
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const pwChecks = useMemo(() => checkPassword(password), [password])

  const canSubmit =
    mode === 'signin'
      ? email.trim().length > 0 && password.length > 0
      : mode === 'signup'
      ? isValidName(name) && isValidEmail(email) && isValidPassword(password)
      : isValidEmail(email)

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
    setResetSent(false)
    setNoAccount(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNoAccount(false)
    setIsLoading(true)

    try {
      if (mode === 'signin') {
        // Look up whether an account exists first, so we can tell "no account"
        // apart from "wrong password" (Supabase returns the same generic error
        // for both). Best-effort: if the helper function isn't installed yet,
        // rpcError is set and we fall back to a plain password attempt.
        const { data: exists, error: rpcError } = await supabase.rpc('email_exists', {
          check_email: email.trim(),
        })
        if (!rpcError && exists === false) {
          setNoAccount(true)
          setError('No account found with this email. Please create an account or continue with Google.')
          return
        }

        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) {
          const msg = error.message.toLowerCase()
          // Unverified accounts can't sign in — route them to resend instead.
          if (msg.includes('email not confirmed')) {
            router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`)
            return
          }
          // If we know the account exists, a credentials failure is the password.
          if (!rpcError && exists === true && msg.includes('invalid login credentials')) {
            setError('Incorrect password. Please try again.')
            return
          }
          setError(friendlyAuthError(error.message))
          return
        }
        // Onboarding-aware redirect: unfinished setup goes to onboarding.
        const { data: { user } } = await supabase.auth.getUser()
        let dest = redirect
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single()
          if (profile && profile.onboarding_completed === false) dest = '/workspace/setup'
        }
        router.push(dest)
        router.refresh()
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        })
        if (error) {
          setError(friendlyAuthError(error.message))
          return
        }
        // Supabase returns a user with an empty identities array when the email
        // is already registered (enumeration protection) — surface that clearly.
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setError('An account with this email already exists. Try signing in.')
          return
        }
        router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`)
      } else {
        // The reset email uses the token_hash template pointing at
        // /auth/confirm?type=recovery (verified client-side there), so no
        // redirectTo / PKCE /auth/callback round-trip is needed here.
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
        if (error) {
          setError(friendlyAuthError(error.message))
          return
        }
        setResetSent(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogle = async () => {
    setIsGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    })
    if (error) {
      setError(friendlyAuthError(error.message))
      setIsGoogleLoading(false)
    }
  }

  const heading =
    mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'
  const subheading =
    mode === 'signin'
      ? 'Sign in to access your dashboard'
      : mode === 'signup'
      ? 'Start tracking your academics for free'
      : "Enter your email and we'll send a reset link"

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {reduceMotion ? (
        // prefers-reduced-motion: reduce — the original static gradient
        // blobs instead of an autoplaying video.
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-indigo-500/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/3 w-60 h-60 bg-violet-500/8 rounded-full blur-[80px]" />
        </div>
      ) : (
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/videos/purple-desert.mp4" type="video/mp4" />
          </video>
          {/* Scrim so the form card and text keep enough contrast against
              the video regardless of which frame is showing. */}
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold font-display text-white">
            UPESphere
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl backdrop-blur-md p-8 shadow-2xl" style={{ background: `linear-gradient(135deg, var(--glass-from), var(--glass-to))`, border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
          <h1 className="text-2xl font-bold font-display text-center mb-1">{heading}</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">{subheading}</p>

          {mode !== 'forgot' && (
            <>
              {/* Google */}
              <Button
                variant="outline"
                className="w-full gap-2 mb-4 h-11"
                onClick={handleGoogle}
                disabled={isGoogleLoading || isLoading}
              >
                {isGoogleLoading ? (
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </Button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: 'var(--divider)' }} />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px" style={{ background: 'var(--divider)' }} />
              </div>
            </>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 mb-4"
              >
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* No-account CTA — jump straight to signup (email is preserved). */}
          {noAccount && mode === 'signin' && (
            <Button variant="outline" className="w-full mb-4" onClick={() => switchMode('signup')}>
              Create Account
            </Button>
          )}

          {/* Forgot-password success */}
          {mode === 'forgot' && resetSent ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm text-foreground font-medium mb-1">Reset link sent</p>
              <p className="text-sm text-muted-foreground mb-6">
                Check <span className="text-foreground">{email}</span> for a link to reset your password.
              </p>
              <button onClick={() => switchMode('signin')} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <Label className="text-sm mb-1.5 block">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input
                        type="text"
                        placeholder="Jane Doe"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="pl-9"
                        autoComplete="name"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm mb-1.5 block">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input
                      type="email"
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); if (noAccount) { setNoAccount(false); setError(null) } }}
                      className="pl-9"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-sm">Password</Label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="pl-9 pr-9"
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {mode === 'signup' && password.length > 0 && (
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
                        {([
                          ['length', 'At least 8 characters'],
                          ['uppercase', 'One uppercase letter'],
                          ['lowercase', 'One lowercase letter'],
                          ['number', 'One number'],
                          ['special', 'One special character'],
                        ] as const).map(([key, label]) => {
                          const ok = pwChecks[key]
                          return (
                            <div key={key} className="flex items-center gap-1.5">
                              {ok ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <X className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
                              <span className={`text-[11px] ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/60'}`}>{label}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full gap-2"
                  disabled={isLoading || isGoogleLoading || !canSubmit}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send reset link'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-sm text-center text-muted-foreground mt-4">
                {mode === 'signin' && (
                  <>
                    Don&apos;t have an account?{' '}
                    <button onClick={() => switchMode('signup')} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                      Sign up free
                    </button>
                  </>
                )}
                {mode === 'signup' && (
                  <>
                    Already have an account?{' '}
                    <button onClick={() => switchMode('signin')} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                      Sign in
                    </button>
                  </>
                )}
                {mode === 'forgot' && (
                  <button onClick={() => switchMode('signin')} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                    Back to sign in
                  </button>
                )}
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-white/60 mt-6">
          <Link href="/" className="hover:text-white transition-colors">
            ← Back to UPESphere
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
