import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Brain, MessageSquare, Bell, TrendingUp, Clock, Award } from 'lucide-react'
import StatCard from '@/components/StatCard'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile for username
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  // Get today's focus sessions
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const { data: todaySessions, count: todaySessionCount } = await supabase
    .from('focus_sessions')
    .select('duration_seconds', { count: 'exact' })
    .eq('user_id', user.id)
    .gte('completed_at', startOfToday.toISOString())

  // Calculate today's total time in minutes
  const todayTotalMinutes = Math.round(todaySessions?.reduce((sum, session) => sum + (session.duration_seconds / 60), 0) || 0)

  // Get this week's sessions
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const { data: weekSessions } = await supabase
    .from('focus_sessions')
    .select('duration_seconds')
    .eq('user_id', user.id)
    .gte('completed_at', startOfWeek.toISOString())

  const weekTotalHours = Math.floor((weekSessions?.reduce((sum, session) => sum + (session.duration_seconds / 60), 0) || 0) / 60)
  const weekTotalMinutes = Math.round((weekSessions?.reduce((sum, session) => sum + (session.duration_seconds / 60), 0) || 0) % 60)

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
    .select('completed_at, duration_seconds')
    .eq('user_id', user.id)
    .gte('completed_at', startOfToday.toISOString())
    .order('completed_at', { ascending: false })
    .limit(5)

  // Calculate milestone progress (every 5 sessions)
  const totalSessions = allSessions?.length || 0
  const currentMilestone = Math.floor(totalSessions / 5) * 5
  const nextMilestone = currentMilestone + 5
  const progressToNextMilestone = totalSessions - currentMilestone
  const progressPercentage = (progressToNextMilestone / 5) * 100

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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <StatCard
            label="Focus Sessions Today"
            value={`${todaySessionCount || 0}`}
            change={todaySessionCount ? `${todayTotalMinutes} minutes` : 'Start your first session!'}
            changeType={todaySessionCount ? 'positive' : 'neutral'}
          />
          <StatCard
            label="Total Time This Week"
            value={weekTotalHours > 0 ? `${weekTotalHours}h ${weekTotalMinutes}m` : `${weekTotalMinutes}m`}
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
                  const durationMinutes = Math.round(session.duration_seconds / 60)

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
            <div className="card bg-linear-to-br from-primary to-secondary border-primary">
              <div className="flex items-center gap-2 mb-4">
                <Award size={20} className="text-on-surface" />
                <h3 className="font-semibold">Next Milestone</h3>
              </div>
              <p className="text-sm text-on-surface font-medium mb-4">
                Complete {nextMilestone} focus sessions to unlock your {nextMilestone === 5 ? 'first' : 'next'} achievement!
              </p>
              <div className="h-2 bg-on-surface/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-on-surface transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-on-surface font-medium mt-2">{progressToNextMilestone} / 5 sessions</p>
            </div>

            <div className="card">
              <h3 className="font-semibold text-on-surface mb-4">Quick Tip</h3>
              <p className="text-sm text-on-surface leading-relaxed">
                💡 Start your day with a 5-minute focus session to build momentum. Small wins lead to big progress!
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
