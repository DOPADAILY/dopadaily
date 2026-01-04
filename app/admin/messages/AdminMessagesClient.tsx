'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useConversations, useToggleArchiveConversation, useSearchUsers, useCreateConversation } from '@/hooks/queries/useMessages'
import type { SearchUser } from '@/hooks/queries/useMessages'
import ConversationList from '@/components/chat/ConversationList'
import ChatWindow from '@/components/chat/ChatWindow'
import UserAvatar from '@/components/UserAvatar'
import { MessageCircle, Archive, Search, X, UserPlus, Loader2 } from 'lucide-react'
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

  // User search state
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const { data: conversations = [], isLoading } = useConversations()
  const toggleArchiveMutation = useToggleArchiveConversation()
  const { data: searchResults = [], isLoading: isSearching } = useSearchUsers(searchQuery, showSearchResults)
  const createConversationMutation = useCreateConversation()

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

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle starting a conversation with a searched user
  const handleStartConversation = async (user: SearchUser) => {
    try {
      const conversation = await createConversationMutation.mutateAsync(user.id)
      setSelectedConversationId(conversation.id)
      setSearchQuery('')
      setShowSearchResults(false)
      setToast({
        message: `Started conversation with ${user.username || user.email}`,
        variant: 'success'
      })
    } catch (error: any) {
      setToast({
        message: error.message || 'Failed to start conversation',
        variant: 'error'
      })
    }
  }

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
          {/* User Search */}
          <div className="border-b border-border p-4" ref={searchRef}>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-medium pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSearchResults(true)
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Click to browse or search users..."
                className="w-full h-10 pl-10 pr-10 rounded-lg border border-border bg-surface-elevated text-on-surface text-sm placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setShowSearchResults(false)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-backplate text-neutral-medium hover:text-on-surface transition-colors"
                >
                  <X size={16} />
                </button>
              )}

              {/* Search Results / All Users Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface-elevated border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  {/* Header */}
                  <div className="sticky top-0 bg-surface-elevated border-b border-border px-4 py-2">
                    <p className="text-xs font-medium text-on-surface-secondary uppercase tracking-wide">
                      {searchQuery.trim().length > 0 ? 'Search Results' : 'All Users'}
                    </p>
                  </div>
                  
                  {isSearching ? (
                    <div className="flex items-center justify-center p-4 text-on-surface-secondary">
                      <Loader2 size={20} className="animate-spin mr-2" />
                      <span className="text-sm">Loading users...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-on-surface-secondary text-sm">
                      {searchQuery.trim().length > 0 
                        ? `No users found matching "${searchQuery}"`
                        : 'No users found'
                      }
                    </div>
                  ) : (
                    <div className="py-2">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleStartConversation(user)}
                          disabled={createConversationMutation.isPending}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-backplate transition-colors text-left disabled:opacity-50"
                        >
                          <UserAvatar
                            username={user.username || undefined}
                            email={user.email || undefined}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-on-surface truncate">
                              {user.username || 'No username'}
                            </p>
                            <p className="text-xs text-on-surface-secondary truncate">
                              {user.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {user.role !== 'user' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                              </span>
                            )}
                            <UserPlus size={16} className="text-primary shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

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
                Choose a conversation from the sidebar or search for a user to start a new conversation
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
