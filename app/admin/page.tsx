import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Users, Award, Bell, MessageSquare, TrendingUp, Settings, FileText, ShieldCheck } from 'lucide-react'
import StatCard from '@/components/StatCard'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'

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

  // Get global reminders count
  const { count: globalReminders } = await supabase
    .from('reminders')
    .select('*', { count: 'exact', head: true })
    .eq('is_global', true)

  // Get recent admin activity
  const { data: recentAudit } = await supabase
    .from('admin_audit_log')
    .select('*, profiles(username)')
    .order('created_at', { ascending: false })
    .limit(10)

  // Get today's new users
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const { count: newUsersToday } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfToday.toISOString())

  return (
    <div className="min-h-screen bg-background">
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <StatCard
            label="Total Users"
            value={`${totalUsers || 0}`}
            change={newUsersToday ? `+${newUsersToday} today` : 'No new users today'}
            changeType={newUsersToday ? 'positive' : 'neutral'}
          />
          <StatCard
            label="Total Sessions"
            value={`${totalSessions || 0}`}
            change="All-time completions"
            changeType="neutral"
          />
          <StatCard
            label="Forum Posts"
            value={`${totalPosts || 0}`}
            change="Community discussions"
            changeType="neutral"
          />
          <StatCard
            label="Active Milestones"
            value={`${activeMilestones || 0}`}
            change={`${globalReminders || 0} global reminders`}
            changeType="neutral"
          />
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
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          <div className="xl:col-span-2 card">
            <h2 className="text-xl font-semibold text-on-surface mb-6">Recent Admin Activity</h2>
            {recentAudit && recentAudit.length > 0 ? (
              <div className="space-y-3">
                {recentAudit.map((log) => (
                  <div key={log.id} className="p-4 bg-backplate rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-on-surface text-sm">{log.action}</span>
                      <span className="text-xs text-on-surface-secondary">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-secondary">
                      By: {log.profiles?.username || 'Admin'}
                      {log.target_table && ` • ${log.target_table}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp size={48} className="mx-auto text-neutral-medium mb-4 opacity-50" />
                <p className="text-on-surface-secondary">No recent admin activity</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card bg-linear-to-br from-primary to-secondary border-primary">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={20} className="text-on-surface" />
                <h3 className="font-semibold">Admin Tools</h3>
              </div>
              <p className="text-sm text-on-surface font-medium mb-4">
                Manage your Calm Focus platform with powerful admin tools.
              </p>
              <Link href="/dashboard" className="text-xs text-on-surface font-medium hover:underline">
                ← Back to User Dashboard
              </Link>
            </div>

            <div className="card">
              <h3 className="font-semibold text-on-surface mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-secondary">Total Users</span>
                  <span className="text-sm font-semibold text-on-surface">{totalUsers || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-secondary">Total Posts</span>
                  <span className="text-sm font-semibold text-on-surface">{totalPosts || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-secondary">Active Milestones</span>
                  <span className="text-sm font-semibold text-on-surface">{activeMilestones || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-secondary">Global Reminders</span>
                  <span className="text-sm font-semibold text-on-surface">{globalReminders || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

