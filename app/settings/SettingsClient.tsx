'use client'

import { useState, useRef } from 'react'
import { User, Settings, Save, Loader2, Crown, CreditCard, ExternalLink } from 'lucide-react'
import Toast from '@/components/Toast'
import { useProfile, useUpdateProfile, useSubscription, useIsPremium, redirectToCheckout, redirectToPortal } from '@/hooks/queries'
import { SettingsSkeleton } from '@/components/SkeletonLoader'
import UpgradePrompt from '@/components/UpgradePrompt'
import Link from 'next/link'

interface SettingsClientProps {
  userEmail: string
}

type Tab = 'profile' | 'preferences' | 'subscription'

export default function SettingsClient({ userEmail }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isPortalLoading, setIsPortalLoading] = useState(false)
  const profileFormRef = useRef<HTMLFormElement>(null)
  const preferencesFormRef = useRef<HTMLFormElement>(null)

  // TanStack Query hooks
  const { data: profile, isLoading, error } = useProfile()
  const updateProfile = useUpdateProfile()
  const { data: subscription } = useSubscription()
  const { isPremium, isAdmin } = useIsPremium()

  const handleProfileSubmit = async (formData: FormData) => {
    const username = formData.get('username') as string
    const full_name = formData.get('full_name') as string | null

    updateProfile.mutate(
      { username, full_name },
      {
        onSuccess: () => {
          setToast({ message: 'Profile updated successfully!', type: 'success' })
        },
        onError: (err) => {
          setToast({ message: err.message || 'Failed to update profile', type: 'error' })
        },
      }
    )
  }

  const handlePreferencesSubmit = async (formData: FormData) => {
    const daily_goal = parseInt(formData.get('daily_goal') as string)
    const default_focus_duration = parseInt(formData.get('default_focus_duration') as string)
    const default_break_duration = parseInt(formData.get('default_break_duration') as string)

    updateProfile.mutate(
      { daily_goal, default_focus_duration, default_break_duration },
      {
        onSuccess: () => {
          setToast({ message: 'Preferences updated successfully!', type: 'success' })
          // Reload to update the timer store
          window.location.reload()
        },
        onError: (err) => {
          setToast({ message: err.message || 'Failed to update preferences', type: 'error' })
        },
      }
    )
  }

  // Only show skeleton on initial load when there's no cached data
  if (isLoading && !profile) {
    return (
      <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12 max-w-4xl">
        <SettingsSkeleton />
      </div>
    )
  }

  // If we have no profile data after loading, show error
  if (!profile && !isLoading) {
    return (
      <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12 max-w-4xl">
        <div className="card text-center py-12">
          <p className="text-error mb-4">Failed to load profile</p>
          <p className="text-on-surface-secondary">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12 max-w-4xl">
        <div className="card text-center py-12">
          <p className="text-error mb-4">Failed to load settings</p>
          <p className="text-on-surface-secondary">{error.message}</p>
        </div>
      </div>
    )
  }

  const isPending = updateProfile.isPending

  // Guard against null profile (shouldn't happen after loading checks, but TypeScript safety)
  if (!profile) return null

  return (
    <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12 max-w-4xl">

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'profile'
            ? 'text-primary border-b-2 border-primary -mb-px'
            : 'text-on-surface-secondary hover:text-on-surface'
            }`}
        >
          <User size={18} />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'preferences'
            ? 'text-primary border-b-2 border-primary -mb-px'
            : 'text-on-surface-secondary hover:text-on-surface'
            }`}
        >
          <Settings size={18} />
          Preferences
        </button>
        <button
          onClick={() => setActiveTab('subscription')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'subscription'
            ? 'text-primary border-b-2 border-primary -mb-px'
            : 'text-on-surface-secondary hover:text-on-surface'
            }`}
        >
          <Crown size={18} />
          Subscription
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <h2 className="text-xl font-bold text-on-surface mb-6">Profile Information</h2>

          <form ref={profileFormRef} action={handleProfileSubmit} className="space-y-6">
            {/* Email (Read-only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-on-surface mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={userEmail}
                disabled
                className="input w-full bg-backplate cursor-not-allowed"
              />
              <p className="text-xs text-on-surface-secondary mt-2">
                Email cannot be changed. Contact support if you need assistance.
              </p>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-on-surface mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                id="username"
                defaultValue={profile.username || ''}
                required
                placeholder="Choose a username"
                className="input w-full"
                disabled={isPending}
              />
              <p className="text-xs text-on-surface-secondary mt-2">
                Your username is visible to other community members.
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-semibold text-on-surface mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                id="full_name"
                defaultValue={profile.full_name || ''}
                placeholder="Your full name (optional)"
                className="input w-full"
                disabled={isPending}
              />
              <p className="text-xs text-on-surface-secondary mt-2">
                Optional. Your full name is private and not shown publicly.
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-border">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="card">
          <h2 className="text-xl font-bold text-on-surface mb-6">Focus Preferences</h2>

          {/* Premium requirement notice for timer customization */}
          {!isPremium && (
            <div className="mb-6">
              <UpgradePrompt
                feature="Custom Timer Durations"
                description="Free plan uses fixed 25-min focus / 5-min break. Upgrade to customize your timer settings."
                variant="banner"
              />
            </div>
          )}

          <form ref={preferencesFormRef} action={handlePreferencesSubmit} className="space-y-6">
            {/* Daily Goal - Available to all */}
            <div>
              <label htmlFor="daily_goal" className="block text-sm font-semibold text-on-surface mb-2">
                Daily Focus Goal
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  name="daily_goal"
                  id="daily_goal"
                  min="1"
                  max="20"
                  defaultValue={profile.daily_goal}
                  required
                  className="input w-32"
                  disabled={isPending}
                />
                <span className="text-sm text-on-surface">sessions per day</span>
              </div>
              <p className="text-xs text-on-surface-secondary mt-2">
                Set your daily target for focus sessions.
              </p>
            </div>

            {/* Default Timer Duration - Premium only */}
            <div className={!isPremium ? 'opacity-50' : ''}>
              <label htmlFor="default_focus_duration" className="block text-sm font-semibold text-on-surface mb-2">
                Default Timer Duration
                {!isPremium && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
                    <Crown className="w-3 h-3" />
                    Premium
                  </span>
                )}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  name="default_focus_duration"
                  id="default_focus_duration"
                  min="5"
                  max="60"
                  step="5"
                  defaultValue={isPremium ? profile.default_focus_duration : 25}
                  required
                  className="input w-32"
                  disabled={isPending || !isPremium}
                />
                <span className="text-sm text-on-surface">minutes</span>
              </div>
              <p className="text-xs text-on-surface-secondary mt-2">
                {isPremium
                  ? 'Default duration for focus sessions (5-60 minutes).'
                  : 'Fixed at 25 minutes on Free plan.'}
              </p>
            </div>

            {/* Break Duration - Premium only */}
            <div className={!isPremium ? 'opacity-50' : ''}>
              <label htmlFor="default_break_duration" className="block text-sm font-semibold text-on-surface mb-2">
                Default Break Duration
                {!isPremium && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
                    <Crown className="w-3 h-3" />
                    Premium
                  </span>
                )}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  name="default_break_duration"
                  id="default_break_duration"
                  min="1"
                  max="30"
                  defaultValue={isPremium ? profile.default_break_duration : 5}
                  required
                  className="input w-32"
                  disabled={isPending || !isPremium}
                />
                <span className="text-sm text-on-surface">minutes</span>
              </div>
              <p className="text-xs text-on-surface-secondary mt-2">
                {isPremium
                  ? 'Default duration for break sessions (1-30 minutes).'
                  : 'Fixed at 5 minutes on Free plan.'}
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-border">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          {/* Current Plan Card */}
          <div className="card">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPremium ? 'bg-primary/20' : 'bg-surface-elevated'}`}>
                <Crown className={`w-6 h-6 ${isPremium ? 'text-primary' : 'text-on-surface-secondary'}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-on-surface">
                  {isAdmin ? 'Admin Access' : isPremium ? 'Premium Plan' : 'Free Plan'}
                </h2>
                <p className="text-sm text-on-surface-secondary">
                  {isAdmin
                    ? 'As an admin, you have full access to all features'
                    : isPremium
                      ? 'You have full access to all features'
                      : 'Upgrade to unlock all features'}
                </p>
              </div>
            </div>

            {/* Admin notice */}
            {isAdmin && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg mb-6">
                <p className="text-sm text-on-surface">
                  <strong>Admin privileges:</strong> You have unrestricted access to all premium features without a subscription.
                </p>
              </div>
            )}

            {/* Subscription info for paying premium users (not admins) */}
            {isPremium && !isAdmin && subscription?.subscription_current_period_end && (
              <div className="p-4 bg-surface-elevated rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-on-surface-secondary">
                      {subscription.subscription_cancel_at_period_end
                        ? 'Your subscription ends on'
                        : 'Next billing date'}
                    </p>
                    <p className="font-semibold text-on-surface">
                      {new Date(subscription.subscription_current_period_end).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  {subscription.subscription_cancel_at_period_end && (
                    <span className="badge badge-neutral">Canceling</span>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons based on user type */}
            {isAdmin ? (
              // Admins don't need billing management
              null
            ) : isPremium ? (
              <button
                onClick={async () => {
                  setIsPortalLoading(true)
                  try {
                    await redirectToPortal()
                  } catch (error) {
                    setToast({ message: 'Failed to open billing portal', type: 'error' })
                    setIsPortalLoading(false)
                  }
                }}
                disabled={isPortalLoading}
                className="btn btn-secondary w-full"
              >
                {isPortalLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <CreditCard size={18} />
                    Manage Billing
                  </>
                )}
              </button>
            ) : (
              <Link href="/pricing" className="btn btn-primary w-full">
                <Crown size={18} />
                Upgrade to Premium - $97/month
              </Link>
            )}
          </div>

          {/* Plan Comparison */}
          <div className="card">
            <h3 className="font-semibold text-on-surface mb-4">Plan Features</h3>
            <div className="space-y-3">
              {[
                { feature: 'Focus Timer', free: '25 min fixed', premium: 'Custom (5-60 min)' },
                { feature: 'Notes', free: '5 notes', premium: 'Unlimited' },
                { feature: 'Sounds', free: '3 free sounds', premium: 'Full library' },
                { feature: 'Forum', free: 'Read only', premium: 'Full access' },
                { feature: 'Reminders', free: '3 reminders', premium: 'Unlimited' },
                { feature: 'Achievements', free: 'First 3', premium: 'All milestones' },
              ].map((item) => (
                <div key={item.feature} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-on-surface">{item.feature}</span>
                  <span className={`text-sm ${isPremium ? 'text-primary font-medium' : 'text-on-surface-secondary'}`}>
                    {isPremium ? item.premium : item.free}
                  </span>
                </div>
              ))}
            </div>

            {!isPremium && (
              <div className="mt-4 pt-4 border-t border-border">
                <Link href="/pricing" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                  View full pricing details
                  <ExternalLink size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          isOpen={toast !== null}
          message={toast.message}
          variant={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
