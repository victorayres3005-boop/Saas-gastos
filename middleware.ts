import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // /auth/callback nunca deve ser interceptado — ele processa o código do OAuth
  if (req.nextUrl.pathname.startsWith('/auth/callback')) {
    return res
  }

  const isAuthRoute =
    req.nextUrl.pathname.startsWith('/login') ||
    req.nextUrl.pathname.startsWith('/signup') ||
    req.nextUrl.pathname.startsWith('/forgot-password')

  if (!session && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
