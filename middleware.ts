import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isNetworkError } from '@/utils/errorHandling'

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
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // If there's a network error, allow the request to continue
    // The session cookie is still valid, just can't reach Supabase
    if (authError && isNetworkError(authError)) {
      console.warn('[Middleware] Network error, allowing request to continue')
      // Set a temporary flag to tell pages not to redirect during network issues
      response.cookies.set('network-issue', 'true', {
        maxAge: 60, // Expire after 60 seconds
        httpOnly: true,
        sameSite: 'lax'
      })
      return response
    }

    // Clear the network issue flag if everything is working
    if (user && response.cookies.get('network-issue')) {
      response.cookies.delete('network-issue')
    }

    // Check if user is banned
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_banned, banned_until')
        .eq('id', user.id)
        .single()

      // If network error fetching profile, allow request to continue
      if (profileError && isNetworkError(profileError)) {
        console.warn('[Middleware] Network error fetching profile, allowing request to continue')
        return response
      }

      if (profile?.is_banned) {
        // Check if ban has expired (for temporary bans)
        if (profile.banned_until) {
          const banExpiry = new Date(profile.banned_until)
          const now = new Date()

          if (now >= banExpiry) {
            // Ban has expired - automatically unban the user
            try {
              await supabase
                .from('profiles')
                .update({
                  is_banned: false,
                  ban_reason: null,
                  banned_until: null,
                  banned_by: null
                })
                .eq('id', user.id)
            } catch (err) {
              console.warn('[Middleware] Failed to unban user, likely network error')
            }

            // Allow the user to continue
            return response
          }
        }

        // User is still banned - sign them out and redirect to banned page
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/banned', request.url))
      }
    }
  } catch (error) {
    // On any unexpected error, log it but allow the request to continue
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
