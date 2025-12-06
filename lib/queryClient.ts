import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { isSessionError } from '@/utils/errorHandling'
import { createClient } from '@/utils/supabase/client'

// Flag to prevent multiple redirects
let isRedirecting = false

// Check if error is a network error (DNS, connection, etc.)
function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('fetch failed') ||
      message.includes('network') ||
      message.includes('enotfound') ||
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('etimedout')
    )
  }
  return false
}

async function handleGlobalError(error: unknown) {
  // Ignore network errors - don't redirect, just fail silently
  if (isNetworkError(error)) {
    console.warn('Network error detected, skipping redirect:', error)
    return
  }

  // Only handle session errors and prevent multiple redirects
  if (isSessionError(error) && !isRedirecting && typeof window !== 'undefined') {
    isRedirecting = true

    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // Ignore sign out errors
    }

    // Redirect to login
    window.location.href = '/login'
  }
}

export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: handleGlobalError,
    }),
    mutationCache: new MutationCache({
      onError: handleGlobalError,
    }),
    defaultOptions: {
      queries: {
        // Data stays fresh for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Keep unused data in cache for 30 minutes
        gcTime: 30 * 60 * 1000,
        // Don't refetch on every window focus (reduces network spam)
        refetchOnWindowFocus: false,
        // Refetch when network reconnects
        refetchOnReconnect: true,
        // Use cached data when offline
        networkMode: 'offlineFirst',
        // Don't retry on session errors, limit retries on network errors
        retry: (failureCount, error) => {
          // Don't retry session errors
          if (isSessionError(error)) return false
          // Limit retries on network errors
          if (isNetworkError(error)) return failureCount < 2
          // Retry other errors twice
          return failureCount < 2
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
      mutations: {
        // Don't retry mutations to avoid duplicates
        retry: 0,
      },
    },
  })
}

// Browser: singleton pattern
let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}


