'use client'

import { useState } from 'react'
import {
  FileText, Trash2, Plus, X, Edit2, Pin, PinOff, Search,
  Lightbulb, Target, Brain, Sparkles, BookOpen, Loader2, Crown
} from 'lucide-react'
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote, useTogglePin, useFeatureLimit } from '@/hooks/queries'
import { Note, NoteCategory, NoteColor } from './actions'
import EmptyState from '@/components/EmptyState'
import Toast from '@/components/Toast'
import ConfirmModal from '@/components/ConfirmModal'
import Select from '@/components/Select'
import { NotesSkeleton } from '@/components/SkeletonLoader'
import UpgradePrompt from '@/components/UpgradePrompt'

const categoryOptions = [
  { value: 'all', label: 'All Notes' },
  { value: 'general', label: 'General' },
  { value: 'focus', label: 'Focus' },
  { value: 'ideas', label: 'Ideas' },
  { value: 'reflections', label: 'Reflections' },
  { value: 'goals', label: 'Goals' },
]

const categoryIcons: Record<NoteCategory, React.ReactNode> = {
  general: <FileText size={14} />,
  focus: <Brain size={14} />,
  ideas: <Lightbulb size={14} />,
  reflections: <BookOpen size={14} />,
  goals: <Target size={14} />,
}

const colorOptions: { value: NoteColor; label: string; class: string }[] = [
  { value: 'default', label: 'Default', class: 'bg-surface-elevated border-border' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800' },
  { value: 'green', label: 'Green', class: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' },
  { value: 'yellow', label: 'Yellow', class: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-800' },
]

const getColorClass = (color: NoteColor) => {
  return colorOptions.find(c => c.value === color)?.class || colorOptions[0].class
}

export default function NotesClient() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [deletingNote, setDeletingNote] = useState<Note | null>(null)
  const [viewingNote, setViewingNote] = useState<Note | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // TanStack Query hooks
  const { data: notes = [], isLoading, error } = useNotes()
  const createNote = useCreateNote()
  const updateNote = useUpdateNote()
  const deleteNoteMutation = useDeleteNote()
  const togglePin = useTogglePin()

  // Subscription check for notes limit
  const { isAtLimit, remaining, isPremium } = useFeatureLimit('maxNotes', notes.length)

  // Filter and sort notes
  const filteredNotes = notes
    .filter(note => {
      const matchesCategory = filterCategory === 'all' || note.category === filterCategory
      const matchesSearch = searchQuery === '' ||
        note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
    .sort((a, b) => {
      // Pinned notes first
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      // Then by date
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const pinnedNotes = filteredNotes.filter(n => n.is_pinned)
  const unpinnedNotes = filteredNotes.filter(n => !n.is_pinned)

  const handleCreateNote = async (formData: FormData) => {
    const title = formData.get('title') as string | null
    const content = formData.get('content') as string
    const category = (formData.get('category') as NoteCategory) || 'general'
    const color = (formData.get('color') as NoteColor) || 'default'

    if (!content?.trim()) {
      setToast({ message: 'Note content is required', type: 'error' })
      return
    }

    createNote.mutate(
      { title, content, category, color },
      {
        onSuccess: () => {
          setIsCreateOpen(false)
          setToast({ message: 'Note created!', type: 'success' })
        },
        onError: (err) => {
          setToast({ message: err.message || 'Failed to create note', type: 'error' })
        },
      }
    )
  }

  const handleUpdateNote = async (formData: FormData) => {
    const id = formData.get('id') as string
    const title = formData.get('title') as string | null
    const content = formData.get('content') as string
    const category = (formData.get('category') as NoteCategory) || 'general'
    const color = (formData.get('color') as NoteColor) || 'default'

    if (!content?.trim()) {
      setToast({ message: 'Note content is required', type: 'error' })
      return
    }

    updateNote.mutate(
      { id, title, content, category, color },
      {
        onSuccess: () => {
          setEditingNote(null)
          setToast({ message: 'Note updated!', type: 'success' })
        },
        onError: (err) => {
          setToast({ message: err.message || 'Failed to update note', type: 'error' })
        },
      }
    )
  }

  const handleDeleteNote = async (id: string) => {
    deleteNoteMutation.mutate(id, {
      onSuccess: () => {
        setDeletingNote(null)
        setToast({ message: 'Note deleted', type: 'success' })
      },
      onError: (err) => {
        setToast({ message: err.message || 'Failed to delete note', type: 'error' })
      },
    })
  }

  const handleTogglePin = async (note: Note) => {
    togglePin.mutate(
      { id: note.id, isPinned: note.is_pinned },
      {
        onSuccess: () => {
          setToast({
            message: note.is_pinned ? 'Note unpinned' : 'Note pinned!',
            type: 'success'
          })
        },
        onError: (err) => {
          setToast({ message: err.message || 'Failed to update note', type: 'error' })
        },
      }
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Only show skeleton on initial load when there's no cached data
  // isLoading = isPending && no cached data (first load only)
  if (isLoading && notes.length === 0) {
    return <NotesSkeleton />
  }

  // Show error state
  if (error) {
    return (
      <div className="card">
        <EmptyState
          icon={FileText}
          title="Failed to load notes"
          description={error.message || 'Something went wrong. Please try again.'}
        />
      </div>
    )
  }

  const isPending = createNote.isPending || updateNote.isPending || deleteNoteMutation.isPending || togglePin.isPending

  const NoteCard = ({ note }: { note: Note }) => (
    <div
      className={`group relative rounded-xl border-2 p-4 transition-all hover:shadow-md cursor-pointer ${getColorClass(note.color)} ${note.id.toString().startsWith('temp-') ? 'opacity-70' : ''}`}
      onClick={() => setViewingNote(note)}
    >
      {/* Pin indicator */}
      {note.is_pinned && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-sm">
          <Pin size={12} className="text-on-primary" />
        </div>
      )}

      {/* Category badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-on-surface-secondary bg-backplate px-2 py-0.5 rounded-full">
          {categoryIcons[note.category]}
          {note.category.charAt(0).toUpperCase() + note.category.slice(1)}
        </span>
        {note.focus_session_id && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            <Brain size={12} />
            Focus
          </span>
        )}
      </div>

      {/* Title */}
      {note.title && (
        <h3 className="font-semibold text-on-surface mb-1 line-clamp-1">
          {note.title}
        </h3>
      )}

      {/* Content preview */}
      <p className="text-sm text-on-surface-secondary line-clamp-3 whitespace-pre-wrap">
        {note.content}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <span className="text-xs text-on-surface-secondary">
          {formatDate(note.created_at)}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => handleTogglePin(note)}
            className="p-1.5 rounded-lg hover:bg-backplate text-on-surface-secondary hover:text-primary transition-colors"
            title={note.is_pinned ? 'Unpin' : 'Pin'}
            disabled={isPending}
          >
            {note.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
          <button
            onClick={() => setEditingNote(note)}
            className="p-1.5 rounded-lg hover:bg-backplate text-on-surface-secondary hover:text-primary transition-colors"
            title="Edit"
            disabled={isPending}
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => setDeletingNote(note)}
            className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-secondary hover:text-error transition-colors"
            title="Delete"
            disabled={isPending}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )

  const NoteForm = ({
    note,
    onSubmit,
    onCancel,
    title,
    isSubmitting
  }: {
    note?: Note | null
    onSubmit: (formData: FormData) => void
    onCancel: () => void
    title: string
    isSubmitting: boolean
  }) => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="relative bg-surface-elevated rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-surface-elevated border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText size={20} className="text-primary" />
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
        <form action={onSubmit} className="p-6 space-y-5">
          {note && <input type="hidden" name="id" value={note.id} />}

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              Title <span className="text-on-surface-secondary font-normal">(optional)</span>
            </label>
            <input
              name="title"
              defaultValue={note?.title || ''}
              placeholder="Give your note a title..."
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">Content</label>
            <textarea
              name="content"
              rows={6}
              required
              defaultValue={note?.content || ''}
              placeholder="What's on your mind?"
              className="input w-full min-h-[150px] py-3 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Category</label>
              <Select
                name="category"
                defaultValue={note?.category || 'general'}
                options={categoryOptions.filter(o => o.value !== 'all')}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <label key={color.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="color"
                      value={color.value}
                      defaultChecked={note?.color === color.value || (!note && color.value === 'default')}
                      className="sr-only peer"
                    />
                    <div className={`w-8 h-8 rounded-lg border-2 ${color.class} peer-checked:ring-2 peer-checked:ring-primary peer-checked:ring-offset-2 transition-all`} />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                {note ? <Edit2 size={18} /> : <Plus size={18} />}
                {note ? 'Update Note' : 'Create Note'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* Upgrade Banner for Free Users at Limit */}
      {isAtLimit && !isPremium && (
        <UpgradePrompt
          feature="Unlimited Notes"
          description={`You've reached the limit of 5 notes. Upgrade to Premium for unlimited notes.`}
          variant="banner"
        />
      )}

      {/* Notes Remaining Counter for Free Users */}
      {!isPremium && !isAtLimit && remaining > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-surface-elevated rounded-lg border border-border">
          <Crown size={16} className="text-primary" />
          <span className="text-sm text-on-surface-secondary">
            {remaining} note{remaining !== 1 ? 's' : ''} remaining on Free plan
          </span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="w-full sm:flex-1 flex items-center gap-2 px-3 h-10 bg-surface-elevated border border-border rounded-lg focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Search size={18} className="text-on-surface-secondary shrink-0" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-neutral-medium"
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Select
            value={filterCategory}
            onChange={(value) => setFilterCategory(value)}
            options={categoryOptions}
            className="flex-1 sm:flex-none sm:w-40"
          />
          <button
            onClick={() => {
              if (isAtLimit && !isPremium) {
                setShowUpgradeModal(true)
              } else {
                setIsCreateOpen(true)
              }
            }}
            className="btn btn-primary shrink-0"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Note</span>
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FileText}
            title={searchQuery || filterCategory !== 'all' ? 'No notes found' : 'No notes yet'}
            description={
              searchQuery || filterCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Capture your thoughts, ideas, and reflections'
            }
            action={
              !searchQuery && filterCategory === 'all' && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="btn btn-primary"
                >
                  <Plus size={18} />
                  Create Your First Note
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pinned Notes */}
          {pinnedNotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Pin size={16} className="text-primary" />
                <h2 className="text-sm font-semibold text-on-surface-secondary uppercase tracking-wider">
                  Pinned
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedNotes.map(note => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </div>
          )}

          {/* Other Notes */}
          {unpinnedNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-on-surface-secondary" />
                  <h2 className="text-sm font-semibold text-on-surface-secondary uppercase tracking-wider">
                    All Notes
                  </h2>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {unpinnedNotes.map(note => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Note Modal */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className={`relative rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up border-2 ${getColorClass(viewingNote.color)}`}>
            {/* Header */}
            <div className="sticky top-0 border-b border-border/50 px-6 py-4 flex items-center justify-between bg-inherit rounded-t-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-on-surface-secondary bg-backplate px-2 py-0.5 rounded-full">
                  {categoryIcons[viewingNote.category]}
                  {viewingNote.category.charAt(0).toUpperCase() + viewingNote.category.slice(1)}
                </span>
                {viewingNote.is_pinned && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    <Pin size={12} />
                    Pinned
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setViewingNote(null)
                    setEditingNote(viewingNote)
                  }}
                  className="p-2 rounded-lg hover:bg-backplate transition-colors text-on-surface-secondary hover:text-primary"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => setViewingNote(null)}
                  className="p-2 rounded-lg hover:bg-backplate transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {viewingNote.title && (
                <h2 className="text-2xl font-bold text-on-surface mb-4">
                  {viewingNote.title}
                </h2>
              )}
              <p className="text-on-surface whitespace-pre-wrap leading-relaxed">
                {viewingNote.content}
              </p>

              {/* Meta */}
              <div className="mt-6 pt-4 border-t border-border/50 text-xs text-on-surface-secondary">
                Created {new Date(viewingNote.created_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
                {viewingNote.updated_at !== viewingNote.created_at && (
                  <> · Updated {new Date(viewingNote.updated_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}</>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <NoteForm
          onSubmit={handleCreateNote}
          onCancel={() => setIsCreateOpen(false)}
          title="Create Note"
          isSubmitting={createNote.isPending}
        />
      )}

      {/* Edit Modal */}
      {editingNote && (
        <NoteForm
          note={editingNote}
          onSubmit={handleUpdateNote}
          onCancel={() => setEditingNote(null)}
          title="Edit Note"
          isSubmitting={updateNote.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deletingNote !== null}
        title="Delete Note?"
        message={`Are you sure you want to delete "${deletingNote?.title || 'this note'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => deletingNote && handleDeleteNote(deletingNote.id)}
        onClose={() => setDeletingNote(null)}
        isLoading={deleteNoteMutation.isPending}
      />

      {/* Toast */}
      <Toast
        isOpen={toast !== null}
        message={toast?.message || ''}
        variant={toast?.type || 'success'}
        onClose={() => setToast(null)}
      />

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradePrompt
          feature="Unlimited Notes"
          description="You've reached the limit of 5 notes on the Free plan. Upgrade to Premium for unlimited notes with all colors and categories."
          variant="modal"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </>
  )
}
