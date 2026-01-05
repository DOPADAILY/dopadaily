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

  // Calculate SVG circle progress (for responsive percentage-based circles)
  const progressPercentage = (timeLeft / duration) * 100

  return (
    <div className="flex flex-col items-center justify-center w-full">

      {/* Mode Toggles - Cleaner Design */}
      <div className="flex w-full max-w-sm gap-3 mb-8 lg:mb-10">
        <button
          onClick={() => setMode('focus')}
          className={`flex-1 flex flex-col items-center justify-center gap-2 px-6 py-5 lg:py-4 rounded-2xl lg:rounded-xl transition-all font-semibold cursor-pointer active:scale-95 ${mode === 'focus'
            ? 'bg-primary text-on-primary shadow-lg scale-105'
            : 'bg-surface border-2 border-border text-on-surface-secondary hover:border-primary'
            }`}
        >
          <Brain size={24} className="lg:w-5 lg:h-5" />
          <span className="text-sm lg:text-xs font-bold">FOCUS</span>
        </button>
        <button
          onClick={() => setMode('break')}
          className={`flex-1 flex flex-col items-center justify-center gap-2 px-6 py-5 lg:py-4 rounded-2xl lg:rounded-xl transition-all font-semibold cursor-pointer active:scale-95 ${mode === 'break'
            ? 'bg-secondary text-on-primary shadow-lg scale-105'
            : 'bg-surface border-2 border-border text-on-surface-secondary hover:border-secondary'
            }`}
        >
          <Coffee size={24} className="lg:w-5 lg:h-5" />
          <span className="text-sm lg:text-xs font-bold">BREAK</span>
        </button>
      </div>

      {/* Timer Card - Modern Mobile Design */}
      <div className="relative w-full max-w-sm mb-8 lg:mb-10">
        <div className="relative bg-surface border-2 border-border rounded-3xl p-8 lg:p-10 shadow-lg">
          {/* Progress Ring - Optimized Size */}
          <div className="relative w-full aspect-square max-w-[280px] mx-auto mb-6">
            {/* Background Circle */}
            <svg 
              className="absolute inset-0 w-full h-full transform -rotate-90"
              viewBox="0 0 200 200"
            >
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke="var(--color-border)"
                strokeWidth="8"
                fill="transparent"
                className="opacity-30"
              />
              {/* Progress Circle */}
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke={mode === 'focus' ? 'var(--color-primary)' : 'var(--color-secondary)'}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 90}
                strokeDashoffset={(2 * Math.PI * 90) * (1 - progressPercentage / 100)}
                className="transition-all duration-1000 ease-linear"
                strokeLinecap="round"
              />
            </svg>

            {/* Time Display - Centered & Large */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-6xl sm:text-7xl lg:text-6xl font-bold font-mono text-on-surface tracking-tight transition-all ${isActive ? 'scale-105' : ''}`}>
                {formatTime(timeLeft)}
              </div>
              <div className="text-xs text-on-surface-secondary mt-3 uppercase tracking-widest font-semibold px-4 py-1 bg-backplate rounded-full">
                {mode === 'focus' ? 'Deep Work' : 'Recharge'}
              </div>
            </div>
          </div>

          {/* Session Duration - Compact */}
          <div className="text-center mb-6 pb-6 border-b border-border">
            <p className="text-xs text-on-surface-secondary uppercase tracking-wider font-medium mb-1">
              Session Duration
            </p>
            <p className="text-lg font-bold text-on-surface">
              {Math.floor(duration / 60)} minutes
            </p>
          </div>

          {/* Controls - Larger & Touch-Friendly */}
          <div className="flex gap-4 items-center justify-center">
            <button
              onClick={resetTimer}
              className="w-16 h-16 lg:w-14 lg:h-14 rounded-2xl bg-backplate border border-border text-on-surface-secondary flex items-center justify-center hover:text-on-surface hover:border-primary hover:rotate-[-180deg] active:scale-90 transition-all duration-500 cursor-pointer shadow-sm"
            >
              <RotateCcw size={24} className="lg:w-5 lg:h-5" />
            </button>

            <div className="relative">
              {/* Subtle pulse ring when active */}
              {isActive && (
                <div className="absolute inset-[-8px] rounded-2xl border-2 animate-pulse" 
                  style={{ 
                    borderColor: mode === 'focus' ? 'var(--color-primary)' : 'var(--color-secondary)',
                    opacity: 0.3
                  }} 
                />
              )}
              <button
                onClick={toggleTimer}
                className={`relative w-24 h-24 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br ${
                  mode === 'focus' ? 'from-primary to-primary' : 'from-secondary to-secondary'
                } text-on-primary flex items-center justify-center transition-all active:scale-90 shadow-xl cursor-pointer ${
                  isActive ? 'shadow-2xl' : 'hover:scale-105'
                }`}
              >
                {isActive ? (
                  <Pause size={40} className="lg:w-8 lg:h-8" fill="currentColor" />
                ) : (
                  <Play size={40} className="lg:w-8 lg:h-8 ml-1" fill="currentColor" />
                )}
              </button>
            </div>

            <button
              onClick={toggleTimer}
              className="w-16 h-16 lg:w-14 lg:h-14 rounded-2xl bg-backplate border border-border text-on-surface-secondary flex items-center justify-center hover:text-on-surface hover:border-primary active:scale-90 transition-all cursor-pointer shadow-sm opacity-0 pointer-events-none"
            >
              <RotateCcw size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Note - Compact */}
      <div className="w-full max-w-sm">
        <QuickNote />
      </div>

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
