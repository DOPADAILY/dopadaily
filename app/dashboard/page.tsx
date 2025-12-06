import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Brain } from 'lucide-react'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Don't redirect if there's a network issue - show error state instead
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  let networkIssue = cookieStore.get('network-issue')?.value === 'true'

  let user = null
  try {
    const { data, error: authError } = await supabase.auth.getUser()
    user = data?.user || null

    // Check if auth error is network-related (match all errors handled by middleware)
    if (authError) {
      const msg = authError.message || ''
      if (
        msg.includes('fetch failed') ||
        msg.includes('ENOTFOUND') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('ETIMEDOUT')
      ) {
        networkIssue = true
      }
    }
  } catch (error: any) {
    // Network error thrown as exception (match all errors handled by middleware)
    const msg = error?.message || error?.cause?.message || ''
    const code = error?.cause?.code
    if (
      msg.includes('fetch failed') ||
      msg.includes('ENOTFOUND') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('ETIMEDOUT') ||
      code === 'ENOTFOUND' ||
      code === 'ECONNREFUSED' ||
      code === 'ETIMEDOUT'
    ) {
      networkIssue = true
    } else {
      console.error('[Dashboard] Unexpected auth error:', error)
    }
  }

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

  // Only fetch profile for header - dashboard data is fetched client-side with TanStack Query
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

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
        <DashboardClient userId={user.id} userEmail={user.email || ''} />
      </div>
    </div>
  )
}
