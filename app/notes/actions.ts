'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type NoteCategory = 'general' | 'focus' | 'ideas' | 'reflections' | 'goals'
export type NoteColor = 'default' | 'blue' | 'green' | 'yellow' | 'purple' | 'pink'

export interface Note {
  id: string
  user_id: string
  title: string | null
  content: string | null
  category: NoteCategory
  is_pinned: boolean
  focus_session_id: string | null
  color: NoteColor
  audio_url: string | null
  audio_duration: number | null
  audio_size: number | null
  audio_format: string | null
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
  const content = formData.get('content') as string | null
  const category = (formData.get('category') as NoteCategory) || 'general'
  const color = (formData.get('color') as NoteColor) || 'default'
  const focusSessionId = formData.get('focus_session_id') as string | null

  // Audio fields
  const audioUrl = formData.get('audio_url') as string | null
  const audioDuration = formData.get('audio_duration') as string | null
  const audioSize = formData.get('audio_size') as string | null
  const audioFormat = formData.get('audio_format') as string | null

  // Either content or audio must be provided
  if (!content?.trim() && !audioUrl) {
    return { error: 'Note content or audio recording is required' }
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      title: title?.trim() || null,
      content: content?.trim() || null,
      category,
      color,
      focus_session_id: focusSessionId || null,
      audio_url: audioUrl,
      audio_duration: audioDuration ? parseInt(audioDuration) : null,
      audio_size: audioSize ? parseInt(audioSize) : null,
      audio_format: audioFormat,
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
  const content = formData.get('content') as string | null
  const category = (formData.get('category') as NoteCategory) || 'general'
  const color = (formData.get('color') as NoteColor) || 'default'

  // Audio fields
  const audioUrl = formData.get('audio_url') as string | null
  const audioDuration = formData.get('audio_duration') as string | null
  const audioSize = formData.get('audio_size') as string | null
  const audioFormat = formData.get('audio_format') as string | null

  if (!id) {
    return { error: 'Note ID is required' }
  }

  // Either content or audio must be provided
  if (!content?.trim() && !audioUrl) {
    return { error: 'Note content or audio recording is required' }
  }

  const { error } = await supabase
    .from('notes')
    .update({
      title: title?.trim() || null,
      content: content?.trim() || null,
      category,
      color,
      audio_url: audioUrl,
      audio_duration: audioDuration ? parseInt(audioDuration) : null,
      audio_size: audioSize ? parseInt(audioSize) : null,
      audio_format: audioFormat,
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

  // Get note to check if it has audio
  const { data: note } = await supabase
    .from('notes')
    .select('audio_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  // Delete audio file from storage if exists
  if (note?.audio_url) {
    try {
      // Extract file path from URL
      const urlParts = note.audio_url.split('/')
      const bucketIndex = urlParts.indexOf('voice-notes')
      if (bucketIndex !== -1) {
        const filePath = urlParts.slice(bucketIndex + 1).join('/')
        await supabase.storage.from('voice-notes').remove([filePath])
      }
    } catch (storageError) {
      console.error('Error deleting audio file:', storageError)
      // Continue with note deletion even if audio deletion fails
    }
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

