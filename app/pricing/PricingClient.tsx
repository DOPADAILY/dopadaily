'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import {
  Crown,
  Check,
  X,
  Sparkles,
  Loader2,
  Brain,
  FileText,
  Headphones,
  MessageSquare,
  Bell,
  Award,
  BarChart3,
  Settings,
  Zap,
} from 'lucide-react'
import { MobileMenuButton } from '@/components/MobileSidebar'
import UserMenu from '@/components/UserMenu'
import { redirectToCheckout, redirectToPortal } from '@/hooks/queries/useSubscription'

interface PricingClientProps {
  user: User
  username?: string | null
  currentPlan: 'free' | 'premium'
  subscriptionStatus: string
  periodEnd: string | null
  cancelAtPeriodEnd: boolean
}

const features = [
  {
    name: 'Focus Timer',
    icon: Brain,
    free: '25 min fixed',
    premium: 'Custom durations (5-60 min)',
  },
  {
    name: 'Notes',
    icon: FileText,
    free: '5 notes',
    premium: 'Unlimited notes',
  },
  {
    name: 'Ambient Sounds',
    icon: Headphones,
    free: '3 free sounds',
    premium: 'Full sound library',
  },
  {
    name: 'Community Forum',
    icon: MessageSquare,
    free: 'Read only',
    premium: 'Full access (post, comment, like)',
  },
  {
    name: 'Reminders',
    icon: Bell,
    free: '3 reminders',
    premium: 'Unlimited reminders',
  },
  {
    name: 'Achievements',
    icon: Award,
    free: 'First 3 milestones',
    premium: 'All milestones',
  },
  {
    name: 'Analytics',
    icon: BarChart3,
    free: "Today's stats only",
    premium: 'Advanced analytics & trends',
  },
  {
    name: 'Timer Settings',
    icon: Settings,
    free: 'Fixed settings',
    premium: 'Full customization',
  },
]

export default function PricingClient({
  user,
  username,
  currentPlan,
  subscriptionStatus,
  periodEnd,
  cancelAtPeriodEnd,
}: PricingClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<'checkout' | 'portal' | null>(null)

  // Check for both 'active' and 'trialing' statuses (per stripe-config.ts)
  const isPremium = currentPlan === 'premium' && (subscriptionStatus === 'active' || subscriptionStatus === 'trialing')

  const handleUpgrade = async () => {
    setIsLoading(true)
    setLoadingAction('checkout')
    try {
      await redirectToCheckout()
    } catch (error) {
      console.error('Upgrade error:', error)
      setIsLoading(false)
      setLoadingAction(null)
    }
  }

  const handleManageBilling = async () => {
    setIsLoading(true)
    setLoadingAction('portal')
    try {
      await redirectToPortal()
    } catch (error) {
      console.error('Portal error:', error)
      setIsLoading(false)
      setLoadingAction(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="h-16 lg:border-b border-border lg:bg-surface-elevated/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
          <MobileMenuButton />
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold text-on-surface truncate">
              Pricing
            </h1>
            <p className="text-on-surface-secondary text-xs hidden sm:block">
              Choose the plan that fits your needs
            </p>
          </div>
          <UserMenu email={user.email} username={username || undefined} />
        </div>
      </header>

      <main className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12 max-w-6xl">
        {/* Current Plan Banner */}
        {isPremium && (
          <div className="bg-linear-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-on-surface">Premium Plan Active</h2>
                  <p className="text-sm text-on-surface-secondary">
                    {cancelAtPeriodEnd && periodEnd
                      ? `Your subscription will end on ${formatDate(periodEnd)}`
                      : periodEnd
                        ? `Next billing date: ${formatDate(periodEnd)}`
                        : 'Thank you for being a premium member!'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleManageBilling}
                disabled={isLoading}
                className="btn btn-secondary"
              >
                {loadingAction === 'portal' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Manage Billing'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {/* Free Plan */}
          <div className="card border-2 border-border">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold text-on-surface mb-2">Free</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-on-surface">$0</span>
                <span className="text-on-surface-secondary">/month</span>
              </div>
              <p className="text-sm text-on-surface-secondary mt-2">
                Get started with basic features
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-4">
                {features.map((feature) => (
                  <li key={feature.name} className="flex items-start gap-3">
                    <feature.icon className="w-5 h-5 text-on-surface-secondary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-on-surface text-sm">{feature.name}</p>
                      <p className="text-xs text-on-surface-secondary">{feature.free}</p>
                    </div>
                  </li>
                ))}
              </ul>
              {currentPlan === 'free' && (
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="px-4 py-2 bg-surface rounded-lg text-center">
                    <span className="text-sm font-medium text-on-surface-secondary">
                      Current Plan
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Premium Plan */}
          <div className="card border-2 border-primary relative overflow-hidden">
            {/* Popular Badge */}
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-on-primary text-xs font-bold rounded-full">
                <Sparkles className="w-3 h-3" />
                BEST VALUE
              </span>
            </div>

            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold text-on-surface mb-2 flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Premium
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-on-surface">$97</span>
                <span className="text-on-surface-secondary">/month</span>
              </div>
              <p className="text-sm text-on-surface-secondary mt-2">
                Unlock everything, no limits
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-4">
                {features.map((feature) => (
                  <li key={feature.name} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-on-surface text-sm">{feature.name}</p>
                      <p className="text-xs text-primary">{feature.premium}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-6 border-t border-border">
                {isPremium ? (
                  <button
                    onClick={handleManageBilling}
                    disabled={isLoading}
                    className="btn btn-secondary w-full"
                  >
                    {loadingAction === 'portal' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Manage Subscription'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleUpgrade}
                    disabled={isLoading}
                    className="btn btn-primary w-full"
                  >
                    {loadingAction === 'checkout' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Upgrade to Premium
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="card p-6 lg:p-8">
          <h2 className="text-xl font-bold text-on-surface mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-on-surface mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-sm text-on-surface-secondary">
                Yes! You can cancel your subscription at any time. You&apos;ll continue to have
                access to premium features until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-on-surface mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-sm text-on-surface-secondary">
                We accept all major credit cards (Visa, Mastercard, American Express) through
                our secure payment processor, Stripe.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-on-surface mb-2">
                What happens to my data if I downgrade?
              </h3>
              <p className="text-sm text-on-surface-secondary">
                Your data is always safe. If you downgrade, you&apos;ll retain access to your
                existing notes, reminders, and progress, but won&apos;t be able to create new
                ones beyond the free tier limits.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-on-surface mb-2">
                Is there a free trial?
              </h3>
              <p className="text-sm text-on-surface-secondary">
                The free plan lets you try core features before committing. You can upgrade
                to premium whenever you&apos;re ready for the full experience.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

