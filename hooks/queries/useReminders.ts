'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export interface Reminder {
  id: number
  title: string
  message: string | null
  remind_at: string
  is_global: boolean
  created_by: string
  created_at?: string
  updated_at?: string
}

// Query keys factory
export const reminderKeys = {
  all: ['reminders'] as const,
  lists: () => [...reminderKeys.all, 'list'] as const,
  upcoming: () => [...reminderKeys.lists(), 'upcoming'] as const,
  past: () => [...reminderKeys.lists(), 'past'] as const,
}

// Fetch reminders
interface FetchRemindersResult {
  upcoming: Reminder[]
  past: Reminder[]
}

async function fetchReminders(): Promise<FetchRemindersResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const now = new Date().toISOString()
  
  // Fetch upcoming and past reminders in parallel
  const [upcomingResult, pastResult] = await Promise.all([
    supabase
      .from('reminders')
      .select('*')
      .or(`created_by.eq.${user.id},is_global.eq.true`)
      .gte('remind_at', now)
      .order('remind_at', { ascending: true }),
    supabase
      .from('reminders')
      .select('*')
      .or(`created_by.eq.${user.id},is_global.eq.true`)
      .lt('remind_at', now)
      .order('remind_at', { ascending: false })
      .limit(10),
  ])
  
  if (upcomingResult.error) throw upcomingResult.error
  if (pastResult.error) throw pastResult.error
  
  return {
    upcoming: upcomingResult.data || [],
    past: pastResult.data || [],
  }
}

// Create reminder
interface CreateReminderInput {
  title: string
  message?: string | null
  remind_at: string
  is_global?: boolean
}

async function createReminderApi(input: CreateReminderInput): Promise<Reminder> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('reminders')
    .insert({
      created_by: user.id,
      title: input.title,
      message: input.message || null,
      is_global: input.is_global || false,
      remind_at: new Date(input.remind_at).toISOString(),
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Update reminder
interface UpdateReminderInput {
  id: number
  title: string
  message?: string | null
  remind_at: string
  is_global?: boolean
}

async function updateReminderApi(input: UpdateReminderInput): Promise<Reminder> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('reminders')
    .update({
      title: input.title,
      message: input.message || null,
      is_global: input.is_global || false,
      remind_at: new Date(input.remind_at).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Delete reminder
async function deleteReminderApi(id: number): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Query hook
export function useReminders() {
  return useQuery({
    queryKey: reminderKeys.lists(),
    queryFn: fetchReminders,
  })
}

// Mutation hooks with optimistic updates
export function useCreateReminder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createReminderApi,
    onMutate: async (newReminder) => {
      await queryClient.cancelQueries({ queryKey: reminderKeys.lists() })
      
      const previousData = queryClient.getQueryData<FetchRemindersResult>(reminderKeys.lists())
      
      // Create optimistic reminder
      const optimisticReminder: Reminder = {
        id: Date.now(), // Temporary ID
        title: newReminder.title,
        message: newReminder.message || null,
        remind_at: new Date(newReminder.remind_at).toISOString(),
        is_global: newReminder.is_global || false,
        created_by: 'temp',
      }
      
      const now = new Date()
      const reminderDate = new Date(newReminder.remind_at)
      
      queryClient.setQueryData<FetchRemindersResult>(reminderKeys.lists(), (old) => {
        if (!old) return { upcoming: [optimisticReminder], past: [] }
        
        if (reminderDate >= now) {
          // Add to upcoming, sort by date
          const newUpcoming = [...old.upcoming, optimisticReminder]
            .sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime())
          return { ...old, upcoming: newUpcoming }
        } else {
          // Add to past
          return { ...old, past: [optimisticReminder, ...old.past] }
        }
      })
      
      return { previousData }
    },
    onError: (_err, _newReminder, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(reminderKeys.lists(), context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() })
    },
  })
}

export function useUpdateReminder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateReminderApi,
    onMutate: async (updatedReminder) => {
      await queryClient.cancelQueries({ queryKey: reminderKeys.lists() })
      
      const previousData = queryClient.getQueryData<FetchRemindersResult>(reminderKeys.lists())
      
      queryClient.setQueryData<FetchRemindersResult>(reminderKeys.lists(), (old) => {
        if (!old) return old
        
        const updateInList = (list: Reminder[]) =>
          list.map((r) =>
            r.id === updatedReminder.id
              ? {
                  ...r,
                  title: updatedReminder.title,
                  message: updatedReminder.message || null,
                  remind_at: new Date(updatedReminder.remind_at).toISOString(),
                  is_global: updatedReminder.is_global || false,
                }
              : r
          )
        
        return {
          upcoming: updateInList(old.upcoming),
          past: updateInList(old.past),
        }
      })
      
      return { previousData }
    },
    onError: (_err, _updatedReminder, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(reminderKeys.lists(), context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() })
    },
  })
}

export function useDeleteReminder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteReminderApi,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: reminderKeys.lists() })
      
      const previousData = queryClient.getQueryData<FetchRemindersResult>(reminderKeys.lists())
      
      queryClient.setQueryData<FetchRemindersResult>(reminderKeys.lists(), (old) => {
        if (!old) return old
        
        return {
          upcoming: old.upcoming.filter((r) => r.id !== deletedId),
          past: old.past.filter((r) => r.id !== deletedId),
        }
      })
      
      return { previousData }
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(reminderKeys.lists(), context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.lists() })
    },
  })
}


