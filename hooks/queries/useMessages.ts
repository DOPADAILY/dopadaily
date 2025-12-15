import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useEffect } from 'react'
import type { Conversation, Message } from '@/app/messages/actions'
import { sendMessage as sendMessageAction } from '@/app/messages/actions'

// Query keys
export const messagesKeys = {
  all: ['messages'] as const,
  conversations: () => [...messagesKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...messagesKeys.all, 'conversation', id] as const,
  unreadCount: () => [...messagesKeys.all, 'unread-count'] as const,
}

/**
 * Hook to fetch all conversations for the current user
 */
export function useConversations() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: messagesKeys.conversations(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user's role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

      // Fetch conversations
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          admin:profiles!conversations_admin_id_fkey(username, avatar_url, email),
          user:profiles!conversations_user_id_fkey(username, avatar_url, email)
        `)
        .or(isAdmin ? `admin_id.eq.${user.id}` : `user_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      if (error) throw error

      // Get unread counts
      const conversationsWithUnread = await Promise.all(
        (conversations || []).map(async (conv) => {
          const { count } = await supabase
            .from('admin_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('recipient_id', user.id)
            .eq('is_read', false)

          return {
            ...conv,
            unread_count: count || 0
          }
        })
      )

      return conversationsWithUnread as Conversation[]
    },
    staleTime: 1000 * 60, // 1 minute
  })

  // Real-time subscription for conversations
  useEffect(() => {
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: messagesKeys.conversations() })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return query
}

/**
 * Hook to fetch messages for a specific conversation
 */
export function useConversationMessages(conversationId: string | null) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: messagesKeys.conversation(conversationId || ''),
    queryFn: async () => {
      if (!conversationId) return []

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: messages, error } = await supabase
        .from('admin_messages')
        .select(`
          *,
          sender:profiles!admin_messages_sender_id_fkey(username, avatar_url, email),
          recipient:profiles!admin_messages_recipient_id_fkey(username, avatar_url, email)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return messages as Message[]
    },
    enabled: !!conversationId,
    staleTime: 0, // Always fetch fresh for active conversation
  })

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: messagesKeys.conversation(conversationId) })
          queryClient.invalidateQueries({ queryKey: messagesKeys.conversations() })
          queryClient.invalidateQueries({ queryKey: messagesKeys.unreadCount() })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, queryClient])

  return query
}

/**
 * Hook to get unread message count
 */
export function useUnreadMessageCount() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: messagesKeys.unreadCount(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return 0

      const { count } = await supabase
        .from('admin_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false)

      return count || 0
    },
    staleTime: 1000 * 30, // 30 seconds
  })

  // Real-time subscription for unread count
  useEffect(() => {
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: messagesKeys.unreadCount() })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return query
}

/**
 * Mutation to send a message with optimistic updates
 * Uses server action to ensure email notifications are sent
 */
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      // Call the server action which handles email notifications
      const message = await sendMessageAction(conversationId, content)
      return message
    },
    onMutate: async ({ conversationId, content }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: messagesKeys.conversation(conversationId) })

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<Message[]>(messagesKeys.conversation(conversationId))

      // Get current user for optimistic message
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Get user profile for sender info
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url, email')
          .eq('id', user.id)
          .single()

        // Optimistically update cache
        const optimisticMessage: Message & { isPending?: boolean } = {
          id: Date.now(), // Temporary ID
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: '', // Will be filled by server
          content: content.trim(),
          is_read: false,
          read_at: null,
          created_at: new Date().toISOString(),
          sender: {
            username: profile?.username || null,
            avatar_url: profile?.avatar_url || null,
            email: profile?.email || null,
          },
          recipient: {
            username: null,
            avatar_url: null,
            email: null,
          },
          isPending: true, // Mark as pending
        }

        queryClient.setQueryData<Message[]>(
          messagesKeys.conversation(conversationId),
          (old = []) => [...old, optimisticMessage as Message]
        )
      }

      return { previousMessages }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          messagesKeys.conversation(variables.conversationId),
          context.previousMessages
        )
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: messagesKeys.conversation(variables.conversationId) })
      queryClient.invalidateQueries({ queryKey: messagesKeys.conversations() })
      queryClient.invalidateQueries({ queryKey: messagesKeys.unreadCount() })
    },
  })
}

/**
 * Mutation to mark messages as read
 */
export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('admin_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId)
        .eq('recipient_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagesKeys.conversations() })
      queryClient.invalidateQueries({ queryKey: messagesKeys.unreadCount() })
    },
  })
}

/**
 * Mutation to create a new conversation (admin only)
 */
export function useCreateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('admin_id', user.id)
        .eq('user_id', userId)
        .single()

      if (existing) return existing

      // Create new
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          admin_id: user.id,
          user_id: userId
        })
        .select()
        .single()

      if (error) throw error

      return conversation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagesKeys.conversations() })
    },
  })
}

/**
 * Mutation to toggle archive status
 */
export function useToggleArchiveConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ conversationId, isArchived }: { conversationId: string; isArchived: boolean }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('conversations')
        .update({
          is_archived: isArchived,
          archived_by: isArchived ? user.id : null
        })
        .eq('id', conversationId)

      if (error) throw error

      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagesKeys.conversations() })
    },
  })
}

/**
 * Mutation to delete a message
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, conversationId }: { messageId: number; conversationId: string }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('admin_messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error

      return { success: true }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: messagesKeys.conversation(variables.conversationId) })
      queryClient.invalidateQueries({ queryKey: messagesKeys.conversations() })
    },
  })
}
