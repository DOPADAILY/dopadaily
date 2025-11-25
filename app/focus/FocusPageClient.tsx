'use client'

import { useEffect } from 'react'
import { Calendar, TrendingUp } from 'lucide-react'
import { useTimerStore } from '@/stores/timerStore'
import Timer from '@/components/timer/Timer'
import StatCard from '@/components/StatCard'
import { useFocusPageStats } from '@/hooks/queries'
import { SkeletonPulse } from '@/components/SkeletonLoader'

interface FocusPageClientProps {
  initialFocusDuration: number
  initialBreakDuration: number
}

export default function FocusPageClient({ initialFocusDuration, initialBreakDuration }: FocusPageClientProps) {
  const setUserPreferences = useTimerStore((state) => state.setUserPreferences)

  // TanStack Query hook
  const { data: stats, isLoading } = useFocusPageStats()

  // Initialize timer store immediately with server-provided preferences
  useEffect(() => {
    setUserPreferences({
      defaultFocusDuration: initialFocusDuration,
      defaultBreakDuration: initialBreakDuration,
    })
  }, [initialFocusDuration, initialBreakDuration, setUserPreferences])

  // Update if stats change (e.g., user updates preferences)
  useEffect(() => {
    if (stats?.profile) {
      setUserPreferences({
        defaultFocusDuration: stats.profile.default_focus_duration || initialFocusDuration,
        defaultBreakDuration: stats.profile.default_break_duration || initialBreakDuration,
      })
    }
  }, [stats?.profile, initialFocusDuration, initialBreakDuration, setUserPreferences])

  // Calculate daily goals
  const dailyGoalSessions = stats?.profile?.daily_goal || 8
  const dailyGoalMinutes = dailyGoalSessions * (stats?.profile?.default_focus_duration || 25)
  const todaySessionCount = stats?.todaySessionCount || 0
  const todayTotalMinutes = stats?.todayTotalMinutes || 0
  const weekSessionCount = stats?.weekSessionCount || 0
  const milestoneProgress = stats?.milestoneProgress

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
      {/* Main Timer Section */}
      <div className="xl:col-span-2 space-y-6">
        <div className="card text-center">
          <Timer />
        </div>

        {/* Quick Tips */}
        <div className="card bg-backplate">
          <h3 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
            <span className="text-lg">💡</span>
            Focus Tips
          </h3>
          <ul className="space-y-3 text-sm text-on-surface-secondary">
            <li className="flex items-start gap-3">
              <span className="text-primary mt-0.5">•</span>
              <span>Use 25-minute intervals (Pomodoro) for optimal focus</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-0.5">•</span>
              <span>Take 5-minute breaks between sessions</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-0.5">•</span>
              <span>After 4 sessions, take a longer 15-30 minute break</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Sidebar Stats */}
      <div className="space-y-6">
        {/* Today's Progress */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-primary" />
            <h3 className="font-semibold text-on-surface">Today's Progress</h3>
          </div>
          {isLoading && !stats ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <SkeletonPulse className="h-4 w-24" />
                  <SkeletonPulse className="h-4 w-12" />
                </div>
                <SkeletonPulse className="h-2 w-full rounded-full" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <SkeletonPulse className="h-4 w-20" />
                  <SkeletonPulse className="h-4 w-16" />
                </div>
                <SkeletonPulse className="h-2 w-full rounded-full" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-on-surface-secondary">Focus Sessions</span>
                  <span className="font-semibold text-on-surface">
                    {todaySessionCount} / {dailyGoalSessions}
                  </span>
                </div>
                <div className="h-2 bg-backplate rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (todaySessionCount / dailyGoalSessions) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-on-surface-secondary">Total Time</span>
                  <span className="font-semibold text-on-surface">
                    {todayTotalMinutes}m / {dailyGoalMinutes}m
                  </span>
                </div>
                <div className="h-2 bg-backplate rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary transition-all"
                    style={{ width: `${Math.min(100, (todayTotalMinutes / dailyGoalMinutes) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Weekly Stats */}
        {isLoading && !stats ? (
          <div className="card">
            <SkeletonPulse className="h-4 w-32 mb-4" />
            <SkeletonPulse className="h-8 w-16 mb-2" />
            <SkeletonPulse className="h-3 w-24" />
          </div>
        ) : (
          <StatCard
            label="Sessions This Week"
            value={`${weekSessionCount}`}
            change={weekSessionCount ? `Keep going!` : 'Start your first session!'}
            changeType={weekSessionCount ? 'positive' : 'neutral'}
          />
        )}

        {/* Achievements */}
        {isLoading && !stats ? (
          <div className="card bg-linear-to-br from-primary to-secondary border-primary">
            <div className="flex items-center gap-2 mb-4">
              <SkeletonPulse className="h-8 w-8 rounded" />
              <SkeletonPulse className="h-5 w-28" />
            </div>
            <SkeletonPulse className="h-4 w-3/4 mb-2" />
            <SkeletonPulse className="h-3 w-1/2" />
          </div>
        ) : milestoneProgress?.milestone ? (
          <div className="card bg-linear-to-br from-primary to-secondary border-primary">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{milestoneProgress.milestone.badge_icon || '🏆'}</span>
              <h3 className="font-semibold">Next Milestone</h3>
            </div>
            <p className="text-sm font-semibold mb-1">{milestoneProgress.milestone.title}</p>
            <p className="text-sm text-neutral-medium">
              {milestoneProgress.sessionsToGo} {milestoneProgress.sessionsToGo === 1 ? 'session' : 'sessions'} to go!
            </p>
          </div>
        ) : milestoneProgress && milestoneProgress.totalMilestones > 0 ? (
          <div className="card bg-linear-to-br from-primary to-secondary text-neutral-medium border-primary">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">👑</span>
              <h3 className="font-semibold">All Complete!</h3>
            </div>
            <p className="text-sm text-neutral-medium">You've unlocked all achievements!</p>
          </div>
        ) : (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎯</span>
              <h3 className="font-semibold text-on-surface">Milestones</h3>
            </div>
            <p className="text-sm text-on-surface-secondary">
              No milestones yet. Keep focusing — achievements are coming soon!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
