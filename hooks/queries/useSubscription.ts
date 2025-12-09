'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { PLANS, isPremium as checkIsPremium, getPlanFeatures, type SubscriptionStatus } from '@/lib/stripe-config'

export interface SubscriptionData {
  subscription_status: SubscriptionStatus
  subscription_plan: 'free' | 'premium'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_current_period_end: string | null
  subscription_cancel_at_period_end: boolean
  role: string | null // Include role to check for admin
}

// Query keys
export const subscriptionKeys = {
  all: ['subscription'] as const,
  status: () => [...subscriptionKeys.all, 'status'] as const,
}

// Fetch subscription data (includes role for admin bypass)
async function fetchSubscription(): Promise<SubscriptionData | null> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Handle auth errors gracefully (network issues, etc.)
    if (authError) {
      console.warn('Auth error fetching user:', authError.message)
      return null
    }

    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        subscription_status,
        subscription_plan,
        stripe_customer_id,
        stripe_subscription_id,
        subscription_current_period_end,
        subscription_cancel_at_period_end,
        role
      `)
      .eq('id', user.id)
      .single()

    if (error) {
      console.warn('Error fetching subscription:', error.message)
      return null
    }

    return data as SubscriptionData
  } catch (err) {
    // Catch network errors (ENOTFOUND, etc.) and fail gracefully
    console.warn('Network error fetching subscription:', err)
    return null
  }
}

// Check if user has premium access (includes admin bypass)
function hasFullAccess(data: SubscriptionData | null | undefined): boolean {
  if (!data) return false
  // Admins and super_admins always have full access
  if (data.role === 'admin' || data.role === 'super_admin') return true
  // Otherwise check subscription status
  return checkIsPremium(data.subscription_status)
}

// Hook to get subscription data
export function useSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.status(),
    queryFn: fetchSubscription,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    retry: 2, // Only retry twice on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff, max 10s
    networkMode: 'offlineFirst', // Use cached data when offline
    refetchOnWindowFocus: false, // Don't refetch on every tab switch
    refetchOnReconnect: true, // Refetch when connection restored
  })
}

// Hook to check if user has premium (or is admin)
export function useIsPremium() {
  const { data, isLoading } = useSubscription()
  const isPremium = hasFullAccess(data)
  const isAdmin = data?.role === 'admin' || data?.role === 'super_admin'

  return {
    isPremium,
    isAdmin,
    isLoading,
    status: data?.subscription_status,
  }
}

// Hook to get plan features (admins get premium features)
export function usePlanFeatures() {
  const { data, isLoading } = useSubscription()
  const isPremium = hasFullAccess(data)

  return {
    // Admins get premium features regardless of subscription
    features: isPremium ? PLANS.premium.features : getPlanFeatures(data?.subscription_status),
    isLoading,
    isPremium,
    isAdmin: data?.role === 'admin' || data?.role === 'super_admin',
  }
}

// Hook to check feature limits (admins bypass limits)
export function useFeatureLimit(
  feature: keyof typeof PLANS.free.features,
  currentCount: number
) {
  const { data, isLoading } = useSubscription()
  const isPremium = hasFullAccess(data)
  const isAdmin = data?.role === 'admin' || data?.role === 'super_admin'

  // Admins and premium users have no limits
  if (isPremium) {
    return {
      isAtLimit: false,
      remaining: -1, // Unlimited
      limit: -1,
      isLoading,
      isPremium: true,
      isAdmin,
    }
  }

  const features = getPlanFeatures(data?.subscription_status)
  const limit = features[feature]

  const isAtLimit = typeof limit === 'number' && limit !== -1 && currentCount >= limit
  const remaining = typeof limit === 'number' && limit !== -1 ? Math.max(0, limit - currentCount) : -1

  return {
    isAtLimit,
    remaining,
    limit,
    isLoading,
    isPremium: false,
    isAdmin: false,
  }
}

// Helper to redirect to checkout
export async function redirectToCheckout() {
  try {
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const { url, error } = await response.json()

    if (error) {
      throw new Error(error)
    }

    if (!url) {
      throw new Error('No checkout URL returned')
    }

    window.location.href = url
  } catch (error) {
    console.error('Checkout error:', error)
    throw error
  }
}

// Helper to redirect to billing portal
export async function redirectToPortal() {
  try {
    const response = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const { url, error } = await response.json()

    if (error) {
      throw new Error(error)
    }

    if (!url) {
      throw new Error('No portal URL returned')
    }

    window.location.href = url
  } catch (error) {
    console.error('Portal error:', error)
    throw error
  }
}

