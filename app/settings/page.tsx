import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get username for header - full profile is fetched client-side with TanStack Query
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="h-16 lg:border-b border-border lg:bg-surface-elevated/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
          <MobileMenuButton />
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-on-surface">Settings</h1>
            <p className="text-on-surface-secondary text-xs hidden sm:block">Manage your account and preferences</p>
          </div>
          <UserMenu email={user.email} username={profile?.username} />
        </div>
      </header>

      <SettingsClient userEmail={user.email || ''} />
    </div>
  )
}
