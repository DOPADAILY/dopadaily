'use client'

import { AlertTriangle, Crown } from 'lucide-react'
import Link from 'next/link'

interface TaskLimitBannerProps {
  current: number
  limit: number
}

export default function TaskLimitBanner({ current, limit }: TaskLimitBannerProps) {
  const percentage = (current / limit) * 100
  const isNearLimit = percentage >= 80
  const isAtLimit = current >= limit

  if (percentage < 60) {
    return null // Don't show if usage is low
  }

  return (
    <div
      className={`
        rounded-lg p-4 border
        ${isAtLimit
          ? 'bg-error/10 border-error/20'
          : isNearLimit
            ? 'bg-warning/10 border-warning/20'
            : 'bg-backplate border-border'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div
          className={`
            p-2 rounded-full
            ${isAtLimit
              ? 'bg-error/20'
              : isNearLimit
                ? 'bg-warning/20'
                : 'bg-on-surface-secondary/10'
            }
          `}
        >
          {isAtLimit ? (
            <AlertTriangle size={20} className="text-error" />
          ) : (
            <Crown size={20} className={isNearLimit ? 'text-warning' : 'text-on-surface-secondary'} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={`
            font-medium text-sm
            ${isAtLimit
              ? 'text-error'
              : isNearLimit
                ? 'text-warning'
                : 'text-on-surface'
            }
          `}>
            {isAtLimit
              ? 'Task limit reached'
              : isNearLimit
                ? 'Approaching task limit'
                : 'Task usage'}
          </h4>
          <p className={`
            text-xs mt-0.5
            ${isAtLimit
              ? 'text-error/80'
              : isNearLimit
                ? 'text-warning/80'
                : 'text-on-surface-secondary'
            }
          `}>
            {isAtLimit
              ? 'Delete some tasks or upgrade to premium for unlimited tasks.'
              : `You've used ${current} of ${limit} tasks.`}
          </p>

          {/* Progress Bar */}
          <div className="mt-2 h-2 bg-border rounded-full overflow-hidden">
            <div
              className={`
                h-full rounded-full transition-all
                ${isAtLimit
                  ? 'bg-error'
                  : isNearLimit
                    ? 'bg-warning'
                    : 'bg-primary'
                }
              `}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-on-surface-secondary">
              {current} / {limit} tasks
            </span>
            <Link
              href="/settings/subscription"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Crown size={12} />
              Upgrade to Premium
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

