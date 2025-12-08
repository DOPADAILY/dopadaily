import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import FocusPageClient from './FocusPageClient'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'

export default async function FocusPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile with user preferences for timer initialization
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, default_focus_duration, default_break_duration')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="h-16 border-b border-border bg-surface-elevated/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
          <MobileMenuButton />
          <div className="flex-1">
            <h1 className="text-base sm:text-lg font-bold text-on-surface">Focus Timer</h1>
            <p className="text-on-surface-secondary text-xs hidden sm:block">Stay present. Work deeply.</p>
          </div>
          <UserMenu email={user.email} username={profile?.username} />
        </div>
      </header>

      <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <FocusPageClient
          initialFocusDuration={profile?.default_focus_duration || 25}
          initialBreakDuration={profile?.default_break_duration || 5}
        />
      </div>
    </div>
  )
}
