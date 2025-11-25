'use client'

import { useState, useTransition } from 'react'
import { FileText, Plus, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { createQuickNote } from '@/app/notes/actions'
import Toast from './Toast'

interface QuickNoteProps {
  focusSessionId?: string
}

export default function QuickNote({ focusSessionId }: QuickNoteProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    startTransition(async () => {
      const result = await createQuickNote(content, focusSessionId)
      if (result.error) {
        setToast({ message: result.error, type: 'error' })
      } else {
        setContent('')
        setIsExpanded(false)
        setToast({ message: 'Note saved!', type: 'success' })
      }
    })
  }

  return (
    <>
      <div className="w-full max-w-md">
        {/* Collapsed State - Just a button */}
        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-elevated border border-border hover:border-primary hover:bg-backplate transition-all group"
          >
            <FileText size={18} className="text-on-surface-secondary group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-on-surface-secondary group-hover:text-on-surface transition-colors">
              Quick Note
            </span>
            <ChevronDown size={16} className="text-on-surface-secondary group-hover:text-primary transition-colors" />
          </button>
        ) : (
          /* Expanded State - Note input */
          <div className="bg-surface-elevated rounded-xl border border-primary shadow-lg overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-primary/5 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                <span className="text-sm font-semibold text-on-surface">Quick Note</span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded hover:bg-backplate transition-colors"
              >
                <ChevronUp size={16} className="text-on-surface-secondary" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Capture a thought without breaking your focus..."
                rows={3}
                autoFocus
                className="w-full bg-transparent text-sm text-on-surface placeholder:text-neutral-medium outline-none resize-none"
              />

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                <p className="text-xs text-on-surface-secondary">
                  Press Enter to save
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setContent('')
                      setIsExpanded(false)
                    }}
                    className="text-xs text-on-surface-secondary hover:text-on-surface transition-colors px-2 py-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!content.trim() || isPending}
                    className="flex items-center gap-1 text-xs font-medium text-on-primary bg-primary px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Plus size={14} />
                    )}
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Toast */}
      <Toast
        isOpen={toast !== null}
        message={toast?.message || ''}
        variant={toast?.type || 'success'}
        onClose={() => setToast(null)}
      />
    </>
  )
}

