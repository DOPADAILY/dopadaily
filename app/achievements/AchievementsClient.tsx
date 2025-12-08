'use client'

import { Award, Lock, Check, TrendingUp } from 'lucide-react'
import { useAchievements } from '@/hooks/queries'
import { AchievementsSkeleton } from '@/components/SkeletonLoader'
import EmptyState from '@/components/EmptyState'
import AnimatedProgressBar from '@/components/AnimatedProgressBar'

export default function AchievementsClient() {
  const { data, isLoading, error } = useAchievements()

  // Only show skeleton on initial load when there's no cached data
  if (isLoading && !data) {
    return <AchievementsSkeleton />
  }

  // Show error state
  if (error) {
    return (
      <div className="card">
        <EmptyState
          icon={Award}
          title="Failed to load achievements"
          description={error.message || 'Something went wrong. Please try again.'}
        />
      </div>
    )
  }

  if (!data) return null

  const {
    milestones,
    unlockedAchievements,
    totalSessions,
    unlockedCount,
    totalCount,
    nextMilestone,
  } = data

  const unlockedMilestoneIds = new Set(unlockedAchievements?.map(a => a.milestone_id))

  return (
    <>
      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">

        {/* Total Sessions */}
        <div className="card card-interactive animate-stagger-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-on-surface">{totalSessions || 0}</p>
              <p className="text-xs text-on-surface-secondary">Total Sessions</p>
            </div>
          </div>
        </div>

        {/* Achievements Progress */}
        <div className="card card-interactive animate-stagger-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
              <Award size={20} className="text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-on-surface">{unlockedCount} / {totalCount}</p>
              <p className="text-xs text-on-surface-secondary">Achievements Unlocked</p>
            </div>
          </div>
          <div className="mt-3">
            <AnimatedProgressBar
              value={unlockedCount}
              max={totalCount || 1}
              color="success"
              showShimmer={unlockedCount > 0}
              height="sm"
            />
          </div>
        </div>

        {/* Next Milestone */}
        {nextMilestone ? (
          <div className="card card-interactive animate-stagger-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center animate-pulse">
                <Lock size={20} className="text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">Next: {nextMilestone.title}</p>
                <p className="text-xs text-on-surface-secondary">
                  {nextMilestone.session_threshold - (totalSessions || 0)} sessions away
                </p>
              </div>
            </div>
          </div>
        ) : totalCount > 0 ? (
          <div className="card card-interactive animate-stagger-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Check size={20} className="text-primary animate-bounce-in" />
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">All Unlocked!</p>
                <p className="text-xs text-on-surface-secondary">You're amazing! 🎉</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="card card-interactive animate-stagger-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-light/20 flex items-center justify-center">
                <Award size={20} className="text-on-surface-secondary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">Coming Soon</p>
                <p className="text-xs text-on-surface-secondary">Achievements are on the way!</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Achievements Grid */}
      <h2 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2 animate-stagger-4">
        <Award size={24} className="text-primary" />
        All Achievements
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {milestones?.map((milestone, index) => {
          const isUnlocked = unlockedMilestoneIds.has(milestone.id)
          const achievement = unlockedAchievements?.find(a => a.milestone_id === milestone.id)
          const progress = Math.min(100, ((totalSessions || 0) / milestone.session_threshold) * 100)
          const isInProgress = !isUnlocked && progress > 0

          return (
            <div
              key={milestone.id}
              className={`card card-interactive card-shimmer transition-all duration-300 animate-scale-fade-in ${isUnlocked ? 'border-2 border-success' : isInProgress ? 'border-2 border-warning/30' : 'opacity-60 hover:opacity-80'
                }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Badge */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0 transition-all duration-300 ${isUnlocked ? 'shadow-lg animate-bounce-in' : 'grayscale opacity-50'
                    }`}
                  style={{
                    backgroundColor: isUnlocked ? milestone.badge_color + '20' : '#e9ddcf',
                    border: isUnlocked ? `3px solid ${milestone.badge_color}` : '2px solid #d4c9be',
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  {isUnlocked ? milestone.badge_icon : '🔒'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-on-surface mb-1 flex items-center gap-2">
                    {milestone.title}
                    {isUnlocked && <Check size={16} className="text-success animate-scale-in" />}
                  </h3>
                  <p className="text-xs text-on-surface-secondary line-clamp-2">
                    {milestone.description}
                  </p>
                </div>
              </div>

              {/* Progress/Status */}
              {isUnlocked ? (
                <div className="bg-success/10 border border-success/30 rounded-lg px-3 py-2 animate-fade-in">
                  <p className="text-xs text-success font-semibold">
                    ✓ Unlocked {achievement ? new Date(achievement.unlocked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-on-surface-secondary font-medium">
                      {totalSessions || 0} / {milestone.session_threshold} sessions
                    </p>
                    <p className="text-xs text-on-surface-secondary font-semibold">
                      {Math.round(progress)}%
                    </p>
                  </div>
                  <AnimatedProgressBar
                    value={progress}
                    max={100}
                    color="warning"
                    showShimmer={isInProgress}
                    height="sm"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {(!milestones || milestones.length === 0) && (
        <div className="card text-center py-12">
          <Award size={48} className="mx-auto text-neutral-medium mb-4 opacity-50" />
          <h3 className="font-semibold text-on-surface mb-2">No Achievements Yet</h3>
          <p className="text-sm text-on-surface-secondary">
            Complete focus sessions to start unlocking achievements!
          </p>
        </div>
      )}
    </>
  )
}

