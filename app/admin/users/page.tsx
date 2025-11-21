'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users as UsersIcon, ShieldCheck, Shield, Ban, CheckCircle, Search } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'
import BackButton from '@/components/BackButton'
import UserAvatar from '@/components/UserAvatar'
import ConfirmModal from '@/components/ConfirmModal'
import { toggleUserRole, banUser, unbanUser } from './actions'
import { getAllUsersWithEmails } from './serverActions'

interface Profile {
  id: string
  username: string | null
  email: string
  role: string
  is_banned: boolean
  created_at: string
  session_count: number
  post_count: number
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<Profile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'promote' | 'demote' | 'ban' | 'unban'
    user: Profile
  } | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Check auth
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setCurrentUser(user)

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', user.id)
        .single()

      if (profileData?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setProfile(profileData)
    }

    // Fetch users
    const fetchUsers = async () => {
      try {
        const { profiles, emails, sessionCounts, postCounts } = await getAllUsersWithEmails()

        // Merge data
        const usersData = profiles.map((p) => ({
          ...p,
          email: (emails && emails[p.id]) || 'N/A',
          session_count: (sessionCounts && sessionCounts[p.id]) || 0,
          post_count: (postCounts && postCounts[p.id]) || 0,
        }))

        setUsers(usersData)
        setFilteredUsers(usersData)
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
    fetchUsers()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          fetchUsers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  // Filter users based on search
  useEffect(() => {
    if (!searchQuery) {
      setFilteredUsers(users)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = users.filter(
      (u) =>
        u.username?.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query)
    )
    setFilteredUsers(filtered)
  }, [searchQuery, users])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-16 border-b border-border bg-surface-elevated sticky top-0 z-20">
          <div className="h-full  mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
            <MobileMenuButton />
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
                <UsersIcon size={20} className="text-secondary" />
                User Management
              </h1>
            </div>
          </div>
        </header>
        <div className=" mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
          <div className="card">
            <div className="animate-pulse space-y-4 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-backplate rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-backplate rounded w-1/4"></div>
                    <div className="h-3 bg-backplate rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border bg-surface-elevated sticky top-0 z-20">
        <div className="h-full  mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
          <MobileMenuButton />
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <UsersIcon size={20} className="text-secondary" />
              User Management
            </h1>
            <p className="text-on-surface-secondary text-xs hidden sm:block">
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </p>
          </div>
          <UserMenu email={currentUser?.email} username={profile?.username} />
        </div>
      </header>

      <div className=" mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <div className="flex items-center justify-between mb-6">
          <BackButton />

          {/* Search */}
          <div className="relative w-full max-w-xs">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-medium" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-surface-elevated text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {filteredUsers.length > 0 ? (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-backplate border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface uppercase tracking-wider hidden md:table-cell">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface uppercase tracking-wider hidden lg:table-cell">
                      Stats
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-on-surface uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-backplate transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <UserAvatar username={u.username || undefined} email={u.email || undefined} size="sm" />
                          <div>
                            <div className="text-sm font-medium text-on-surface">
                              {u.username || 'Anonymous'}
                            </div>
                            <div className="text-xs text-on-surface-secondary md:hidden">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-on-surface-secondary">{u.email}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-xs text-on-surface-secondary">
                          {u.session_count} sessions • {u.post_count} posts
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-neutral-medium/10 text-neutral-medium'
                            }`}
                        >
                          {u.role === 'admin' ? <ShieldCheck size={14} /> : <Shield size={14} />}
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {u.is_banned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-error/10 text-error">
                            <Ban size={14} />
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                            <CheckCircle size={14} />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {u.id !== currentUser?.id ? (
                            <>
                              <button
                                onClick={() =>
                                  setConfirmAction({
                                    type: u.role === 'admin' ? 'demote' : 'promote',
                                    user: u,
                                  })
                                }
                                className="text-xs text-primary hover:underline"
                              >
                                {u.role === 'admin' ? 'Demote' : 'Promote'}
                              </button>
                              <span className="text-neutral-medium">•</span>
                              {u.is_banned ? (
                                <button
                                  onClick={() => setConfirmAction({ type: 'unban', user: u })}
                                  className="text-xs text-success hover:underline"
                                >
                                  Unban
                                </button>
                              ) : (
                                <button
                                  onClick={() => setConfirmAction({ type: 'ban', user: u })}
                                  className="text-xs text-error hover:underline"
                                >
                                  Ban
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-on-surface-secondary italic">You</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 card">
            <UsersIcon size={48} className="mx-auto text-neutral-medium mb-4 opacity-50" />
            <h2 className="text-xl font-semibold text-on-surface mb-2">
              {searchQuery ? 'No users found' : 'No users yet'}
            </h2>
            <p className="text-on-surface-secondary">
              {searchQuery
                ? 'Try a different search term'
                : 'User data will appear here as people sign up.'}
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmModal
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            const form = document.createElement('form')
            form.method = 'POST'

            const userIdInput = document.createElement('input')
            userIdInput.type = 'hidden'
            userIdInput.name = 'userId'
            userIdInput.value = confirmAction.user.id
            form.appendChild(userIdInput)

            if (confirmAction.type === 'promote' || confirmAction.type === 'demote') {
              const roleInput = document.createElement('input')
              roleInput.type = 'hidden'
              roleInput.name = 'currentRole'
              roleInput.value = confirmAction.user.role || 'user'
              form.appendChild(roleInput)

              document.body.appendChild(form)
              const formData = new FormData(form)
              toggleUserRole(formData)
            } else if (confirmAction.type === 'ban') {
              document.body.appendChild(form)
              const formData = new FormData(form)
              banUser(formData)
            } else if (confirmAction.type === 'unban') {
              document.body.appendChild(form)
              const formData = new FormData(form)
              unbanUser(formData)
            }

            document.body.removeChild(form)
          }}
          title={
            confirmAction.type === 'promote'
              ? 'Promote to Admin?'
              : confirmAction.type === 'demote'
                ? 'Demote to User?'
                : confirmAction.type === 'ban'
                  ? 'Ban User?'
                  : 'Unban User?'
          }
          message={
            confirmAction.type === 'promote'
              ? `Grant admin access to ${confirmAction.user.username || confirmAction.user.email}? They will have full access to all admin features.`
              : confirmAction.type === 'demote'
                ? `Remove admin access from ${confirmAction.user.username || confirmAction.user.email}? They will become a regular user.`
                : confirmAction.type === 'ban'
                  ? `Ban ${confirmAction.user.username || confirmAction.user.email}? They will not be able to access the app.`
                  : `Unban ${confirmAction.user.username || confirmAction.user.email}? They will regain access to the app.`
          }
          confirmText={
            confirmAction.type === 'promote'
              ? 'Promote'
              : confirmAction.type === 'demote'
                ? 'Demote'
                : confirmAction.type === 'ban'
                  ? 'Ban User'
                  : 'Unban User'
          }
          variant={
            confirmAction.type === 'ban' ? 'danger' : confirmAction.type === 'unban' ? 'success' : 'warning'
          }
        />
      )}
    </div>
  )
}
