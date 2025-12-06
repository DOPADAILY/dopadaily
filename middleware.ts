import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isNetworkError, isSessionError } from '@/utils/errorHandling'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    // Use getSession instead of getUser - it's faster as it reads from cookie
    // getUser() makes a network request to verify, getSession() just reads the JWT
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    // If there's a network error, allow the request to continue
    if (sessionError && isNetworkError(sessionError)) {
      console.warn('[Middleware] Network error, allowing request to continue')
      response.cookies.set('network-issue', 'true', {
        maxAge: 60,
        httpOnly: true,
        sameSite: 'lax'
      })
      return response
    }

    // If there's a session error (406, expired token, etc.), clear session and redirect to login
    if (sessionError && isSessionError(sessionError)) {
      console.warn('[Middleware] Session error, clearing session and redirecting to login')
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Clear the network issue flag if everything is working
    if (session && response.cookies.get('network-issue')) {
      response.cookies.delete('network-issue')
    }

    // Only check ban status if user is logged in
    // Skip ban check for non-critical pages to speed up navigation
    const pathname = request.nextUrl.pathname
    const criticalPages = ['/admin', '/forum', '/settings']
    const shouldCheckBan = session?.user && criticalPages.some(p => pathname.startsWith(p))

    if (shouldCheckBan && session?.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_banned, banned_until')
        .eq('id', session.user.id)
        .single()

      if (profileError && isNetworkError(profileError)) {
        console.warn('[Middleware] Network error fetching profile, allowing request to continue')
        return response
      }

      // If there's a session error fetching profile, clear session and redirect
      if (profileError && isSessionError(profileError)) {
        console.warn('[Middleware] Session error fetching profile, clearing session and redirecting to login')
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/login', request.url))
      }

      if (profile?.is_banned) {
        // Check if ban has expired
        if (profile.banned_until) {
          const banExpiry = new Date(profile.banned_until)
          if (new Date() >= banExpiry) {
            // Ban expired - unban asynchronously (don't wait)
            void supabase
              .from('profiles')
              .update({
                is_banned: false,
                ban_reason: null,
                banned_until: null,
                banned_by: null
              })
              .eq('id', session.user.id)

            return response
          }
        }

        // User is still banned
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/banned', request.url))
      }
    }
  } catch (error: any) {
    // CRITICAL: If it's a network error (ENOTFOUND, fetch failed, etc.), 
    // allow the request to continue - don't break the app
    const errorMessage = error?.message || error?.cause?.message || ''
    const isNetwork =
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ETIMEDOUT') ||
      error?.cause?.code === 'ENOTFOUND'

    if (isNetwork) {
      console.warn('[Middleware] Network error caught, allowing request to continue:', errorMessage)
      response.cookies.set('network-issue', 'true', {
        maxAge: 60,
        httpOnly: true,
        sameSite: 'lax'
      })
      return response
    }

    console.error('[Middleware] Unexpected error:', error)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - login, signup, banned, forgot-password, reset-password pages (allow access)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|login|signup|banned|forgot-password|reset-password).*)',
  ],
}
