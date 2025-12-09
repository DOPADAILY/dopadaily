import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { TrendingUp, Users, Target, MessageSquare, Clock, Award, Calendar, BarChart3, ArrowLeft } from 'lucide-react'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'
import StatCard from '@/components/StatCard'

export default async function AdminStatsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        redirect('/dashboard')
    }

    // Date ranges
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // User Stats
    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    const { count: newUsersToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfToday.toISOString())

    const { count: newUsersWeek } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfWeek.toISOString())

    const { count: newUsersMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())

    // Session Stats
    const { count: totalSessions } = await supabase
        .from('focus_sessions')
        .select('*', { count: 'exact', head: true })

    const { count: sessionsToday } = await supabase
        .from('focus_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('started_at', startOfToday.toISOString())

    const { count: sessionsWeek } = await supabase
        .from('focus_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('started_at', startOfWeek.toISOString())

    const { count: sessionsMonth } = await supabase
        .from('focus_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('started_at', startOfMonth.toISOString())

    // Forum Stats
    const { count: totalPosts } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })

    const { count: postsToday } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfToday.toISOString())

    const { count: postsWeek } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfWeek.toISOString())

    const { count: postsMonth } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())

    const { count: totalComments } = await supabase
        .from('forum_comments')
        .select('*', { count: 'exact', head: true })

    const { count: totalReactions } = await supabase
        .from('post_reactions')
        .select('*', { count: 'exact', head: true })

    // Tips Stats
    const { count: totalTips } = await supabase
        .from('daily_tips')
        .select('*', { count: 'exact', head: true })

    const { count: activeTips } = await supabase
        .from('daily_tips')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

    // Milestone Stats
    const { count: totalMilestones } = await supabase
        .from('milestones')
        .select('*', { count: 'exact', head: true })

    const { count: activeMilestones } = await supabase
        .from('milestones')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="h-16 border-b border-border bg-surface-elevated sticky top-0 z-20">
                <div className="h-full  mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
                    <MobileMenuButton />
                    <div className="min-w-0 flex-1">
                        <h1 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
                            <BarChart3 size={20} className="text-primary" />
                            Platform Statistics
                        </h1>
                        <p className="text-on-surface-secondary text-xs hidden sm:block">
                            Detailed analytics and insights
                        </p>
                    </div>
                    <UserMenu email={user.email} username={profile?.username} />
                </div>
            </header>

            <div className=" mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
                {/* Back Button */}
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 text-on-surface-secondary hover:text-on-surface transition-colors mb-6"
                >
                    <ArrowLeft size={16} />
                    Back to Admin Dashboard
                </Link>

                {/* User Growth */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-2">
                        <Users size={24} className="text-primary" />
                        User Growth
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                        <StatCard
                            label="Total Users"
                            value={`${totalUsers || 0}`}
                            change="All time"
                            changeType="neutral"
                        />
                        <StatCard
                            label="Today"
                            value={`+${newUsersToday || 0}`}
                            change="New signups"
                            changeType={newUsersToday ? 'positive' : 'neutral'}
                        />
                        <StatCard
                            label="This Week"
                            value={`+${newUsersWeek || 0}`}
                            change="Last 7 days"
                            changeType={newUsersWeek ? 'positive' : 'neutral'}
                        />
                        <StatCard
                            label="This Month"
                            value={`+${newUsersMonth || 0}`}
                            change="Last 30 days"
                            changeType={newUsersMonth ? 'positive' : 'neutral'}
                        />
                    </div>
                </div>

                {/* Focus Sessions */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-2">
                        <Clock size={24} className="text-accent" />
                        Focus Sessions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                        <StatCard
                            label="Total Sessions"
                            value={`${totalSessions || 0}`}
                            change="All time"
                            changeType="neutral"
                        />
                        <StatCard
                            label="Today"
                            value={`${sessionsToday || 0}`}
                            change="Completed today"
                            changeType={sessionsToday ? 'positive' : 'neutral'}
                        />
                        <StatCard
                            label="This Week"
                            value={`${sessionsWeek || 0}`}
                            change="Last 7 days"
                            changeType={sessionsWeek ? 'positive' : 'neutral'}
                        />
                        <StatCard
                            label="This Month"
                            value={`${sessionsMonth || 0}`}
                            change="Last 30 days"
                            changeType={sessionsMonth ? 'positive' : 'neutral'}
                        />
                    </div>
                </div>

                {/* Community Engagement */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-2">
                        <MessageSquare size={24} className="text-secondary" />
                        Community Engagement
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                        <StatCard
                            label="Total Posts"
                            value={`${totalPosts || 0}`}
                            change="All discussions"
                            changeType="neutral"
                        />
                        <StatCard
                            label="Today"
                            value={`+${postsToday || 0}`}
                            change="New posts"
                            changeType={postsToday ? 'positive' : 'neutral'}
                        />
                        <StatCard
                            label="This Week"
                            value={`+${postsWeek || 0}`}
                            change="Last 7 days"
                            changeType={postsWeek ? 'positive' : 'neutral'}
                        />
                        <StatCard
                            label="This Month"
                            value={`+${postsMonth || 0}`}
                            change="Last 30 days"
                            changeType={postsMonth ? 'positive' : 'neutral'}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mt-6">
                        <div className="card bg-linear-to-br from-secondary/10 to-secondary/5 border-secondary/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-on-surface-secondary mb-1">Total Comments</p>
                                    <p className="text-3xl font-bold text-on-surface">{totalComments || 0}</p>
                                    <p className="text-xs text-on-surface-secondary mt-1">Across all posts</p>
                                </div>
                                <div className="w-16 h-16 rounded-lg bg-secondary/20 flex items-center justify-center">
                                    <MessageSquare size={32} className="text-secondary" />
                                </div>
                            </div>
                        </div>

                        <div className="card bg-linear-to-br from-error/10 to-error/5 border-error/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-on-surface-secondary mb-1">Total Reactions</p>
                                    <p className="text-3xl font-bold text-on-surface">{totalReactions || 0}</p>
                                    <p className="text-xs text-on-surface-secondary mt-1">Post likes</p>
                                </div>
                                <div className="w-16 h-16 rounded-lg bg-error/20 flex items-center justify-center">
                                    <Target size={32} className="text-error" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content & Engagement Metrics */}
                <div>
                    <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-2">
                        <Award size={24} className="text-success" />
                        Content & Engagement
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                        <div className="card bg-linear-to-br from-success/10 to-success/5 border-success/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-on-surface-secondary mb-1">Milestones</p>
                                    <p className="text-3xl font-bold text-on-surface">{totalMilestones || 0}</p>
                                    <p className="text-xs text-success mt-1">{activeMilestones || 0} active</p>
                                </div>
                                <div className="w-16 h-16 rounded-lg bg-success/20 flex items-center justify-center">
                                    <Award size={32} className="text-success" />
                                </div>
                            </div>
                        </div>

                        <div className="card bg-linear-to-br from-accent/10 to-accent/5 border-accent/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-on-surface-secondary mb-1">Daily Tips</p>
                                    <p className="text-3xl font-bold text-on-surface">{totalTips || 0}</p>
                                    <p className="text-xs text-accent mt-1">{activeTips || 0} active</p>
                                </div>
                                <div className="w-16 h-16 rounded-lg bg-accent/20 flex items-center justify-center">
                                    <TrendingUp size={32} className="text-accent" />
                                </div>
                            </div>
                        </div>

                        <div className="card bg-linear-to-br from-primary/10 to-primary/5 border-primary/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-on-surface-secondary mb-1">Total Content</p>
                                    <p className="text-3xl font-bold text-on-surface">
                                        {(totalPosts || 0) + (totalTips || 0)}
                                    </p>
                                    <p className="text-xs text-on-surface-secondary mt-1">Posts + Tips</p>
                                </div>
                                <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center">
                                    <TrendingUp size={32} className="text-primary" />
                                </div>
                            </div>
                        </div>

                        <div className="card bg-linear-to-br from-secondary/10 to-secondary/5 border-secondary/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-on-surface-secondary mb-1">Avg Sessions</p>
                                    <p className="text-3xl font-bold text-on-surface">
                                        {totalUsers && totalSessions ? Math.round(totalSessions / totalUsers) : 0}
                                    </p>
                                    <p className="text-xs text-on-surface-secondary mt-1">Per user</p>
                                </div>
                                <div className="w-16 h-16 rounded-lg bg-secondary/20 flex items-center justify-center">
                                    <BarChart3 size={32} className="text-secondary" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

