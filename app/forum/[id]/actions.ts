'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createComment(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?message=You must be logged in to comment')
  }

  const post_id = formData.get('post_id') as string
  const content = formData.get('content') as string

  if (!content || !post_id) {
    return { error: 'Missing required fields' }
  }

  const { error } = await supabase.from('forum_comments').insert({
    post_id: parseInt(post_id),
    content,
    user_id: user.id
  })

  if (error) {
    console.error('Error creating comment:', error)
    return { error: error.message || 'Failed to post comment. Please try again.' }
  }

  revalidatePath(`/forum/${post_id}`)
  return { success: true }
}

export async function deleteComment(commentId: number, postId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user owns the comment or is admin
  const { data: comment } = await supabase
    .from('forum_comments')
    .select('user_id')
    .eq('id', commentId)
    .single()

  if (!comment) {
    return { error: 'Comment not found' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const isOwner = comment.user_id === user.id

  if (!isOwner && !isAdmin) {
    return { error: 'Not authorized' }
  }

  const { error } = await supabase
    .from('forum_comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('Error deleting comment:', error)
    return { error: error.message }
  }

  revalidatePath(`/forum/${postId}`)
  return { success: true }
}

export async function updatePost(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const postId = parseInt(formData.get('post_id') as string)
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const category = formData.get('category') as string

  if (!title || !content || !category || !postId) {
    return { error: 'Missing required fields' }
  }

  // Get the post to check ownership and creation time
  const { data: post } = await supabase
    .from('forum_posts')
    .select('user_id, created_at')
    .eq('id', postId)
    .single()

  if (!post) {
    return { error: 'Post not found' }
  }

  // Check if user is the author (admins cannot edit, only delete)
  const isOwner = post.user_id === user.id

  if (!isOwner) {
    return { error: 'Not authorized to edit this post' }
  }

  // Check if within 1-hour edit window
  const postTime = new Date(post.created_at).getTime()
  const now = Date.now()
  const hourInMs = 60 * 60 * 1000
  const timeSincePost = now - postTime

  if (timeSincePost > hourInMs) {
    return { error: 'Edit window has expired. Posts can only be edited within 1 hour of creation.' }
  }

  // Update the post
  const { error } = await supabase
    .from('forum_posts')
    .update({
      title,
      content,
      category,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)

  if (error) {
    console.error('Error updating post:', error)
    return { error: error.message || 'Failed to update post' }
  }

  revalidatePath(`/forum/${postId}`)
  revalidatePath('/forum')
  return { success: true }
}

export async function deletePost(postId: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get the post to check ownership
  const { data: post } = await supabase
    .from('forum_posts')
    .select('user_id')
    .eq('id', postId)
    .single()

  if (!post) {
    return { error: 'Post not found' }
  }

  // Check if user is author or admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const isOwner = post.user_id === user.id

  if (!isOwner && !isAdmin) {
    return { error: 'Not authorized to delete this post' }
  }

  // Delete the post (CASCADE will handle comments and reactions)
  const { error } = await supabase
    .from('forum_posts')
    .delete()
    .eq('id', postId)

  if (error) {
    console.error('Error deleting post:', error)
    return { error: error.message || 'Failed to delete post' }
  }

  revalidatePath('/forum')
  return { success: true }
}

