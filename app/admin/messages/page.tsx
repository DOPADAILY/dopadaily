import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'
import BackButton from '@/components/BackButton'
import { MessageCircle } from 'lucide-react'
import AdminMessagesClient from './AdminMessagesClient'

export default async function AdminMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile and verify admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border bg-surface-elevated sticky top-0 z-20">
        <div className="h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
          <MobileMenuButton />
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <MessageCircle size={20} className="text-primary" />
              Admin Messages
            </h1>
            <p className="text-on-surface-secondary text-xs hidden sm:block">
              Manage user conversations
            </p>
          </div>
          <UserMenu email={user.email} username={profile?.username} />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1">
        <AdminMessagesClient userId={user.id} />
      </div>
    </div>
  )
}
