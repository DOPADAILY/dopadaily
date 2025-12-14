'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'

type MessageInputProps = {
  onSend: (content: string) => void
  isLoading?: boolean
  placeholder?: string
}

export default function MessageInput({
  onSend,
  isLoading = false,
  placeholder = 'Type a message...'
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [content])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() || isLoading) return

    onSend(content.trim())
    setContent('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            maxLength={5000}
            className="w-full resize-none rounded-xl border-2 border-border bg-surface-elevated px-4 py-3 text-sm text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed max-h-32 overflow-y-auto shadow-sm hover:border-primary/30 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0,0,0,0.2) transparent'
            }}
          />
          {content.length > 4500 && (
            <span className="absolute bottom-3 right-3 text-xs font-medium text-on-surface-secondary bg-surface px-2 py-0.5 rounded-full">
              {content.length}/5000
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={!content.trim() || isLoading}
          className="group relative flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-white hover:bg-primary/90 active:scale-95 shadow-md hover:shadow-lg disabled:hover:shadow-md disabled:active:scale-100 min-h-[48px]"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          )}
          <span className="hidden sm:inline">Send</span>

          {/* Shine effect on hover */}
          <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </button>
      </div>

      <p className="text-xs text-on-surface-secondary mt-2.5 ml-1 flex items-center gap-1">
        <span className="opacity-75">Press</span>
        <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-backplate border border-border rounded">Enter</kbd>
        <span className="opacity-75">to send,</span>
        <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-backplate border border-border rounded">Shift+Enter</kbd>
        <span className="opacity-75">for new line</span>
      </p>
    </form>
  )
}
