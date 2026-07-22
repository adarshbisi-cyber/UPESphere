import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient(
    { req, res },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
  )

  // Use getUser(), not getSession(): getSession()'s user is rebuilt from the
  // access-token JWT, which does NOT carry email_confirmed_at — so reading
  // that field off it is always undefined and the verification gate below
  // would bounce every user (even confirmed ones) into a redirect loop.
  // getUser() returns the authoritative user record with email_confirmed_at set.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = req.nextUrl.pathname
  // Career and Community are authenticated-only features (same as the
  // dashboard/workspace/gradebook). They stay visible in the nav for logged-out
  // users so the features are discoverable, but the routes themselves — whether
  // reached by clicking the nav link or by typing the URL directly — bounce to
  // sign-in here, before the server component renders (so no protected content
  // flashes). Keep this list in sync with `config.matcher` below.
  // TeamUp itself is publicly browsable (feed, student discovery, team detail
  // pages) — only the personal "My TeamUp" dashboard requires auth, so it's
  // scoped to /teamup/mine rather than the whole /teamup tree.
  const isProtected =
    path.startsWith('/dashboard') ||
    path.startsWith('/workspace') ||
    path.startsWith('/gradebook') ||
    path.startsWith('/career') ||
    path.startsWith('/community') ||
    path.startsWith('/teamup/mine') ||
    path.startsWith('/notifications')
  const emailVerified = !!(user && (user.email_confirmed_at || user.confirmed_at))

  // Not signed in → bounce protected routes to login (preserving intended dest).
  if (isProtected && !user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // Signed in but email not verified → block protected routes until they
  // confirm. OAuth (Google) accounts always have email_confirmed_at set, so
  // they pass straight through; only unverified email/password signups are
  // held back, per the "no dashboard until verified" requirement.
  if (isProtected && user && !emailVerified) {
    const verifyUrl = new URL('/verify-email', req.url)
    if (user.email) verifyUrl.searchParams.set('email', user.email)
    return NextResponse.redirect(verifyUrl)
  }

  // Already signed in (and verified) → skip the login page.
  if (path === '/login' && emailVerified) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // First-time users land on their Academic Workspace setup instead of the
  // dashboard. Only checked for /dashboard itself — not every protected
  // route — so a returning user who skipped steps can still browse normally
  // and finish setup later from there, per the "complete it later" design.
  if (path.startsWith('/dashboard') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile && profile.onboarding_completed === false) {
      return NextResponse.redirect(new URL('/workspace/setup', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/workspace/:path*',
    '/gradebook/:path*',
    '/career/:path*',
    '/community/:path*',
    '/teamup/mine/:path*',
    '/notifications/:path*',
    '/login',
  ],
}
