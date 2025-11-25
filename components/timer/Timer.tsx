'use client'

import { useEffect, useState, useTransition } from 'react'
import { useTimerStore } from '@/stores/timerStore'
import { saveFocusSession } from '@/app/focus/actions'
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react'
import Toast from '@/components/Toast'
import AchievementModal from '@/components/AchievementModal'
import QuickNote from '@/components/QuickNote'
import { useQueryClient } from '@tanstack/react-query'
import { focusKeys } from '@/hooks/queries'
import { useTimerSound } from '@/hooks/useTimerSound'

export default function Timer() {
  const queryClient = useQueryClient()
  const {
    timeLeft,
    duration,
    isActive,
    mode,
    toggleTimer,
    resetTimer,
    tick,
    setMode,
    setOnComplete,
  } = useTimerStore()

  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [achievementModal, setAchievementModal] = useState<any | null>(null)
  const { playCompletionSound } = useTimerSound()

  // Set up completion handler
  useEffect(() => {
    setOnComplete(async (durationSeconds, sessionMode) => {
      // Play completion sound
      playCompletionSound()

      startTransition(async () => {
        const result = await saveFocusSession(durationSeconds, sessionMode)

        if (result.error) {
          setToast({ message: 'Failed to save session', type: 'error' })
        } else if (result.newMilestones && result.newMilestones.length > 0) {
          // Show achievement modal for first unlocked milestone
          const milestone = result.newMilestones[0]
          setAchievementModal(milestone)
          // Also show a toast
          setToast({
            message: `🎉 ${milestone.title} unlocked!`,
            type: 'success'
          })
        } else if (sessionMode === 'focus') {
          setToast({ message: '✓ Focus session completed!', type: 'success' })
        } else {
          setToast({ message: '✓ Break completed!', type: 'success' })
        }
        // Invalidate queries so stats and achievements refresh
        queryClient.invalidateQueries({ queryKey: focusKeys.dashboardStats() })
        queryClient.invalidateQueries({ queryKey: focusKeys.focusPageStats() })
      })
    })
  }, [setOnComplete, playCompletionSound])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive) {
      interval = setInterval(() => {
        tick()
      }, 1000)
    } else if (!isActive && interval) {
      clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, tick])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate SVG circle progress
  const radius = 140
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (timeLeft / duration) * circumference

  return (
    <div className="flex flex-col items-center justify-center gap-10">

      {/* Mode Toggles */}
      <div className="flex w-full max-w-md gap-2 p-1.5 bg-backplate rounded-xl border border-border">
        <button
          onClick={() => setMode('focus')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg transition-all font-medium cursor-pointer ${mode === 'focus'
            ? 'bg-primary text-on-primary shadow-md'
            : 'text-on-surface-secondary hover:text-on-surface hover:bg-surface'
            }`}
        >
          <Brain size={18} className="sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Focus</span>
        </button>
        <button
          onClick={() => setMode('break')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg transition-all font-medium cursor-pointer ${mode === 'break'
            ? 'bg-secondary text-on-primary shadow-md'
            : 'text-on-surface-secondary hover:text-on-surface hover:bg-surface'
            }`}
        >
          <Coffee size={18} className="sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Break</span>
        </button>
      </div>

      {/* Timer Display */}
      <div className="relative w-[340px] h-[340px] flex items-center justify-center">
        {/* Background Circle */}
        <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
          <circle
            cx="170"
            cy="170"
            r={radius}
            stroke="var(--color-border)"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Progress Circle */}
          <circle
            cx="170"
            cy="170"
            r={radius}
            stroke={mode === 'focus' ? 'var(--color-primary)' : 'var(--color-secondary)'}
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
            strokeLinecap="round"
          />
        </svg>

        {/* Time Display */}
        <div className="text-center">
          <div className="text-7xl font-bold font-mono text-on-surface tracking-tight">
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-on-surface-secondary mt-2 uppercase tracking-wider font-medium">
            {mode === 'focus' ? 'Deep Work' : 'Rest & Recharge'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-center">
        <button
          onClick={toggleTimer}
          className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center hover:shadow-lg transition-all active:scale-95 shadow-md cursor-pointer"
        >
          {isActive ? (
            <Pause size={28} fill="currentColor" />
          ) : (
            <Play size={28} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <button
          onClick={resetTimer}
          className="w-12 h-12 rounded-full bg-surface border border-border text-on-surface-secondary flex items-center justify-center hover:text-on-surface hover:border-primary transition-all cursor-pointer"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Session Info */}
      <div className="text-center">
        <p className="text-xs text-on-surface-secondary uppercase tracking-wider font-medium mb-1">
          Session Duration
        </p>
        <p className="text-lg font-semibold text-on-surface">
          {Math.floor(duration / 60)} minutes
        </p>
      </div>

      {/* Quick Note */}
      <QuickNote />

      {/* Toast Notification */}
      <Toast
        isOpen={toast !== null}
        message={toast?.message || ''}
        variant={toast?.type || 'success'}
        onClose={() => setToast(null)}
      />

      {/* Achievement Modal */}
      <AchievementModal
        isOpen={achievementModal !== null}
        milestone={achievementModal}
        onClose={() => setAchievementModal(null)}
      />

    </div>
  )
}
