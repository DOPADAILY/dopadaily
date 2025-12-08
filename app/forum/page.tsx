import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'
import ForumClient from './ForumClient'

export default async function ForumPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile and community stats for header (lightweight server-side data)
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()

  const [
    profileResult,
    { count: totalMembers },
    { count: totalDiscussions },
    { data: postsToday },
    { data: commentsToday },
    { data: reactionsToday }
  ] = await Promise.all([
    supabase.from('profiles').select('username').eq('id', user.id).single(),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('forum_posts').select('*', { count: 'exact', head: true }),
    supabase.from('forum_posts').select('user_id').gte('created_at', startOfToday),
    supabase.from('forum_comments').select('user_id').gte('created_at', startOfToday),
    supabase.from('post_reactions').select('user_id').gte('created_at', startOfToday)
  ])

  const profile = profileResult.data

  // Count unique users who were active today
  const activeUserIds = new Set([
    ...(postsToday?.map(p => p.user_id) || []),
    ...(commentsToday?.map(c => c.user_id) || []),
    ...(reactionsToday?.map(r => r.user_id) || [])
  ])
  const activeToday = activeUserIds.size

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="h-16 border-b border-border bg-surface-elevated/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
          <MobileMenuButton />
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-on-surface">Community</h1>
            <p className="text-on-surface-secondary text-xs hidden sm:block">Connect, share, and support each other</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/forum/new" className="btn btn-primary text-sm px-3 py-2 sm:px-4">
              <Plus size={18} className="sm:hidden" />
              <span className="hidden sm:inline">New Discussion</span>
            </Link>
            <UserMenu email={user.email} username={profile?.username} />
          </div>
        </div>
      </header>

      <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <ForumClient 
          totalMembers={totalMembers || 0}
          totalDiscussions={totalDiscussions || 0}
          activeToday={activeToday}
        />
      </div>
    </div>
  )
}
