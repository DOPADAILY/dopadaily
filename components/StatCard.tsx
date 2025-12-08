'use client'

import { useAnimatedNumber } from './AnimatedCounter'

export default function StatCard({
  label,
  value,
  change,
  changeType,
  animateValue,
}: {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  animateValue?: number // Optional: if provided, will animate from 0 to this number
}) {
  const animatedNum = useAnimatedNumber(animateValue ?? 0, 1200)
  
  // Determine what to display
  const displayValue = animateValue !== undefined ? animatedNum : value

  return (
    <div className="card card-interactive group">
      <div className="text-sm text-on-surface-secondary mb-3 group-hover:text-primary transition-colors">{label}</div>
      <div className="h-px bg-border mb-6 group-hover:bg-primary/30 transition-colors"></div>
      <div className="text-4xl font-bold text-on-surface leading-none mb-2 transition-transform group-hover:scale-[1.02] origin-left">
        {displayValue}
      </div>
      {change && (
        <div
          className={`text-sm transition-all ${
            changeType === 'positive'
              ? 'text-success'
              : changeType === 'negative'
              ? 'text-error'
              : 'text-neutral-medium'
          }`}
        >
          {change}
        </div>
      )}
    </div>
  )
}

