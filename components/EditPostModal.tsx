'use client'

import { useState, useTransition } from 'react'
import { Save, X } from 'lucide-react'
import Modal from './Modal'
import Select from './Select'
import Toast from './Toast'

interface EditPostModalProps {
  isOpen: boolean
  onClose: () => void
  postId: number
  initialTitle: string
  initialContent: string
  initialCategory: string
  onUpdate: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  onSuccess?: () => void
}

const categoryOptions = [
  {
    value: 'general',
    label: 'General Chat',
    description: 'Casual conversations and everyday topics',
    icon: '💬'
  },
  {
    value: 'strategies',
    label: 'Strategies & Tips',
    description: 'Share and learn focus techniques',
    icon: '💡'
  },
  {
    value: 'wins',
    label: 'Small Wins',
    description: 'Celebrate your achievements',
    icon: '🎉'
  },
  {
    value: 'venting',
    label: 'Venting (Safe Space)',
    description: 'Share struggles in a supportive environment',
    icon: '💙'
  }
]

export default function EditPostModal({
  isOpen,
  onClose,
  postId,
  initialTitle,
  initialContent,
  initialCategory,
  onUpdate,
  onSuccess,
}: EditPostModalProps) {
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // Controlled state for form inputs
  const [formTitle, setFormTitle] = useState(initialTitle)
  const [formContent, setFormContent] = useState(initialContent)
  const [formCategory, setFormCategory] = useState(initialCategory)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const formData = new FormData()
    formData.append('post_id', postId.toString())
    formData.append('category', formCategory)
    formData.append('title', formTitle)
    formData.append('content', formContent)

    startTransition(async () => {
      const result = await onUpdate(formData)
      
      if (result?.error) {
        setToast({ message: result.error, type: 'error' })
      } else {
        setToast({ message: 'Post updated successfully!', type: 'success' })
        onSuccess?.() // Call success callback to refresh data
        setTimeout(() => {
          onClose()
        }, 1000)
      }
    })
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Post"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="edit-category" className="block text-sm font-semibold text-on-surface mb-2">
              Category
            </label>
            <Select
              name="category"
              id="edit-category"
              options={categoryOptions}
              value={formCategory}
              onChange={(value) => setFormCategory(value)}
            />
          </div>

          <div>
            <label htmlFor="edit-title" className="block text-sm font-semibold text-on-surface mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              id="edit-title"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="What's on your mind?"
              className="input w-full"
              disabled={isPending}
            />
          </div>

          <div>
            <label htmlFor="edit-content" className="block text-sm font-semibold text-on-surface mb-2">
              Content
            </label>
            <textarea
              name="content"
              id="edit-content"
              required
              rows={10}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Share your thoughts, experiences, or questions..."
              className="input w-full min-h-[200px] py-3 resize-none"
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-border">
            <button 
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isPending}
            >
              <X size={18} />
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {toast && (
        <Toast
          isOpen={toast !== null}
          message={toast.message}
          variant={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}

