'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GraduationCap, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Check, X, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { isValidPassword, checkPassword } from '@/lib/auth/validation'
import { friendlyAuthError } from '@/lib/auth/errors'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  // undefined = still checking, true/false = whether a recovery session exists.
  const [sessionReady, setSessionReady] = useState<boolean | undefined>(undefined)
  const router = useRouter()
  const supabase = createClient()

  const pwChecks = useMemo(() => checkPassword(password), [password])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionReady(!!session)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidPassword(password)) return
    setError(null)
    setIsLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(friendlyAuthError(error.message))
      setIsLoading(false)
      return
    }
    setDone(true)
    setIsLoading(false)
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 1400)
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

        <div className="rounded-2xl backdrop-blur-md p-8" style={{ background: `linear-gradient(135deg, var(--glass-from), var(--glass-to))`, border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
          {done ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h1 className="text-xl font-bold font-display mb-1">Password updated</h1>
              <p className="text-sm text-muted-foreground">Signing you in…</p>
            </div>
          ) : sessionReady === false ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <h1 className="text-xl font-bold font-display mb-1">Link expired</h1>
              <p className="text-sm text-muted-foreground mb-6">
                This password reset link is invalid or has expired. Request a new one from the sign-in page.
              </p>
              <Link href="/login">
                <Button variant="gradient" className="w-full">Back to sign in</Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold font-display text-center mb-1">Set a new password</h1>
              <p className="text-sm text-muted-foreground text-center mb-6">Choose a strong password for your account.</p>

              {error && (
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-sm mb-1.5 block">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-9 pr-9"
                      autoComplete="new-password"
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

                  {password.length > 0 && (
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
                            {ok ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <X className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
                            <span className={`text-[11px] ${ok ? 'text-emerald-400' : 'text-muted-foreground/60'}`}>{label}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full gap-2"
                  disabled={isLoading || !isValidPassword(password) || sessionReady === undefined}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Update password <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
