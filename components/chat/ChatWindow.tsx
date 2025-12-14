'use client'

import { useEffect, useRef, useState } from 'react'
import { useConversationMessages, useSendMessage, useMarkMessagesAsRead, useDeleteMessage } from '@/hooks/queries/useMessages'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import { Loader2, Archive, ArchiveRestore, MoreVertical } from 'lucide-react'
import UserAvatar from '@/components/UserAvatar'
import Toast from '@/components/Toast'
import type { Conversation } from '@/app/messages/actions'

type ChatWindowProps = {
  conversation: Conversation
  currentUserId: string
  isAdmin?: boolean
  onArchive?: (conversationId: string, isArchived: boolean) => void
  onBack?: () => void
}

export default function ChatWindow({
  conversation,
  currentUserId,
  isAdmin = false,
  onArchive,
  onBack
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  const { data: messages = [], isLoading } = useConversationMessages(conversation.id)
  const sendMessageMutation = useSendMessage()
  const markAsReadMutation = useMarkMessagesAsRead()
  const deleteMessageMutation = useDeleteMessage()

  const otherParticipant = isAdmin ? conversation.user : conversation.admin

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (messages.length > 0) {
      const hasUnread = messages.some(m =>
        m.recipient_id === currentUserId && !m.is_read
      )
      if (hasUnread) {
        markAsReadMutation.mutate(conversation.id)
      }
    }
  }, [messages, conversation.id, currentUserId])

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessageMutation.mutateAsync({
        conversationId: conversation.id,
        content
      })
    } catch (error: any) {
      // Error is handled by mutation's onError
      // Show toast notification
      setToast({
        message: 'Message failed to send. Click retry to send again.',
        variant: 'error'
      })
    }
  }

  const handleRetryMessage = async (content: string) => {
    try {
      await sendMessageMutation.mutateAsync({
        conversationId: conversation.id,
        content
      })
      setToast({
        message: 'Message sent successfully',
        variant: 'success'
      })
    } catch (error: any) {
      setToast({
        message: 'Failed to send message. Please try again.',
        variant: 'error'
      })
    }
  }

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('Delete this message?')) return

    try {
      await deleteMessageMutation.mutateAsync({
        messageId,
        conversationId: conversation.id
      })
      setToast({
        message: 'Message deleted',
        variant: 'success'
      })
    } catch (error: any) {
      setToast({
        message: error.message || 'Failed to delete message',
        variant: 'error'
      })
    }
  }

  const handleArchive = () => {
    if (onArchive) {
      onArchive(conversation.id, !conversation.is_archived)
    }
    setShowMenu(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b border-border bg-surface-elevated p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Mobile back button */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 -ml-2 hover:bg-backplate rounded-lg transition-colors shrink-0"
              aria-label="Back to conversations"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-on-surface"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}

          <UserAvatar
            username={otherParticipant.username || undefined}
            email={otherParticipant.email || undefined}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-on-surface truncate">
              {otherParticipant.username || otherParticipant.email || 'Anonymous'}
            </h2>
            <p className="text-xs text-on-surface-secondary">
              {isAdmin ? 'User' : 'Admin'}
            </p>
          </div>
        </div>

        {isAdmin && onArchive && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-backplate rounded-lg transition-colors"
            >
              <MoreVertical size={20} className="text-on-surface-secondary" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface-elevated border border-border rounded-lg shadow-lg py-1 z-10">
                <button
                  onClick={handleArchive}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-backplate flex items-center gap-2"
                >
                  {conversation.is_archived ? (
                    <>
                      <ArchiveRestore size={16} />
                      Unarchive
                    </>
                  ) : (
                    <>
                      <Archive size={16} />
                      Archive
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-on-surface-secondary mb-2">No messages yet</p>
              <p className="text-sm text-on-surface-secondary">
                Start the conversation by sending a message below
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1]
              const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.sender_id === currentUserId}
                  showAvatar={showAvatar}
                  onDelete={handleDeleteMessage}
                  onRetry={handleRetryMessage}
                />
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        onSend={handleSendMessage}
        isLoading={sendMessageMutation.isPending}
        placeholder={`Message ${otherParticipant.username || 'user'}...`}
      />

      {/* Toast */}
      <Toast
        isOpen={toast !== null}
        message={toast?.message || ''}
        variant={toast?.variant || 'success'}
        onClose={() => setToast(null)}
      />
    </div>
  )
}
