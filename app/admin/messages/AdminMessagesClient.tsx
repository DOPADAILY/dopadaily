'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useConversations, useToggleArchiveConversation } from '@/hooks/queries/useMessages'
import ConversationList from '@/components/chat/ConversationList'
import ChatWindow from '@/components/chat/ChatWindow'
import { MessageCircle, Archive } from 'lucide-react'
import Toast from '@/components/Toast'
import { MessagesSkeleton } from '@/components/SkeletonLoader'

type AdminMessagesClientProps = {
  userId: string
}

export default function AdminMessagesClient({ userId }: AdminMessagesClientProps) {
  const searchParams = useSearchParams()
  const conversationParam = searchParams?.get('conversation')
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(conversationParam)
  const [showArchived, setShowArchived] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  const { data: conversations = [], isLoading } = useConversations()
  const toggleArchiveMutation = useToggleArchiveConversation()

  const selectedConversation = conversations.find(c => c.id === selectedConversationId)

  // Filter conversations based on archived status
  const filteredConversations = showArchived
    ? conversations.filter(c => c.is_archived)
    : conversations.filter(c => !c.is_archived)

  // Auto-select conversation from URL parameter
  useEffect(() => {
    if (conversationParam && conversations.length > 0) {
      const exists = conversations.find(c => c.id === conversationParam)
      if (exists) {
        setSelectedConversationId(conversationParam)
      }
    }
  }, [conversationParam, conversations])

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

  const archivedCount = conversations.filter(c => c.is_archived).length

  return (
    <>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Conversations Sidebar - Desktop */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-border bg-surface flex flex-col ${selectedConversationId ? 'hidden md:flex' : 'flex'
          }`}>
          {/* Archive Toggle */}
          <div className="border-b border-border p-4">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${showArchived ? 'bg-primary text-white' : 'bg-backplate hover:bg-neutral-medium/10'
                }`}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Archive size={16} />
                {showArchived ? 'Archived' : 'Active'}
              </span>
              {archivedCount > 0 && !showArchived && (
                <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                  {archivedCount}
                </span>
              )}
            </button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            <ConversationList
              conversations={filteredConversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
              currentUserId={userId}
              isAdmin={true}
            />
          </div>
        </div>

        {/* Chat Window */}
        <div className={`flex-1 ${selectedConversationId ? 'block' : 'hidden md:block'
          }`}>
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              currentUserId={userId}
              isAdmin={true}
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
                Choose a conversation from the sidebar to start chatting with a user, or start a new conversation from the Users page
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
