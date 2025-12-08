import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Users, Award, Bell, TrendingUp, FileText, ShieldCheck, Music } from 'lucide-react'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'
import ActivityLog from './ActivityLog'

export default async function AdminDashboard() {
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

  // Get total users count
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Get total sessions count
  const { count: totalSessions } = await supabase
    .from('focus_sessions')
    .select('*', { count: 'exact', head: true })

  // Get total forum posts
  const { count: totalPosts } = await supabase
    .from('forum_posts')
    .select('*', { count: 'exact', head: true })

  // Get active milestones count
  const { count: activeMilestones } = await supabase
    .from('milestones')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Get tips count
  const { count: totalTips } = await supabase
    .from('daily_tips')
    .select('*', { count: 'exact', head: true })

  // Get recent admin activity (fetch 50 for the activity log)
  const { data: recentAudit } = await supabase
    .from('admin_audit_log')
    .select('*, profiles(username)')
    .order('created_at', { ascending: false })
    .limit(50)

  // Get today's new users
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const { count: newUsersToday } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfToday.toISOString())

  // Get banned users count
  const { count: bannedUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_banned', true)

  // Get admin users count
  const { count: adminUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin')

  // Get today's posts count
  const { count: postsToday } = await supabase
    .from('forum_posts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfToday.toISOString())

  // Get today's sessions count
  const { count: sessionsToday } = await supabase
    .from('focus_sessions')
    .select('*', { count: 'exact', head: true })
    .gte('started_at', startOfToday.toISOString())

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="h-16 border-b border-border bg-surface-elevated sticky top-0 z-20">
        <div className="h-full  mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
          <MobileMenuButton />
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <ShieldCheck size={20} className="text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-on-surface-secondary text-xs hidden sm:block">System management and analytics</p>
          </div>
          <UserMenu email={user.email} username={profile?.username} />
        </div>
      </header>

      <div className=" mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        {/* Simplified Stats - Single Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <p className="text-xs text-on-surface-secondary mb-1">Users</p>
            <p className="text-2xl font-bold text-on-surface mb-1">{totalUsers || 0}</p>
            <div className="flex items-center gap-1 text-xs">
              {bannedUsers ? (
                <span className="text-error">{bannedUsers} banned</span>
              ) : (
                <span className="text-success">All active</span>
              )}
              {adminUsers && adminUsers > 1 && (
                <>
                  <span className="text-on-surface-secondary">•</span>
                  <span className="text-primary">{adminUsers} admins</span>
                </>
              )}
            </div>
          </div>

          <div className="card">
            <p className="text-xs text-on-surface-secondary mb-1">Sessions</p>
            <p className="text-2xl font-bold text-on-surface mb-1">{totalSessions || 0}</p>
            <p className="text-xs text-on-surface-secondary">
              {sessionsToday ? `${sessionsToday} today` : 'None today'}
            </p>
          </div>

          <div className="card">
            <p className="text-xs text-on-surface-secondary mb-1">Posts</p>
            <p className="text-2xl font-bold text-on-surface mb-1">{totalPosts || 0}</p>
            <p className="text-xs text-on-surface-secondary">
              {postsToday ? `+${postsToday} today` : 'None today'}
            </p>
          </div>

          <div className="card">
            <p className="text-xs text-on-surface-secondary mb-1">Content</p>
            <p className="text-2xl font-bold text-on-surface mb-1">{(totalPosts || 0) + (totalTips || 0)}</p>
            <p className="text-xs text-on-surface-secondary">
              {totalPosts || 0} posts, {totalTips || 0} tips
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-on-surface mb-4">Admin Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
            <Link href="/admin/milestones" className="group card hover:border-primary transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Award size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-on-surface">Milestones</h3>
                  <p className="text-xs text-on-surface-secondary">Manage achievements</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/users" className="group card hover:border-secondary transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users size={24} className="text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-on-surface">Users</h3>
                  <p className="text-xs text-on-surface-secondary">Manage users</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/reminders" className="group card hover:border-accent transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bell size={24} className="text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-on-surface">Reminders</h3>
                  <p className="text-xs text-on-surface-secondary">Global reminders</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/content" className="group card hover:border-primary transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-on-surface">Content</h3>
                  <p className="text-xs text-on-surface-secondary">Tips & moderation</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/sounds" className="group card hover:border-secondary transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Music size={24} className="text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-on-surface">Sounds</h3>
                  <p className="text-xs text-on-surface-secondary">Ambient sounds library</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity - Now using the ActivityLog component */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          <div className="xl:col-span-2">
            <ActivityLog initialLogs={recentAudit || []} />
          </div>

          <div className="space-y-6">
            <div className="card bg-linear-to-br from-primary/10 to-secondary/10 border-primary/30">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={20} className="text-primary" />
                <h3 className="font-semibold text-on-surface">Today's Activity</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-secondary">New Users</span>
                  <span className="text-lg font-bold text-on-surface">{newUsersToday || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-secondary">Sessions</span>
                  <span className="text-lg font-bold text-on-surface">{sessionsToday || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-secondary">New Posts</span>
                  <span className="text-lg font-bold text-on-surface">{postsToday || 0}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
                <Link 
                  href="/admin/stats" 
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                  <TrendingUp size={16} />
                  View Detailed Stats
                </Link>
                <Link href="/dashboard" className="text-sm text-center text-on-surface-secondary hover:text-primary transition-colors">
                  ← Back to User Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

