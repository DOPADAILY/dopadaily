'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type Conversation = {
  id: string
  admin_id: string
  user_id: string
  last_message_at: string
  last_message_preview: string | null
  is_archived: boolean
  created_at: string
  admin: {
    username: string | null
    avatar_url: string | null
    email: string | null
  }
  user: {
    username: string | null
    avatar_url: string | null
    email: string | null
  }
  unread_count?: number
}

export type Message = {
  id: number
  conversation_id: string
  sender_id: string
  recipient_id: string
  content: string
  is_read: boolean
  read_at: string | null
  created_at: string
  sender: {
    username: string | null
    avatar_url: string | null
    email: string | null
  }
  recipient: {
    username: string | null
    avatar_url: string | null
    email: string | null
  }
}

/**
 * Get all conversations for the current user
 */
export async function getUserConversations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get user's role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  // Fetch conversations with admin and user profiles
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

  // Get unread counts for each conversation
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
}

/**
 * Get messages for a specific conversation
 */
export async function getConversationMessages(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Verify user is part of this conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select('admin_id, user_id')
    .eq('id', conversationId)
    .single()

  if (!conversation || (conversation.admin_id !== user.id && conversation.user_id !== user.id)) {
    throw new Error('Unauthorized')
  }

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
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Validate content
  if (!content || content.trim().length === 0) {
    throw new Error('Message content cannot be empty')
  }

  if (content.length > 5000) {
    throw new Error('Message too long (max 5000 characters)')
  }

  // Get conversation details to determine recipient
  const { data: conversation } = await supabase
    .from('conversations')
    .select('admin_id, user_id')
    .eq('id', conversationId)
    .single()

  if (!conversation) {
    throw new Error('Conversation not found')
  }

  // Verify user is part of this conversation
  if (conversation.admin_id !== user.id && conversation.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  // Determine recipient
  const recipientId = conversation.admin_id === user.id
    ? conversation.user_id
    : conversation.admin_id

  // Insert message
  const { data: message, error } = await supabase
    .from('admin_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      recipient_id: recipientId,
      content: content.trim()
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/messages')
  revalidatePath('/admin/messages')

  return message
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

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

  revalidatePath('/messages')
  revalidatePath('/admin/messages')

  return { success: true }
}

/**
 * Create a new conversation (admin only)
 */
export async function createConversation(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Verify user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    throw new Error('Unauthorized: Admin access required')
  }

  // Check if conversation already exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('admin_id', user.id)
    .eq('user_id', userId)
    .single()

  if (existing) {
    return existing
  }

  // Create new conversation
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      admin_id: user.id,
      user_id: userId
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/admin/messages')

  return conversation
}

/**
 * Archive/unarchive a conversation
 */
export async function toggleArchiveConversation(conversationId: string, isArchived: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('conversations')
    .update({
      is_archived: isArchived,
      archived_by: isArchived ? user.id : null
    })
    .eq('id', conversationId)

  if (error) throw error

  revalidatePath('/messages')
  revalidatePath('/admin/messages')

  return { success: true }
}

/**
 * Get total unread message count for current user
 */
export async function getUnreadMessageCount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return 0
  }

  const { count } = await supabase
    .from('admin_messages')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false)

  return count || 0
}

/**
 * Delete a message (within 5 minutes of sending)
 */
export async function deleteMessage(messageId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get message to check timestamp
  const { data: message } = await supabase
    .from('admin_messages')
    .select('sender_id, created_at')
    .eq('id', messageId)
    .single()

  if (!message || message.sender_id !== user.id) {
    throw new Error('Unauthorized')
  }

  // Check if message is within 5 minute window
  const messageTime = new Date(message.created_at).getTime()
  const now = new Date().getTime()
  const fiveMinutes = 5 * 60 * 1000

  if (now - messageTime > fiveMinutes) {
    throw new Error('Can only delete messages within 5 minutes of sending')
  }

  const { error } = await supabase
    .from('admin_messages')
    .delete()
    .eq('id', messageId)

  if (error) throw error

  revalidatePath('/messages')
  revalidatePath('/admin/messages')

  return { success: true }
}
