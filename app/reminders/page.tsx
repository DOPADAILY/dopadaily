import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Bell, Plus } from 'lucide-react'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'
import RemindersClient from './RemindersClient'

export default async function RemindersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Only fetch profile for header - reminders are fetched client-side with TanStack Query
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen">

      {/* Header */}
      <header className="h-16 border-b border-border bg-surface-elevated/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="h-full  mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
          <MobileMenuButton />
          <div className="flex-1">
            <h1 className="text-base sm:text-lg font-bold text-on-surface">Reminders</h1>
            <p className="text-on-surface-secondary text-xs hidden sm:block">Stay on track with your goals and habits</p>
          </div>
          <UserMenu email={user.email} username={profile?.username} />
        </div>
      </header>

      <div className=" mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">

          {/* Reminders List */}
          <div className="xl:col-span-2 space-y-6">
            <RemindersClient 
              userId={user.id}
              isAdmin={profile?.role === 'admin'}
            />
          </div>

          {/* Create Reminder Sidebar - Desktop Only */}
          <div className="hidden xl:block">
            <div className="card h-fit sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell size={20} className="text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-on-surface">Create Reminder</h2>
              </div>

              <form action={async (formData: FormData) => {
                'use server'
                const { createReminder } = await import('./actions')
                await createReminder(formData)
              }} className="space-y-5">

                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Title</label>
                  <input
                    name="title"
                    required
                    placeholder="e.g., Drink water"
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Message (Optional)</label>
                  <textarea
                    name="message"
                    rows={3}
                    placeholder="Additional details..."
                    className="input w-full min-h-[80px] py-3 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Date & Time</label>
                  <input
                    name="date"
                    type="datetime-local"
                    required
                    className="input w-full"
                  />
                </div>

                {profile?.role === 'admin' && (
                  <div className="p-3 bg-backplate rounded-lg border border-border">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isGlobal"
                        id="isGlobal"
                        className="mt-0.5 rounded text-primary"
                      />
                      <div className="text-sm">
                        <span className="font-semibold text-on-surface block mb-1">Send to all users</span>
                        <span className="text-xs text-on-surface-secondary">Community-wide wellness reminder</span>
                      </div>
                    </label>
                  </div>
                )}

                <button className="btn btn-primary w-full">
                  <Plus size={18} />
                  Create Reminder
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
