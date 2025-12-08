'use client'

import { useState } from 'react'
import { Bell, Edit2, Plus, X, Loader2 } from 'lucide-react'
import { Reminder } from '@/hooks/queries'

interface ReminderFormModalProps {
  reminder?: Reminder | null
  isAdmin: boolean
  onSubmit: (data: {
    id?: number
    title: string
    message: string
    remind_at: string
    is_global: boolean
  }) => void
  onCancel: () => void
  title: string
  isSubmitting: boolean
}

export default function ReminderFormModal({
  reminder,
  isAdmin,
  onSubmit,
  onCancel,
  title,
  isSubmitting
}: ReminderFormModalProps) {
  // Use controlled state initialized from props
  const [formTitle, setFormTitle] = useState(reminder?.title || '')
  const [formMessage, setFormMessage] = useState(reminder?.message || '')
  const [formDate, setFormDate] = useState(
    reminder?.remind_at 
      ? new Date(reminder.remind_at).toISOString().slice(0, 16) 
      : ''
  )
  const [formIsGlobal, setFormIsGlobal] = useState(reminder?.is_global || false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      id: reminder?.id,
      title: formTitle,
      message: formMessage,
      remind_at: formDate,
      is_global: formIsGlobal,
    })
  }

  const isEditing = !!reminder

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="relative bg-surface-elevated rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-surface-elevated border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {isEditing ? <Edit2 size={20} className="text-primary" /> : <Bell size={20} className="text-primary" />}
            </div>
            <h2 className="text-xl font-semibold text-on-surface">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-backplate transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">Title</label>
            <input
              name="title"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g., Drink water"
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">Message (Optional)</label>
            <textarea
              name="message"
              rows={3}
              value={formMessage}
              onChange={(e) => setFormMessage(e.target.value)}
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
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="input w-full"
            />
          </div>

          {isAdmin && (
            <div className="p-3 bg-backplate rounded-lg border border-border">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsGlobal}
                  onChange={(e) => setFormIsGlobal(e.target.checked)}
                  className="mt-0.5 rounded text-primary"
                />
                <div className="text-sm">
                  <span className="font-semibold text-on-surface block mb-1">Send to all users</span>
                  <span className="text-xs text-on-surface-secondary">Community-wide wellness reminder</span>
                </div>
              </label>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                {isEditing ? <Edit2 size={18} /> : <Plus size={18} />}
                {isEditing ? 'Update Reminder' : 'Create Reminder'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

