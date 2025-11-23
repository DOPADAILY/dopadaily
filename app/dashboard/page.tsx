import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Brain, MessageSquare, Bell, TrendingUp, Clock, Award } from 'lucide-react'
import StatCard from '@/components/StatCard'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'
import { getNextMilestone, getUserAchievements } from '@/utils/milestones'
import ReminderNotifications from '@/components/ReminderNotifications'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // Don't redirect if there's a network issue - show error state instead
  const { cookies } = await import('next/headers')
  const networkIssue = (await cookies()).get('network-issue')?.value === 'true'

  if (!user && !networkIssue) {
    redirect('/login')
  }

  // If network issue, show a simplified error state
  if (networkIssue && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="card text-center p-8 max-w-md">
          <Brain size={48} className="text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-on-surface mb-2">Connection Issue</h2>
          <p className="text-on-surface-secondary mb-4">
            We're having trouble connecting to the server. Your session is still active. The page will automatically retry when your connection is restored.
          </p>
          <Link href="/dashboard" className="btn btn-primary">
            Retry Now
          </Link>
        </div>
      </div>
    )
  }

  // Type guard: At this point user must exist (would have redirected or returned above)
  if (!user) {
    return null // This should never execute, but satisfies TypeScript
  }

  // Get user profile with preferences
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, daily_goal')
    .eq('id', user.id)
    .single()

  // Get today's focus sessions
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const { data: todaySessions, count: todaySessionCount } = await supabase
    .from('focus_sessions')
    .select('duration_minutes', { count: 'exact' })
    .eq('user_id', user.id)
    .gte('completed_at', startOfToday.toISOString())

  // Calculate today's total time in minutes
  const todayTotalMinutes = Math.round(todaySessions?.reduce((sum, session) => sum + session.duration_minutes, 0) || 0)

  // Get this week's sessions
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const { data: weekSessions } = await supabase
    .from('focus_sessions')
    .select('duration_minutes')
    .eq('user_id', user.id)
    .gte('completed_at', startOfWeek.toISOString())

  const weekTotalMinutes = weekSessions?.reduce((sum, session) => sum + session.duration_minutes, 0) || 0
  const weekTotalHours = Math.floor(weekTotalMinutes / 60)
  const weekRemainingMinutes = Math.round(weekTotalMinutes % 60)

  // Get user's forum posts count
  const { count: userPostsCount } = await supabase
    .from('forum_posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get total community posts
  const { count: totalPostsCount } = await supabase
    .from('forum_posts')
    .select('*', { count: 'exact', head: true })

  // Calculate streak (consecutive days with at least 1 session)
  const { data: allSessions } = await supabase
    .from('focus_sessions')
    .select('completed_at')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })

  let streak = 0
  if (allSessions && allSessions.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sessionDates = new Set(
      allSessions.map(s => {
        const date = new Date(s.completed_at)
        date.setHours(0, 0, 0, 0)
        return date.getTime()
      })
    )

    // Check if user has session today or yesterday (to not break streak)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let currentDate: Date
    if (sessionDates.has(today.getTime())) {
      currentDate = new Date(today)
      streak = 1
    } else if (sessionDates.has(yesterday.getTime())) {
      currentDate = new Date(yesterday)
      streak = 1
    } else {
      // No recent sessions, streak is 0
      currentDate = new Date(0)
    }

    // Count consecutive days backwards
    if (streak > 0) {
      currentDate.setDate(currentDate.getDate() - 1)
      while (sessionDates.has(currentDate.getTime())) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      }
    }
  }

  // Get recent sessions for "Today's Focus Goals"
  const { data: recentSessions } = await supabase
    .from('focus_sessions')
    .select('completed_at, duration_minutes')
    .eq('user_id', user.id)
    .gte('completed_at', startOfToday.toISOString())
    .order('completed_at', { ascending: false })
    .limit(5)

  // Get real milestone progress
  const milestoneProgress = await getNextMilestone(user.id)

  // Get recent achievements (last 3)
  const recentAchievements = await getUserAchievements(user.id)

  // Get random daily tip
  const { data: allTips } = await supabase
    .from('daily_tips')
    .select('title, content, category')
    .eq('is_active', true)

  // Select a random tip (or use date-based selection for consistency)
  const randomTip = allTips && allTips.length > 0
    ? allTips[Math.floor(Math.random() * allTips.length)]
    : null

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="h-16 border-b border-border bg-surface-elevated sticky top-0 z-20">
        <div className="h-full  mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
          <MobileMenuButton />
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold text-on-surface truncate">
              Welcome back, {profile?.username || user.email?.split('@')[0] || 'Friend'}!
            </h1>
            <p className="text-on-surface-secondary text-xs hidden sm:block">Here's your wellness overview</p>
          </div>
          <UserMenu email={user.email} username={profile?.username} />
        </div>
      </header>

      <div className=" mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">

        {/* Reminder Notifications */}
        <div className="mb-6">
          <ReminderNotifications userId={user.id} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <StatCard
            label="Focus Sessions Today"
            value={`${todaySessionCount || 0} / ${profile?.daily_goal || 8}`}
            change={todaySessionCount ? `${todayTotalMinutes} minutes` : 'Start your first session!'}
            changeType={todaySessionCount && todaySessionCount >= (profile?.daily_goal || 8) ? 'positive' : 'neutral'}
          />
          <StatCard
            label="Total Time This Week"
            value={weekTotalHours > 0 ? `${weekTotalHours}h ${weekRemainingMinutes}m` : `${weekTotalMinutes}m`}
            change={weekSessions && weekSessions.length > 0 ? `${weekSessions.length} sessions` : 'Time to focus'}
            changeType={weekSessions && weekSessions.length > 0 ? 'positive' : 'neutral'}
          />
          <StatCard
            label="Your Posts"
            value={`${userPostsCount || 0}`}
            change={`${totalPostsCount || 0} total community posts`}
            changeType="neutral"
          />
          <StatCard
            label="Current Streak"
            value={`${streak} ${streak === 1 ? 'day' : 'days'}`}
            change={streak > 0 ? 'Keep it going! 🔥' : 'Start today!'}
            changeType={streak > 0 ? 'positive' : 'neutral'}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-on-surface mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">

            <Link href="/focus" className="group card hover:border-primary transition-all hover:shadow-md">
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

            <Link href="/forum" className="group card hover:border-secondary transition-all hover:shadow-md">
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

            <Link href="/reminders" className="group card hover:border-accent transition-all hover:shadow-md">
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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">

          {/* Today's Sessions */}
          <div className="xl:col-span-2 card">
            <div className="flex items-center gap-2 mb-6">
              <Clock size={20} className="text-primary" />
              <h2 className="text-xl font-semibold text-on-surface">Today's Focus Sessions</h2>
            </div>

            {recentSessions && recentSessions.length > 0 ? (
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
                <div className="h-2 bg-neutral-medium/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neutral-medium transition-all duration-500"
                    style={{ width: `${milestoneProgress.progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-neutral-medium font-medium mt-2">
                  {milestoneProgress.totalSessions} / {milestoneProgress.milestone.session_threshold} sessions
                  {milestoneProgress.sessionsToGo > 0 && ` (${milestoneProgress.sessionsToGo} to go!)`}
                </p>
              </div>
            ) : (
              <div className="card bg-linear-to-br from-primary to-secondary border-primary">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">👑</span>
                  <h3 className="font-semibold">All Milestones Complete!</h3>
                </div>
                <p className="text-sm text-neutral-medium font-medium">
                  Amazing! You've unlocked all available achievements. Keep up the great work!
                </p>
              </div>
            )}

            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-on-surface mb-4">Recent Achievements</h3>
                <div className="space-y-3">
                  {recentAchievements.slice(0, 3).map((achievement: any) => (
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

      </div>
    </div>
  )
}
