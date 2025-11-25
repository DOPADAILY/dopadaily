import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { isSessionError } from '@/utils/errorHandling'
import { createClient } from '@/utils/supabase/client'

// Flag to prevent multiple redirects
let isRedirecting = false

async function handleGlobalError(error: unknown) {
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
        // Keep unused data in cache for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Refetch when window regains focus
        refetchOnWindowFocus: true,
        // Refetch when network reconnects
        refetchOnReconnect: true,
        // Don't retry on session errors
        retry: (failureCount, error) => {
          // Don't retry session errors
          if (isSessionError(error)) return false
          // Retry other errors once
          return failureCount < 1
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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


