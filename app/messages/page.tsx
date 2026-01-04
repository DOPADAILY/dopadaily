import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'
import { MessageCircle } from 'lucide-react'
import MessagesClient from './MessagesClient'

export default async function MessagesPage() {
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

  // Redirect admins to admin messages page
  if (profile?.role === 'admin' || profile?.role === 'super_admin') {
    redirect('/admin/messages')
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
              Messages
            </h1>
            <p className="text-on-surface-secondary text-xs hidden sm:block">
              Chat with admins
            </p>
          </div>
          <UserMenu email={user.email} username={profile?.username} />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1">
        <MessagesClient userId={user.id} />
      </div>
    </div>
  )
}
