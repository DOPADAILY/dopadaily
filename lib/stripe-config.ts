// Shared Stripe configuration - can be imported in both client and server

// Subscription plan configuration
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: {
      maxNotes: 5,
      maxReminders: 3,
      maxSounds: 3, // Only free sounds
      customTimerDurations: false,
      forumAccess: 'read', // 'read' | 'full'
      maxAchievements: 3,
      advancedStats: false,
    },
  },
  premium: {
    name: 'Premium',
    price: 97,
    priceId: null, // Set via environment variable on server
    features: {
      maxNotes: -1, // Unlimited
      maxReminders: -1, // Unlimited
      maxSounds: -1, // All sounds
      customTimerDurations: true,
      forumAccess: 'full',
      maxAchievements: -1, // All achievements
      advancedStats: true,
    },
  },
} as const

export type PlanType = keyof typeof PLANS
export type SubscriptionStatus = 'free' | 'active' | 'canceled' | 'past_due' | 'trialing'

// Helper to check if user has premium features
export function isPremium(status: SubscriptionStatus | undefined | null): boolean {
  return status === 'active' || status === 'trialing'
}

// Get plan features based on subscription status
export function getPlanFeatures(status: SubscriptionStatus | undefined | null) {
  if (isPremium(status)) {
    return PLANS.premium.features
  }
  return PLANS.free.features
}

// Check if a feature limit is reached
export function isLimitReached(
  status: SubscriptionStatus | undefined | null,
  feature: keyof typeof PLANS.free.features,
  currentCount: number
): boolean {
  const features = getPlanFeatures(status)
  const limit = features[feature]

  if (typeof limit === 'number') {
    return limit !== -1 && currentCount >= limit
  }

  return false
}

