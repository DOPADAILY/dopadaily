'use client'

import { formatDistanceToNow } from 'date-fns'
import UserAvatar from '@/components/UserAvatar'
import { Check, CheckCheck, Trash2, AlertCircle, RefreshCw } from 'lucide-react'
import type { Message } from '@/app/messages/actions'

type MessageBubbleProps = {
  message: Message & { isPending?: boolean; isFailed?: boolean }
  isOwnMessage: boolean
  showAvatar?: boolean
  onDelete?: (messageId: number) => void
  onRetry?: (content: string) => void
}

export default function MessageBubble({
  message,
  isOwnMessage,
  showAvatar = true,
  onDelete,
  onRetry
}: MessageBubbleProps) {
  const messageTime = new Date(message.created_at)
  const canDelete = isOwnMessage &&
    (new Date().getTime() - messageTime.getTime()) < 5 * 60 * 1000 && // Within 5 minutes
    !message.isPending && !message.isFailed

  return (
    <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} group`}>
      {showAvatar && (
        <div className="shrink-0">
          <UserAvatar
            username={message.sender.username || undefined}
            email={message.sender.email || undefined}
            size="sm"
          />
        </div>
      )}

      <div className={`flex flex-col max-w-[70%] min-w-0 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {!isOwnMessage && showAvatar && (
          <span className="text-xs font-medium text-on-surface-secondary mb-1.5 px-1">
            {message.sender.username || 'Anonymous'}
          </span>
        )}

        <div
          className={`rounded-2xl px-4 py-2.5 relative ${message.isFailed
            ? 'bg-error/10 border-2 border-error text-on-surface'
            : isOwnMessage
              ? 'bg-primary text-white rounded-br-sm'
              : 'bg-surface-elevated border border-border text-on-surface rounded-bl-sm'
            } ${message.isPending ? 'opacity-70' : ''}`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        <div className="flex items-center gap-1.5 mt-1.5 px-1">
          <span className="text-xs text-on-surface-secondary leading-none">
            {message.isPending ? 'Sending...' : formatDistanceToNow(messageTime, { addSuffix: true })}
          </span>

          {isOwnMessage && !message.isPending && !message.isFailed && (
            <div className="flex items-center">
              {message.is_read ? (
                <span title="Read" className="flex items-center">
                  <CheckCheck size={13} className="text-primary" />
                </span>
              ) : (
                <span title="Sent" className="flex items-center">
                  <Check size={13} className="text-neutral-medium" />
                </span>
              )}
            </div>
          )}

          {message.isFailed && onRetry && (
            <button
              onClick={() => onRetry(message.content)}
              className="flex items-center gap-1 text-error hover:text-error/80 text-xs font-semibold transition-colors leading-none"
              title="Retry sending"
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          )}

          {message.isFailed && (
            <span title="Failed to send" className="flex items-center">
              <AlertCircle size={13} className="text-error" />
            </span>
          )}

          {canDelete && onDelete && (
            <button
              onClick={() => onDelete(message.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-error hover:text-error/80 flex items-center"
              title="Delete message"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
