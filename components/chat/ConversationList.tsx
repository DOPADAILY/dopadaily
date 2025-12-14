'use client'

import { formatDistanceToNow } from 'date-fns'
import UserAvatar from '@/components/UserAvatar'
import { MessageCircle } from 'lucide-react'
import type { Conversation } from '@/app/messages/actions'

type ConversationListProps = {
  conversations: Conversation[]
  selectedConversationId: string | null
  onSelectConversation: (conversationId: string) => void
  currentUserId: string
  isAdmin?: boolean
}

export default function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  currentUserId,
  isAdmin = false
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageCircle size={48} className="text-neutral-medium opacity-50 mb-4" />
        <h3 className="text-lg font-semibold text-on-surface mb-2">
          No conversations yet
        </h3>
        <p className="text-sm text-on-surface-secondary max-w-xs">
          {isAdmin
            ? 'Start a conversation with a user from the Users page'
            : 'When an admin reaches out to you, conversations will appear here'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((conversation) => {
        const otherParticipant = isAdmin ? conversation.user : conversation.admin
        const isSelected = conversation.id === selectedConversationId
        const hasUnread = (conversation.unread_count || 0) > 0

        return (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`w-full p-4 flex items-start gap-3 hover:bg-backplate transition-colors text-left ${isSelected ? 'bg-backplate border-l-4 border-primary' : ''
              }`}
          >
            <div className="relative shrink-0">
              <UserAvatar
                username={otherParticipant.username || undefined}
                email={otherParticipant.email || undefined}
                size="md"
              />
              {hasUnread && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-error rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {conversation.unread_count! > 9 ? '9+' : conversation.unread_count}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`text-sm font-semibold truncate ${hasUnread ? 'text-on-surface' : 'text-on-surface-secondary'
                  }`}>
                  {otherParticipant.username || otherParticipant.email || 'Anonymous'}
                </h3>
                {conversation.last_message_at && (
                  <span className="text-xs text-on-surface-secondary shrink-0 ml-2">
                    {formatDistanceToNow(new Date(conversation.last_message_at), {
                      addSuffix: false
                    })}
                  </span>
                )}
              </div>

              {conversation.last_message_preview && (
                <p className={`text-xs truncate ${hasUnread ? 'text-on-surface font-medium' : 'text-on-surface-secondary'
                  }`}>
                  {conversation.last_message_preview}
                </p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
