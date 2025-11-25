/**
 * Utility functions for handling errors gracefully across the app
 */

/**
 * Check if an error is a network connectivity issue
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false

  const errorMessage = error.message || error.details || ''

  return (
    errorMessage.includes('fetch failed') ||
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('network') ||
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('Failed to fetch')
  )
}

/**
 * Check if an error is a session/auth error that requires re-login
 * This includes 406 errors which indicate invalid/corrupted auth tokens
 */
export function isSessionError(error: any): boolean {
  if (!error) return false

  // Check for HTTP status codes that indicate auth issues
  const status = error.status || error.code
  if (status === 406 || status === 401 || status === 403) {
    return true
  }

  const errorMessage = error.message || error.details || ''

  return (
    errorMessage.includes('406') ||
    errorMessage.includes('Not Acceptable') ||
    errorMessage.includes('JWT expired') ||
    errorMessage.includes('invalid JWT') ||
    errorMessage.includes('session expired') ||
    errorMessage.includes('refresh_token_not_found')
  )
}

/**
 * Check if an error is an authentication error (not network-related)
 */
export function isAuthError(error: any): boolean {
  if (!error) return false

  // Session errors are a type of auth error
  if (isSessionError(error)) return true

  const errorMessage = error.message || ''

  return (
    errorMessage.includes('invalid') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('expired') ||
    errorMessage.includes('JWT')
  ) && !isNetworkError(error)
}

/**
 * Get a user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: any): string {
  if (isNetworkError(error)) {
    return 'Connection issue. Please check your internet and try again.'
  }

  if (isAuthError(error)) {
    return 'Session expired. Please log in again.'
  }

  return error.message || 'An unexpected error occurred. Please try again.'
}

/**
 * Log error with context (development only)
 */
export function logError(context: string, error: any) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, error)
  }
}

/**
 * Handle session errors by clearing auth and redirecting to login
 * This should be called from client-side code when a 406 or similar auth error occurs
 */
export async function handleSessionError(supabaseClient: any): Promise<void> {
  try {
    // Sign out to clear any corrupted session data
    await supabaseClient.auth.signOut()
  } catch {
    // Ignore sign out errors, we're clearing everything anyway
  }

  // Force redirect to login
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on non-network errors
      if (!isNetworkError(error)) {
        throw error
      }

      // Don't wait after the last attempt
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

