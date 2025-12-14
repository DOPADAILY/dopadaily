'use client'

import { Crown, Mic, Clock, TrendingUp } from 'lucide-react'
import { useVoiceNotesUsage, useVoiceNoteLimit, useIsPremium } from '@/hooks/queries'
import { formatDuration } from '@/utils/audioRecording'
import Link from 'next/link'

export default function VoiceNoteLimitBanner() {
  const { data: limits } = useVoiceNoteLimit()
  const { data: usage } = useVoiceNotesUsage()
  const { isPremium } = useIsPremium()

  // Don't show for premium users
  if (isPremium) return null

  if (!limits || !usage) return null

  const recordingsUsed = usage.totalRecordings
  const recordingsLimit = limits.maxRecordings
  const durationUsed = usage.totalDurationSeconds
  const durationLimit = limits.maxDuration

  const recordingsPercentage = (recordingsUsed / recordingsLimit) * 100
  const durationPercentage = (durationUsed / durationLimit) * 100
  
  const isNearLimit = recordingsPercentage >= 80 || durationPercentage >= 80
  const isAtLimit = !limits.canRecord

  // Don't show if no usage yet
  if (recordingsUsed === 0 && durationUsed === 0) return null

  return (
    <div className={`rounded-xl border-2 p-4 ${
      isAtLimit 
        ? 'bg-error/10 border-error' 
        : isNearLimit 
          ? 'bg-warning/10 border-warning'
          : 'bg-primary/10 border-primary/30'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${
          isAtLimit ? 'bg-error/20' : isNearLimit ? 'bg-warning/20' : 'bg-primary/20'
        }`}>
          <Mic size={20} className={isAtLimit ? 'text-error' : isNearLimit ? 'text-warning' : 'text-primary'} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm mb-2 ${
            isAtLimit ? 'text-error' : isNearLimit ? 'text-warning' : 'text-on-surface'
          }`}>
            {isAtLimit ? 'Voice Note Limit Reached' : 'Voice Note Usage'}
          </h3>

          <div className="space-y-3">
            {/* Recordings Usage */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-on-surface-secondary">Recordings this month</span>
                <span className="font-semibold text-on-surface">
                  {recordingsUsed} / {recordingsLimit}
                </span>
              </div>
              <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    recordingsPercentage >= 100 ? 'bg-error' : 
                    recordingsPercentage >= 80 ? 'bg-warning' : 
                    'bg-primary'
                  }`}
                  style={{ width: `${Math.min(recordingsPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Duration Usage */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-on-surface-secondary">Duration this month</span>
                <span className="font-semibold text-on-surface">
                  {formatDuration(durationUsed)} / {formatDuration(durationLimit)}
                </span>
              </div>
              <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    durationPercentage >= 100 ? 'bg-error' : 
                    durationPercentage >= 80 ? 'bg-warning' : 
                    'bg-primary'
                  }`}
                  style={{ width: `${Math.min(durationPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Upgrade CTA */}
            {isAtLimit && (
              <Link
                href="/pricing"
                className="flex items-center justify-center gap-2 w-full mt-3 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold text-sm"
              >
                <Crown size={18} />
                Upgrade for Unlimited Voice Notes
              </Link>
            )}

            {isNearLimit && !isAtLimit && (
              <div className="flex items-start gap-2 mt-2 text-xs text-on-surface-secondary">
                <TrendingUp size={14} className="shrink-0 mt-0.5" />
                <span>
                  You're running low on voice notes. 
                  <Link href="/pricing" className="text-primary hover:underline ml-1">
                    Upgrade to Premium
                  </Link> for unlimited recordings.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

