'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Plus, Calendar, Clock, Trash2, AlertCircle, Edit2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'
import BackButton from '@/components/BackButton'
import Modal from '@/components/Modal'
import ConfirmModal from '@/components/ConfirmModal'
import Select from '@/components/Select'
import Toast from '@/components/Toast'
import {
  useAdminReminders,
  useCreateGlobalReminder,
  useUpdateGlobalReminder,
  useDeleteGlobalReminder,
  adminRemindersKeys,
  type GlobalReminder,
} from '@/hooks/queries'

export default function AdminRemindersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<GlobalReminder | null>(null)
  const [deletingReminder, setDeletingReminder] = useState<GlobalReminder | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' | 'warning' } | null>(null)
  const [showToast, setShowToast] = useState(false)

  // TanStack Query hooks
  const { data: reminders = [], isLoading: loading } = useAdminReminders()
  const createMutation = useCreateGlobalReminder()
  const updateMutation = useUpdateGlobalReminder()
  const deleteMutation = useDeleteGlobalReminder()

  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

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

    checkAuth()

    const channel = supabase
      .channel('reminders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reminders',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: adminRemindersKeys.lists() })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, queryClient])

  const handleCreateReminder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)

    try {
      await createMutation.mutateAsync({
        title: formData.get('title') as string,
        message: formData.get('message') as string || null,
        category: formData.get('category') as string,
        remind_at: formData.get('remind_at') as string,
        recurrence_pattern: formData.get('recurrence_pattern') as string || null,
        created_by: user.id,
      })

      setIsCreateOpen(false)
      setToast({ message: 'Reminder created successfully', variant: 'success' })
      setShowToast(true)
    } catch (error) {
      console.error('Error creating reminder:', error)
      setToast({ message: 'Failed to create reminder', variant: 'error' })
      setShowToast(true)
    }
  }

  const handleEditReminder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingReminder) return

    const formData = new FormData(e.currentTarget)

    try {
      await updateMutation.mutateAsync({
        id: editingReminder.id,
        title: formData.get('title') as string,
        message: formData.get('message') as string || null,
        category: formData.get('category') as string,
        remind_at: formData.get('remind_at') as string,
        recurrence_pattern: formData.get('recurrence_pattern') as string || null,
      })

      setEditingReminder(null)
      setToast({ message: 'Reminder updated successfully', variant: 'success' })
      setShowToast(true)
    } catch (error) {
      console.error('Error updating reminder:', error)
      setToast({ message: 'Failed to update reminder', variant: 'error' })
      setShowToast(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <header className="h-16 border-b border-border bg-surface-elevated sticky top-0 z-20">
          <div className="h-full  mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
            <MobileMenuButton />
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
                <Bell size={20} className="text-accent" />
                Global Reminders
              </h1>
            </div>
          </div>
        </header>
        <div className=" mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card">
                <div className="h-6 bg-backplate rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-backplate rounded w-full mb-2"></div>
                <div className="h-4 bg-backplate rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const now = new Date()
  const upcomingReminders = reminders.filter((r) => new Date(r.remind_at) > now)
  const pastReminders = reminders.filter((r) => new Date(r.remind_at) <= now)

  return (
    <div className="min-h-screen">
      <header className="h-16 border-b border-border bg-surface-elevated sticky top-0 z-20">
        <div className="h-full  mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
          <MobileMenuButton />
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <Bell size={20} className="text-accent" />
              Global Reminders
            </h1>
            <p className="text-on-surface-secondary text-xs hidden sm:block">
              {upcomingReminders.length} upcoming • {pastReminders.length} past
            </p>
          </div>
          <UserMenu email={user?.email} username={profile?.username} />
        </div>
      </header>

      <div className=" mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <div className="flex items-center justify-between mb-6">
          <BackButton />
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">New Reminder</span>
          </button>
        </div>

        {reminders.length === 0 ? (
          <div className="text-center py-12 card">
            <Bell size={48} className="mx-auto text-neutral-medium mb-4 opacity-50" />
            <h2 className="text-xl font-semibold text-on-surface mb-2">No global reminders</h2>
            <p className="text-on-surface-secondary mb-6">
              Create a global reminder to notify all users!
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Create First Reminder
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {upcomingReminders.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-on-surface mb-4 flex items-center gap-2">
                  <AlertCircle size={20} className="text-accent" />
                  Upcoming Reminders
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingReminders.map((reminder) => (
                    <div key={reminder.id} className="card">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-on-surface">{reminder.title}</h3>
                          <span className="inline-block mt-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                            {reminder.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingReminder(reminder)}
                            className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors"
                            title="Edit reminder"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => setDeletingReminder(reminder)}
                            className="text-error hover:bg-error/10 p-2 rounded-lg transition-colors"
                            title="Delete reminder"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {reminder.message && (
                        <p className="text-sm text-on-surface-secondary mb-3">{reminder.message}</p>
                      )}

                      <div className="flex items-center gap-4 text-on-surface-secondary text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>{new Date(reminder.remind_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>
                            {new Date(reminder.remind_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {reminder.recurrence_pattern && (
                        <div className="mt-2 text-xs text-on-surface-secondary">
                          Repeats: {reminder.recurrence_pattern}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pastReminders.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-on-surface mb-4">Past Reminders</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
                  {pastReminders.map((reminder) => (
                    <div key={reminder.id} className="card">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-on-surface">{reminder.title}</h3>
                          <span className="inline-block mt-1 px-2 py-1 bg-neutral-medium/10 text-neutral-medium rounded-md text-xs font-medium">
                            {reminder.category}
                          </span>
                        </div>
                        <button
                          onClick={() => setDeletingReminder(reminder)}
                          className="text-error hover:bg-error/10 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {reminder.message && (
                        <p className="text-sm text-on-surface-secondary mb-3">{reminder.message}</p>
                      )}

                      <div className="flex items-center gap-4 text-on-surface-secondary text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>{new Date(reminder.remind_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>
                            {new Date(reminder.remind_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Global Reminder">
        <form onSubmit={handleCreateReminder} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-on-surface mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="w-full h-10 px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="e.g., Weekly Wellness Check"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-on-surface mb-2">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
              placeholder="Add a message for users"
            ></textarea>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-on-surface mb-2">
              Category
            </label>
            <Select
              id="category"
              name="category"
              options={[
                { value: 'wellness', label: 'Wellness' },
                { value: 'focus', label: 'Focus' },
                { value: 'social', label: 'Social' },
                { value: 'achievement', label: 'Achievement' }
              ]}
              defaultValue="wellness"
            />
          </div>

          <div>
            <label htmlFor="remind_at" className="block text-sm font-semibold text-on-surface mb-2">
              Remind At *
            </label>
            <input
              type="datetime-local"
              id="remind_at"
              name="remind_at"
              required
              className="w-full h-10 px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="recurrence_pattern" className="block text-sm font-semibold text-on-surface mb-2">
              Recurrence (Optional)
            </label>
            <Select
              id="recurrence_pattern"
              name="recurrence_pattern"
              options={[
                { value: '', label: 'None' },
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' }
              ]}
              defaultValue=""
            />
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={20} />
                  Create Reminder
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="btn btn-ghost"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editingReminder !== null}
        onClose={() => setEditingReminder(null)}
        title="Edit Global Reminder"
      >
        <form onSubmit={handleEditReminder} className="space-y-4">
          <div>
            <label htmlFor="edit-title" className="block text-sm font-semibold text-on-surface mb-2">
              Title *
            </label>
            <input
              type="text"
              id="edit-title"
              name="title"
              required
              defaultValue={editingReminder?.title}
              className="w-full h-10 px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="e.g., Weekly Wellness Check"
            />
          </div>

          <div>
            <label htmlFor="edit-message" className="block text-sm font-semibold text-on-surface mb-2">
              Message
            </label>
            <textarea
              id="edit-message"
              name="message"
              rows={3}
              defaultValue={editingReminder?.message || ''}
              className="w-full px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
              placeholder="Add a message for users"
            ></textarea>
          </div>

          <div>
            <label htmlFor="edit-category" className="block text-sm font-semibold text-on-surface mb-2">
              Category
            </label>
            <Select
              id="edit-category"
              name="category"
              options={[
                { value: 'wellness', label: 'Wellness' },
                { value: 'focus', label: 'Focus' },
                { value: 'social', label: 'Social' },
                { value: 'achievement', label: 'Achievement' }
              ]}
              defaultValue={editingReminder?.category}
            />
          </div>

          <div>
            <label htmlFor="edit-remind_at" className="block text-sm font-semibold text-on-surface mb-2">
              Remind At *
            </label>
            <input
              type="datetime-local"
              id="edit-remind_at"
              name="remind_at"
              required
              defaultValue={editingReminder?.remind_at ? new Date(editingReminder.remind_at).toISOString().slice(0, 16) : ''}
              className="w-full h-10 px-3 py-2 rounded-lg border border-border bg-backplate text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="edit-recurrence_pattern" className="block text-sm font-semibold text-on-surface mb-2">
              Recurrence (Optional)
            </label>
            <Select
              id="edit-recurrence_pattern"
              name="recurrence_pattern"
              options={[
                { value: '', label: 'None' },
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' }
              ]}
              defaultValue={editingReminder?.recurrence_pattern || ''}
            />
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Edit2 size={20} />
                  Update Reminder
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setEditingReminder(null)}
              className="btn btn-ghost"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deletingReminder && (
        <ConfirmModal
          isOpen={!!deletingReminder}
          onClose={() => setDeletingReminder(null)}
          onConfirm={async () => {
            try {
              await deleteMutation.mutateAsync(deletingReminder.id)
              setDeletingReminder(null)
              setToast({ message: 'Reminder deleted successfully', variant: 'success' })
              setShowToast(true)
            } catch (error) {
              console.error('Error deleting reminder:', error)
              setToast({ message: 'Failed to delete reminder', variant: 'error' })
              setShowToast(true)
            }
          }}
          title="Delete Reminder?"
          message={`Are you sure you want to delete "${deletingReminder.title}"? This action cannot be undone.`}
          confirmText={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          cancelText="Cancel"
          variant="danger"
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          isOpen={showToast}
          message={toast.message}
          variant={toast.variant}
          onClose={() => {
            setShowToast(false)
            setToast(null)
          }}
        />
      )}
    </div>
  )
}
