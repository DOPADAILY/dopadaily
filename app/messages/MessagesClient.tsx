'use client'

import { useState } from 'react'
import { useConversations, useToggleArchiveConversation } from '@/hooks/queries/useMessages'
import ConversationList from '@/components/chat/ConversationList'
import ChatWindow from '@/components/chat/ChatWindow'
import { MessageCircle } from 'lucide-react'
import Toast from '@/components/Toast'
import { MessagesSkeleton } from '@/components/SkeletonLoader'

type MessagesClientProps = {
  userId: string
}

export default function MessagesClient({ userId }: MessagesClientProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  const { data: conversations = [], isLoading } = useConversations()
  const toggleArchiveMutation = useToggleArchiveConversation()

  const selectedConversation = conversations.find(c => c.id === selectedConversationId)

  // Filter out archived conversations for users
  const activeConversations = conversations.filter(c => !c.is_archived)

  const handleArchive = async (conversationId: string, isArchived: boolean) => {
    try {
      await toggleArchiveMutation.mutateAsync({ conversationId, isArchived })
      setToast({
        message: isArchived ? 'Conversation archived' : 'Conversation unarchived',
        variant: 'success'
      })
      if (isArchived && selectedConversationId === conversationId) {
        setSelectedConversationId(null)
      }
    } catch (error: any) {
      setToast({
        message: error.message || 'Failed to update conversation',
        variant: 'error'
      })
    }
  }

  if (isLoading) {
    return <MessagesSkeleton />
  }

  return (
    <>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Conversations Sidebar - Desktop */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-border bg-surface overflow-y-auto ${selectedConversationId ? 'hidden md:block' : 'block'
          }`}>
          <ConversationList
            conversations={activeConversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
            currentUserId={userId}
            isAdmin={false}
          />
        </div>

        {/* Chat Window */}
        <div className={`flex-1 ${selectedConversationId ? 'block' : 'hidden md:block'
          }`}>
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              currentUserId={userId}
              isAdmin={false}
              onArchive={handleArchive}
              onBack={() => setSelectedConversationId(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageCircle size={64} className="text-neutral-medium opacity-50 mb-4" />
              <h2 className="text-xl font-semibold text-on-surface mb-2">
                Select a conversation
              </h2>
              <p className="text-sm text-on-surface-secondary max-w-md">
                Choose a conversation from the sidebar to start chatting with an admin
              </p>
            </div>
          )}
        </div>

      </div>

      <Toast
        isOpen={toast !== null}
        message={toast?.message || ''}
        variant={toast?.variant || 'success'}
        onClose={() => setToast(null)}
      />
    </>
  )
}
