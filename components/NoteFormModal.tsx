'use client'

import { useState } from 'react'
import { FileText, X, Edit2, Plus, Loader2 } from 'lucide-react'
import Select from '@/components/Select'
import { Note, NoteCategory, NoteColor } from '@/app/notes/actions'

const categoryOptions = [
  { value: 'general', label: 'General' },
  { value: 'focus', label: 'Focus' },
  { value: 'ideas', label: 'Ideas' },
  { value: 'reflections', label: 'Reflections' },
  { value: 'goals', label: 'Goals' },
]

const colorOptions: { value: NoteColor; label: string; class: string }[] = [
  { value: 'default', label: 'Default', class: 'bg-surface-elevated border-border' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800' },
  { value: 'green', label: 'Green', class: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' },
  { value: 'yellow', label: 'Yellow', class: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-800' },
]

interface NoteFormModalProps {
  note?: Note | null
  onSubmit: (formData: FormData) => void
  onCancel: () => void
  title: string
  isSubmitting: boolean
}

export default function NoteFormModal({
  note,
  onSubmit,
  onCancel,
  title,
  isSubmitting
}: NoteFormModalProps) {
  // Use controlled state initialized from props - won't reset on re-renders
  const [formTitle, setFormTitle] = useState(note?.title || '')
  const [formContent, setFormContent] = useState(note?.content || '')
  const [formCategory, setFormCategory] = useState<NoteCategory>(note?.category || 'general')
  const [formColor, setFormColor] = useState<NoteColor>(note?.color || 'default')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    if (note) formData.append('id', note.id)
    formData.append('title', formTitle)
    formData.append('content', formContent)
    formData.append('category', formCategory)
    formData.append('color', formColor)
    onSubmit(formData)
  }

  return (
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              Title <span className="text-on-surface-secondary font-normal">(optional)</span>
            </label>
            <input
              name="title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
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
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="What's on your mind?"
              className="input w-full min-h-[150px] py-3 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Category</label>
              <Select
                name="category"
                value={formCategory}
                onChange={(value) => setFormCategory(value as NoteCategory)}
                options={categoryOptions}
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
                      checked={formColor === color.value}
                      onChange={() => setFormColor(color.value)}
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
}

