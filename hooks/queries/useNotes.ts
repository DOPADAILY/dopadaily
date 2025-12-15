'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Note, NoteCategory, NoteColor } from '@/app/notes/actions'

// Query keys factory
export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (userId: string) => [...noteKeys.lists(), userId] as const,
}

// Fetch notes for current user
async function fetchNotes(): Promise<Note[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

// Create note
interface CreateNoteInput {
  title?: string | null
  content?: string | null
  category?: NoteCategory
  color?: NoteColor
  focus_session_id?: string | null
  // Audio fields for voice notes
  audio_url?: string | null
  audio_duration?: number | null
  audio_size?: number | null
  audio_format?: string | null
}

async function createNoteApi(input: CreateNoteInput): Promise<Note> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  // Either content or audio must be provided
  if (!input.content?.trim() && !input.audio_url) {
    throw new Error('Note content or audio recording is required')
  }
  
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      title: input.title?.trim() || null,
      content: input.content?.trim() || null,
      category: input.category || 'general',
      color: input.color || 'default',
      focus_session_id: input.focus_session_id || null,
      audio_url: input.audio_url || null,
      audio_duration: input.audio_duration || null,
      audio_size: input.audio_size || null,
      audio_format: input.audio_format || null,
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Update note
interface UpdateNoteInput {
  id: string
  title?: string | null
  content?: string | null
  category?: NoteCategory
  color?: NoteColor
  // Audio fields for voice notes
  audio_url?: string | null
  audio_duration?: number | null
  audio_size?: number | null
  audio_format?: string | null
}

async function updateNoteApi(input: UpdateNoteInput): Promise<Note> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const updates: Partial<Note> = {}
  if (input.title !== undefined) updates.title = input.title?.trim() || null
  if (input.content !== undefined) updates.content = input.content?.trim() || null
  if (input.category !== undefined) updates.category = input.category
  if (input.color !== undefined) updates.color = input.color
  if (input.audio_url !== undefined) updates.audio_url = input.audio_url
  if (input.audio_duration !== undefined) updates.audio_duration = input.audio_duration
  if (input.audio_size !== undefined) updates.audio_size = input.audio_size
  if (input.audio_format !== undefined) updates.audio_format = input.audio_format
  
  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', input.id)
    .eq('user_id', user.id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Delete note
async function deleteNoteApi(id: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  
  if (error) throw error
}

// Toggle pin
async function togglePinApi(id: string, currentlyPinned: boolean): Promise<Note> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('notes')
    .update({ is_pinned: !currentlyPinned })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Query hook
export function useNotes() {
  return useQuery({
    queryKey: noteKeys.lists(),
    queryFn: fetchNotes,
  })
}

// Mutation hooks with optimistic updates
export function useCreateNote() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createNoteApi,
    onMutate: async (newNote) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: noteKeys.lists() })
      
      // Snapshot previous value
      const previousNotes = queryClient.getQueryData<Note[]>(noteKeys.lists())
      
      // Optimistically add the new note
      const optimisticNote: Note = {
        id: `temp-${Date.now()}`,
        user_id: 'temp',
        title: newNote.title || null,
        content: newNote.content || null,
        category: newNote.category || 'general',
        color: newNote.color || 'default',
        is_pinned: false,
        focus_session_id: newNote.focus_session_id || null,
        audio_url: newNote.audio_url || null,
        audio_duration: newNote.audio_duration || null,
        audio_size: newNote.audio_size || null,
        audio_format: newNote.audio_format || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      queryClient.setQueryData<Note[]>(noteKeys.lists(), (old) => 
        [optimisticNote, ...(old || [])]
      )
      
      return { previousNotes }
    },
    onError: (_err, _newNote, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        queryClient.setQueryData(noteKeys.lists(), context.previousNotes)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateNoteApi,
    onMutate: async (updatedNote) => {
      await queryClient.cancelQueries({ queryKey: noteKeys.lists() })
      
      const previousNotes = queryClient.getQueryData<Note[]>(noteKeys.lists())
      
      // Optimistically update the note
      queryClient.setQueryData<Note[]>(noteKeys.lists(), (old) =>
        old?.map((note) =>
          note.id === updatedNote.id
            ? {
                ...note,
                ...updatedNote,
                title: updatedNote.title?.trim() || null,
                content: updatedNote.content?.trim() || note.content,
                updated_at: new Date().toISOString(),
              }
            : note
        ) || []
      )
      
      return { previousNotes }
    },
    onError: (_err, _updatedNote, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(noteKeys.lists(), context.previousNotes)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteNoteApi,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: noteKeys.lists() })
      
      const previousNotes = queryClient.getQueryData<Note[]>(noteKeys.lists())
      
      // Optimistically remove the note
      queryClient.setQueryData<Note[]>(noteKeys.lists(), (old) =>
        old?.filter((note) => note.id !== deletedId) || []
      )
      
      return { previousNotes }
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(noteKeys.lists(), context.previousNotes)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
    },
  })
}

export function useTogglePin() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) => 
      togglePinApi(id, isPinned),
    onMutate: async ({ id, isPinned }) => {
      await queryClient.cancelQueries({ queryKey: noteKeys.lists() })
      
      const previousNotes = queryClient.getQueryData<Note[]>(noteKeys.lists())
      
      // Optimistically toggle the pin
      queryClient.setQueryData<Note[]>(noteKeys.lists(), (old) =>
        old?.map((note) =>
          note.id === id
            ? { ...note, is_pinned: !isPinned }
            : note
        ) || []
      )
      
      return { previousNotes }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(noteKeys.lists(), context.previousNotes)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
    },
  })
}


