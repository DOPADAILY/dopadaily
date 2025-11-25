'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type NoteCategory = 'general' | 'focus' | 'ideas' | 'reflections' | 'goals'
export type NoteColor = 'default' | 'blue' | 'green' | 'yellow' | 'purple' | 'pink'

export interface Note {
  id: string
  user_id: string
  title: string | null
  content: string
  category: NoteCategory
  is_pinned: boolean
  focus_session_id: string | null
  color: NoteColor
  created_at: string
  updated_at: string
}

export async function createNote(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const title = formData.get('title') as string | null
  const content = formData.get('content') as string
  const category = (formData.get('category') as NoteCategory) || 'general'
  const color = (formData.get('color') as NoteColor) || 'default'
  const focusSessionId = formData.get('focus_session_id') as string | null

  if (!content?.trim()) {
    return { error: 'Note content is required' }
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      title: title?.trim() || null,
      content: content.trim(),
      category,
      color,
      focus_session_id: focusSessionId || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating note:', error)
    return { error: 'Failed to create note' }
  }

  revalidatePath('/notes')
  revalidatePath('/focus')
  return { success: true, note: data }
}

export async function updateNote(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const id = formData.get('id') as string
  const title = formData.get('title') as string | null
  const content = formData.get('content') as string
  const category = (formData.get('category') as NoteCategory) || 'general'
  const color = (formData.get('color') as NoteColor) || 'default'

  if (!id) {
    return { error: 'Note ID is required' }
  }

  if (!content?.trim()) {
    return { error: 'Note content is required' }
  }

  const { error } = await supabase
    .from('notes')
    .update({
      title: title?.trim() || null,
      content: content.trim(),
      category,
      color,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating note:', error)
    return { error: 'Failed to update note' }
  }

  revalidatePath('/notes')
  return { success: true }
}

export async function deleteNote(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting note:', error)
    return { error: 'Failed to delete note' }
  }

  revalidatePath('/notes')
  return { success: true }
}

export async function togglePinNote(id: string, isPinned: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('notes')
    .update({ is_pinned: !isPinned })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error toggling pin:', error)
    return { error: 'Failed to update note' }
  }

  revalidatePath('/notes')
  return { success: true }
}

export async function createQuickNote(content: string, focusSessionId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  if (!content?.trim()) {
    return { error: 'Note content is required' }
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      content: content.trim(),
      category: 'focus',
      focus_session_id: focusSessionId || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating quick note:', error)
    return { error: 'Failed to create note' }
  }

  revalidatePath('/notes')
  revalidatePath('/focus')
  return { success: true, note: data }
}

