'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Users as UsersIcon, ShieldCheck, Shield, Ban, CheckCircle, Search, Eye, Crown, Trash2, Loader2, MessageCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'
import BackButton from '@/components/BackButton'
import UserAvatar from '@/components/UserAvatar'
import ConfirmModal from '@/components/ConfirmModal'
import BanUserModal from '@/components/BanUserModal'
import UserDetailModal from '@/components/UserDetailModal'
import Toast from '@/components/Toast'
import {
  useAdminUsers,
  useToggleUserRole,
  useBanUser,
  useUnbanUser,
  adminUsersKeys,
  useCreateConversation,
  type AdminUser,
} from '@/hooks/queries'
import { deleteUserAccount } from '@/app/settings/actions'

export default function UsersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'promote' | 'demote' | 'unban'
    user: AdminUser
  } | null>(null)
  const [banningUser, setBanningUser] = useState<AdminUser | null>(null)
  const [viewingUser, setViewingUser] = useState<string | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  // TanStack Query hooks
  const { data: users = [], isLoading: loading } = useAdminUsers()
  const toggleRoleMutation = useToggleUserRole()
  const banMutation = useBanUser()
  const unbanMutation = useUnbanUser()
  const createConversationMutation = useCreateConversation()

  // Filter users with useMemo
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users

    return users.filter(user =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery, users])

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

      if (profileData?.role !== 'admin' && profileData?.role !== 'super_admin') {
        router.push('/dashboard')
        return
      }

      setProfile(profileData)
    }

    checkAuth()

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
          queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, queryClient])

  if (loading) {
    return (
      <div className="min-h-screen">
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
    <div className="min-h-screen">
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
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${u.role === 'super_admin'
                              ? 'bg-warning/10 text-warning'
                              : u.role === 'admin'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-neutral-medium/10 text-neutral-medium'
                            }`}
                        >
                          {u.role === 'super_admin' ? <Crown size={14} /> : u.role === 'admin' ? <ShieldCheck size={14} /> : <Shield size={14} />}
                          {u.role === 'super_admin' ? 'Super Admin' : u.role || 'user'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {u.is_banned ? (
                          <div className="group relative inline-block">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-error/10 text-error cursor-help">
                              <Ban size={14} />
                              Banned
                            </span>
                            {/* Tooltip */}
                            {(u.ban_reason || u.banned_until) && (
                              <div className="absolute left-0 top-full mt-2 z-50 w-64 p-3 bg-surface-elevated border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                {u.ban_reason && (
                                  <div className="mb-2">
                                    <p className="text-xs font-semibold text-on-surface mb-1">Reason:</p>
                                    <p className="text-xs text-on-surface-secondary">{u.ban_reason}</p>
                                  </div>
                                )}
                                {u.banned_until && (
                                  <div>
                                    <p className="text-xs font-semibold text-on-surface mb-1">Expires:</p>
                                    <p className="text-xs text-on-surface-secondary">
                                      {new Date(u.banned_until).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: 'numeric',
                                      })}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                            <CheckCircle size={14} />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setViewingUser(u.id)}
                            className="text-xs text-secondary hover:underline flex items-center gap-1"
                            title="View details"
                          >
                            <Eye size={12} />
                            <span className="hidden sm:inline">View</span>
                          </button>
                          <span className="text-neutral-medium">•</span>
                          <button
                            onClick={async () => {
                              try {
                                const conversation = await createConversationMutation.mutateAsync(u.id)
                                router.push(`/admin/messages?conversation=${conversation.id}`)
                              } catch (error: any) {
                                setToast({
                                  message: error.message || 'Failed to create conversation',
                                  variant: 'error'
                                })
                              }
                            }}
                            disabled={createConversationMutation.isPending}
                            className="text-xs text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                            title="Send message"
                          >
                            <MessageCircle size={12} />
                            <span className="hidden sm:inline">Message</span>
                          </button>
                          {/* Super admins cannot be modified by anyone */}
                          {u.role === 'super_admin' ? (
                            <span className="text-xs text-on-surface-secondary italic ml-2">Protected</span>
                          ) : u.id !== currentUser?.id && (
                            <>
                              <span className="text-neutral-medium">•</span>
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
                                  onClick={() => setBanningUser(u)}
                                  className="text-xs text-error hover:underline"
                                >
                                  Ban
                                </button>
                              )}
                              <span className="text-neutral-medium">•</span>
                              <button
                                onClick={() => setDeletingUser(u)}
                                className="text-xs text-error hover:underline flex items-center gap-1"
                                title="Delete user"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            </>
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
          onClose={() => {
            if (!(toggleRoleMutation.isPending || unbanMutation.isPending)) {
              setConfirmAction(null)
            }
          }}
          onConfirm={async () => {
            try {
              if (confirmAction.type === 'promote' || confirmAction.type === 'demote') {
                await toggleRoleMutation.mutateAsync({
                  userId: confirmAction.user.id,
                  currentRole: confirmAction.user.role
                })
              } else {
                await unbanMutation.mutateAsync({
                  userId: confirmAction.user.id
                })
              }

              const actionText =
                confirmAction.type === 'promote' ? 'promoted to admin' :
                  confirmAction.type === 'demote' ? 'demoted to user' : 'unbanned'

              setToast({
                message: `User ${actionText} successfully`,
                variant: 'success'
              })

              setConfirmAction(null)
            } catch (error: any) {
              console.error('Error performing action:', error)
              setToast({
                message: error?.message || 'An unexpected error occurred',
                variant: 'error'
              })
            }
          }}
          isLoading={toggleRoleMutation.isPending || unbanMutation.isPending}
          title={
            confirmAction.type === 'promote'
              ? 'Promote to Admin?'
              : confirmAction.type === 'demote'
                ? 'Demote to User?'
                : 'Unban User?'
          }
          message={
            confirmAction.type === 'promote'
              ? `Grant admin access to ${confirmAction.user.username || confirmAction.user.email}? They will have full access to all admin features.`
              : confirmAction.type === 'demote'
                ? `Remove admin access from ${confirmAction.user.username || confirmAction.user.email}? They will become a regular user.`
                : `Unban ${confirmAction.user.username || confirmAction.user.email}? They will regain access to the app.`
          }
          confirmText={
            confirmAction.type === 'promote'
              ? 'Promote'
              : confirmAction.type === 'demote'
                ? 'Demote'
                : 'Unban User'
          }
          variant={
            confirmAction.type === 'unban' ? 'success' : 'warning'
          }
        />
      )}

      {/* Ban User Modal */}
      {banningUser && (
        <BanUserModal
          isOpen={!!banningUser}
          username={banningUser.username || banningUser.email}
          onClose={() => {
            if (!banMutation.isPending) {
              setBanningUser(null)
            }
          }}
          onConfirm={async (reason, duration) => {
            try {
              await banMutation.mutateAsync({
                userId: banningUser.id,
                reason,
                duration
              })

              setToast({
                message: `User banned successfully`,
                variant: 'success'
              })

              setBanningUser(null)
            } catch (error: any) {
              console.error('Error banning user:', error)
              setToast({
                message: error?.message || 'Failed to ban user',
                variant: 'error'
              })
            }
          }}
          isLoading={banMutation.isPending}
        />
      )}

      {/* User Detail Modal */}
      {viewingUser && (
        <UserDetailModal
          userId={viewingUser}
          onClose={() => setViewingUser(null)}
        />
      )}

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <ConfirmModal
          isOpen={!!deletingUser}
          onClose={() => {
            if (!isDeleting) {
              setDeletingUser(null)
            }
          }}
          onConfirm={async () => {
            setIsDeleting(true)
            try {
              const result = await deleteUserAccount(deletingUser.id)
              if (result.success) {
                setToast({
                  message: `User "${deletingUser.username || deletingUser.email}" deleted successfully`,
                  variant: 'success'
                })
                queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() })
                setDeletingUser(null)
              } else {
                setToast({
                  message: result.error || 'Failed to delete user',
                  variant: 'error'
                })
              }
            } catch (error: any) {
              console.error('Error deleting user:', error)
              setToast({
                message: error?.message || 'Failed to delete user',
                variant: 'error'
              })
            } finally {
              setIsDeleting(false)
            }
          }}
          isLoading={isDeleting}
          title="Delete User Account?"
          message={`Are you sure you want to permanently delete "${deletingUser.username || deletingUser.email}"? This will remove all their data including focus sessions, notes, forum posts, and achievements. This action cannot be undone.`}
          confirmText="Delete User"
          variant="danger"
        />
      )}

      {/* Toast Notification */}
      <Toast
        isOpen={toast !== null}
        message={toast?.message || ''}
        variant={toast?.variant || 'success'}
        onClose={() => setToast(null)}
      />
    </div>
  )
}
