import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// OAuth (Google) redirect handler. Email confirmation and password recovery
// now go through /auth/confirm (token_hash + verifyOtp), so this route only
// handles the OAuth `?code=` exchange (or an `?error=` when the provider fails).
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error') || searchParams.get('error_description')
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  // Expired or already-used link → send back to login with a hint instead of
  // dropping the user on a page they'll just get bounced off of.
  if (errorParam) {
    return NextResponse.redirect(new URL('/login?error=link_invalid', origin))
  }

  if (code) {
    const supabase = createRouteHandlerClient(
      { cookies },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(new URL('/login?error=link_invalid', origin))
    }
  }

  return NextResponse.redirect(new URL(redirect, origin))
}
