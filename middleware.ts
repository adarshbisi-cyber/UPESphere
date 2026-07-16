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

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (req.nextUrl.pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // First-time users land on their Academic Workspace setup instead of the
  // dashboard. Only checked for /dashboard itself — not every protected
  // route — so a returning user who skipped steps can still browse normally
  // and finish setup later from there, per the "complete it later" design.
  if (req.nextUrl.pathname.startsWith('/dashboard') && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .single()

    if (profile && profile.onboarding_completed === false) {
      return NextResponse.redirect(new URL('/workspace/setup', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
