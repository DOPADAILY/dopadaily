'use client'

import Link from 'next/link'
import { Brain, MessageSquare, Bell, Clock } from 'lucide-react'
import StatCard from '@/components/StatCard'
import ReminderNotifications from '@/components/ReminderNotifications'
import EmptyState from '@/components/EmptyState'
import { useDashboardStats } from '@/hooks/queries'
import { DashboardSkeleton } from '@/components/SkeletonLoader'
import AnimatedProgressBar from '@/components/AnimatedProgressBar'

interface DashboardClientProps {
    userId: string
    userEmail: string
}

export default function DashboardClient({ userId, userEmail }: DashboardClientProps) {
    const { data: stats, isLoading, error } = useDashboardStats()

    // Only show skeleton on initial load when there's no cached data
    if (isLoading && !stats) {
        return <DashboardSkeleton />
    }

    // Show error state
    if (error) {
        return (
            <div className="card">
                <EmptyState
                    icon={Brain}
                    title="Failed to load dashboard"
                    description={error.message || 'Something went wrong. Please try again.'}
                />
            </div>
        )
    }

    if (!stats) return null

    const {
        profile,
        todaySessions,
        todaySessionCount,
        todayTotalMinutes,
        weekTotalMinutes,
        weekSessionCount,
        streak,
        userPostsCount,
        totalPostsCount,
        milestoneProgress,
        recentAchievements,
        randomTip,
    } = stats

    const weekTotalHours = Math.floor(weekTotalMinutes / 60)
    const weekRemainingMinutes = Math.round(weekTotalMinutes % 60)
    const recentSessions = todaySessions?.slice(0, 5) || []

    return (
        <>
            {/* Reminder Notifications */}
            <div className="mb-6 animate-stagger-1">
                <ReminderNotifications userId={userId} />
            </div>

            {/* Mobile: Today's Focus Sessions at top */}
            <div className="xl:hidden mb-6 animate-stagger-2">
                <div className="card">
                    <div className="flex items-center gap-2 mb-6">
                        <Clock size={20} className="text-primary" />
                        <h2 className="text-xl font-semibold text-on-surface">Today's Focus Sessions</h2>
                    </div>

                    {recentSessions.length > 0 ? (
                        <div className="space-y-4">
                            {recentSessions.map((session, index) => {
                                const completedTime = new Date(session.completed_at)
                                const durationMinutes = session.duration_minutes

                                return (
                                    <div key={`mobile-${index}`} className="p-4 bg-backplate rounded-lg border border-border">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-on-surface">Focus Session</span>
                                            <span className="text-xs text-on-surface-secondary">
                                                {completedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="text-sm text-on-surface-secondary">{durationMinutes} minutes completed ✓</div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Clock size={48} className="mx-auto text-neutral-medium mb-4 opacity-50" />
                            <p className="text-on-surface-secondary mb-4">No focus sessions today yet</p>
                            <Link href="/focus" className="btn btn-primary inline-flex items-center gap-2">
                                <Brain size={18} />
                                Start Your First Session
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
                <div className="animate-stagger-2">
                    <StatCard
                        label="Focus Sessions Today"
                        value={`${todaySessionCount || 0} / ${profile?.daily_goal || 8}`}
                        change={todaySessionCount ? `${todayTotalMinutes} minutes` : 'Start your first session!'}
                        changeType={todaySessionCount && todaySessionCount >= (profile?.daily_goal || 8) ? 'positive' : 'neutral'}
                    />
                </div>
                <div className="animate-stagger-3">
                    <StatCard
                        label="Total Time This Week"
                        value={weekTotalHours > 0 ? `${weekTotalHours}h ${weekRemainingMinutes}m` : `${weekTotalMinutes}m`}
                        change={weekSessionCount > 0 ? `${weekSessionCount} sessions` : 'Time to focus'}
                        changeType={weekSessionCount > 0 ? 'positive' : 'neutral'}
                    />
                </div>
                <div className="animate-stagger-4"><StatCard
                    label="Your Posts"
                    value={`${userPostsCount || 0}`}
                    change={`${totalPostsCount || 0} total community posts`}
                    changeType="neutral"
                /></div>
                <div className="animate-stagger-5">
                    <StatCard
                        label="Current Streak"
                        value={`${streak} ${streak === 1 ? 'day' : 'days'}`}
                        change={streak > 0 ? 'Keep it going! 🔥' : 'Start today!'}
                        changeType={streak > 0 ? 'positive' : 'neutral'}
                    />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8 animate-stagger-6">
                <h2 className="text-xl font-semibold text-on-surface mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    <Link href="/focus" className="group card card-interactive hover:border-primary">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Brain size={24} className="text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-on-surface">Start Focus Timer</h3>
                                <p className="text-xs text-on-surface-secondary">25-minute session</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/forum" className="group card card-interactive hover:border-secondary">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <MessageSquare size={24} className="text-secondary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-on-surface">Browse Community</h3>
                                <p className="text-xs text-on-surface-secondary">{totalPostsCount || 0} discussions</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/reminders" className="group card card-interactive hover:border-accent">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Bell size={24} className="text-accent" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-on-surface">Set Reminder</h3>
                                <p className="text-xs text-on-surface-secondary">Stay on track</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Today's Schedule & Progress */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 animate-stagger-7">
                {/* Today's Sessions - Hidden on mobile (shown above), visible on desktop */}
                <div className="hidden xl:block xl:col-span-2 card">
                    <div className="flex items-center gap-2 mb-6">
                        <Clock size={20} className="text-primary" />
                        <h2 className="text-xl font-semibold text-on-surface">Today's Focus Sessions</h2>
                    </div>

                    {recentSessions.length > 0 ? (
                        <div className="space-y-4">
                            {recentSessions.map((session, index) => {
                                const completedTime = new Date(session.completed_at)
                                const durationMinutes = session.duration_minutes

                                return (
                                    <div key={index} className="p-4 bg-backplate rounded-lg border border-border">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-on-surface">Focus Session</span>
                                            <span className="text-xs text-on-surface-secondary">
                                                {completedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="text-sm text-on-surface-secondary">{durationMinutes} minutes completed ✓</div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Clock size={48} className="mx-auto text-neutral-medium mb-4 opacity-50" />
                            <p className="text-on-surface-secondary mb-4">No focus sessions today yet</p>
                            <Link href="/focus" className="btn btn-primary inline-flex items-center gap-2">
                                <Brain size={18} />
                                Start Your First Session
                            </Link>
                        </div>
                    )}
                </div>

                {/* Achievements */}
                <div className="space-y-6">
                    {milestoneProgress.milestone ? (
                        <div className="card bg-linear-to-br from-primary to-secondary border-primary">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl">{milestoneProgress.milestone.badge_icon || '🏆'}</span>
                                <h3 className="font-semibold">Next Milestone</h3>
                            </div>
                            <h4 className="text-base font-semibold text-neutral-medium mb-2">
                                {milestoneProgress.milestone.title}
                            </h4>
                            <p className="text-sm text-neutral-medium font-medium mb-4">
                                {milestoneProgress.milestone.description || 'Complete this milestone to unlock the achievement!'}
                            </p>
                            <AnimatedProgressBar
                                value={milestoneProgress.progressPercentage}
                                max={100}
                                color="secondary"
                                showShimmer={milestoneProgress.progressPercentage > 0}
                                height="sm"
                            />
                            <p className="text-xs text-neutral-medium font-medium mt-2">
                                {milestoneProgress.totalSessions} / {milestoneProgress.milestone.session_threshold} sessions
                                {milestoneProgress.sessionsToGo > 0 && ` (${milestoneProgress.sessionsToGo} to go!)`}
                            </p>
                        </div>
                    ) : milestoneProgress.totalMilestones > 0 ? (
                        <div className="card bg-linear-to-br from-primary to-secondary border-primary">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl">👑</span>
                                <h3 className="font-semibold">All Milestones Complete!</h3>
                            </div>
                            <p className="text-sm text-neutral-medium font-medium">
                                Amazing! You've unlocked all {milestoneProgress.totalMilestones} achievements. Keep up the great work!
                            </p>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl">🎯</span>
                                <h3 className="font-semibold text-on-surface">Milestones</h3>
                            </div>
                            <p className="text-sm text-on-surface-secondary">
                                No milestones available yet. Keep completing focus sessions — achievements are coming soon!
                            </p>
                        </div>
                    )}

                    {/* Recent Achievements */}
                    {recentAchievements.length > 0 && (
                        <div className="card">
                            <h3 className="font-semibold text-on-surface mb-4">Recent Achievements</h3>
                            <div className="space-y-3">
                                {recentAchievements.map((achievement) => (
                                    <div key={achievement.id} className="flex items-center gap-3 p-2 rounded-lg bg-backplate">
                                        <span className="text-2xl">{achievement.milestones?.badge_icon || '🏆'}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-on-surface truncate">
                                                {achievement.milestones?.title}
                                            </p>
                                            <p className="text-xs text-on-surface-secondary">
                                                {new Date(achievement.unlocked_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="card">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">💡</span>
                            <h3 className="font-semibold text-on-surface">
                                {randomTip?.title || 'Quick Tip'}
                            </h3>
                            {randomTip?.category && (
                                <span className="badge badge-neutral text-xs capitalize ml-auto">
                                    {randomTip.category}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-on-surface leading-relaxed">
                            {randomTip?.content || '💡 Start your day with a 5-minute focus session to build momentum. Small wins lead to big progress!'}
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

