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
 * Check if an error is an authentication error (not network-related)
 */
export function isAuthError(error: any): boolean {
  if (!error) return false
  
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

