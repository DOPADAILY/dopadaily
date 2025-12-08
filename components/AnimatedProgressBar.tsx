'use client'

import { useEffect, useState } from 'react'

interface AnimatedProgressBarProps {
  value: number // 0-100
  max?: number
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'accent'
  showShimmer?: boolean
  height?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
  label?: string
}

const colorClasses = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-success',
  warning: 'bg-warning',
  accent: 'bg-accent',
}

const shimmerColors = {
  primary: 'from-primary via-primary-light to-primary',
  secondary: 'from-secondary via-primary-light to-secondary',
  success: 'from-success via-green-400 to-success',
  warning: 'from-warning via-yellow-400 to-warning',
  accent: 'from-accent via-pink-300 to-accent',
}

const heightClasses = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

export default function AnimatedProgressBar({
  value,
  max = 100,
  color = 'primary',
  showShimmer = true,
  height = 'md',
  animated = true,
  className = '',
  label,
}: AnimatedProgressBarProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const percentage = Math.min((value / max) * 100, 100)

  useEffect(() => {
    if (!animated) {
      setDisplayValue(percentage)
      return
    }

    // Animate from current to target
    const duration = 1000
    const startTime = performance.now()
    const startValue = displayValue

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      setDisplayValue(startValue + (percentage - startValue) * easeOut)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [percentage, animated])

  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between text-sm mb-2">
          <span className="text-on-surface-secondary">{label}</span>
          <span className="font-semibold text-on-surface">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`${heightClasses[height]} bg-backplate rounded-full overflow-hidden relative`}>
        <div
          className={`h-full rounded-full transition-all duration-300 relative ${
            showShimmer ? `bg-gradient-to-r ${shimmerColors[color]} animate-shimmer bg-[length:200%_100%]` : colorClasses[color]
          }`}
          style={{ width: `${displayValue}%` }}
        >
          {/* Shine effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{
              animation: 'shimmer 2s ease-in-out infinite',
            }}
          />
        </div>
        
        {/* Glow at the end of progress */}
        {displayValue > 5 && (
          <div
            className="absolute top-0 h-full w-4 pointer-events-none"
            style={{
              left: `calc(${displayValue}% - 8px)`,
              background: `radial-gradient(circle at center, var(--color-${color}) 0%, transparent 70%)`,
              opacity: 0.6,
              filter: 'blur(4px)',
            }}
          />
        )}
      </div>
    </div>
  )
}

// Simpler version for inline use
export function ProgressBar({
  value,
  color = 'primary',
  className = '',
}: {
  value: number
  color?: 'primary' | 'secondary'
  className?: string
}) {
  return (
    <div className={`h-2 bg-backplate rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClasses[color]} animate-progress`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}

