'use client'

import { useState } from 'react'
import { Crown, Sparkles, Lock, Loader2, X } from 'lucide-react'
import { redirectToCheckout } from '@/hooks/queries/useSubscription'

interface UpgradePromptProps {
  feature: string
  description?: string
  variant?: 'inline' | 'modal' | 'banner'
  onClose?: () => void
}

export default function UpgradePrompt({
  feature,
  description,
  variant = 'inline',
  onClose,
}: UpgradePromptProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      await redirectToCheckout()
    } catch (error) {
      console.error('Upgrade error:', error)
      setIsLoading(false)
    }
  }

  if (variant === 'banner') {
    return (
      <div className="bg-linear-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-on-surface">Upgrade to Premium</h3>
              <p className="text-sm text-on-surface-secondary">
                {description || `Unlock ${feature} and all premium features`}
              </p>
            </div>
          </div>
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Upgrade Now
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-surface-elevated rounded-2xl p-6 max-w-md w-full shadow-xl">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-on-surface-secondary hover:text-on-surface"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-2">
              Premium Feature
            </h2>
            <p className="text-on-surface-secondary mb-6">
              {description || `${feature} is a premium feature. Upgrade to unlock unlimited access.`}
            </p>

            <div className="space-y-3">
              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Upgrade to Premium - $97/month
                  </>
                )}
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="btn btn-secondary w-full"
                >
                  Maybe Later
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default inline variant
  return (
    <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <Lock className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-on-surface text-sm">{feature}</p>
        <p className="text-xs text-on-surface-secondary">
          {description || 'Upgrade to Premium to unlock this feature'}
        </p>
      </div>
      <button
        onClick={handleUpgrade}
        disabled={isLoading}
        className="btn btn-primary btn-sm shrink-0"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          'Upgrade'
        )}
      </button>
    </div>
  )
}

// Simple locked overlay for cards/items
export function LockedOverlay({
  feature,
  onClick,
}: {
  feature: string
  onClick?: () => void
}) {
  return (
    <div
      className="absolute inset-0 bg-surface/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl cursor-pointer"
      onClick={onClick}
    >
      <Lock className="w-6 h-6 text-on-surface-secondary mb-2" />
      <span className="text-sm font-medium text-on-surface-secondary">
        Premium Only
      </span>
    </div>
  )
}

// Badge for premium features
export function PremiumBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full ${className}`}
    >
      <Crown className="w-3 h-3" />
      Premium
    </span>
  )
}

