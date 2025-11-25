'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  role: string
  daily_goal: number
  default_focus_duration: number
  default_break_duration: number
  is_banned: boolean
  banned_until: string | null
  created_at: string
  updated_at: string
}

// Query keys factory
export const profileKeys = {
  all: ['profile'] as const,
  current: () => [...profileKeys.all, 'current'] as const,
  byId: (id: string) => [...profileKeys.all, 'user', id] as const,
}

// Fetch current user profile
async function fetchCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) throw error
  return data
}

// Update profile
interface UpdateProfileInput {
  username?: string
  full_name?: string | null
  daily_goal?: number
  default_focus_duration?: number
  default_break_duration?: number
}

async function updateProfileApi(input: UpdateProfileInput): Promise<Profile> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  // Validate username if provided
  if (input.username !== undefined) {
    if (input.username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters long')
    }
    
    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', input.username)
      .neq('id', user.id)
      .single()
    
    if (existingUser) {
      throw new Error('Username is already taken')
    }
  }
  
  // Validate other fields
  if (input.daily_goal !== undefined && (input.daily_goal < 1 || input.daily_goal > 20)) {
    throw new Error('Daily goal must be between 1 and 20 sessions')
  }
  
  if (input.default_focus_duration !== undefined && 
      (input.default_focus_duration < 5 || input.default_focus_duration > 60)) {
    throw new Error('Focus duration must be between 5 and 60 minutes')
  }
  
  if (input.default_break_duration !== undefined && 
      (input.default_break_duration < 1 || input.default_break_duration > 30)) {
    throw new Error('Break duration must be between 1 and 30 minutes')
  }
  
  const updates: Partial<Profile> & { updated_at: string } = {
    updated_at: new Date().toISOString(),
  }
  
  if (input.username !== undefined) updates.username = input.username
  if (input.full_name !== undefined) updates.full_name = input.full_name?.trim() || null
  if (input.daily_goal !== undefined) updates.daily_goal = input.daily_goal
  if (input.default_focus_duration !== undefined) updates.default_focus_duration = input.default_focus_duration
  if (input.default_break_duration !== undefined) updates.default_break_duration = input.default_break_duration
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Query hooks
export function useProfile() {
  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: fetchCurrentProfile,
    staleTime: 10 * 60 * 1000, // Profile data is stable, keep for 10 minutes
  })
}

// Mutation hooks with optimistic updates
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateProfileApi,
    onMutate: async (updatedProfile) => {
      await queryClient.cancelQueries({ queryKey: profileKeys.current() })
      
      const previousProfile = queryClient.getQueryData<Profile>(profileKeys.current())
      
      // Optimistically update the profile
      if (previousProfile) {
        queryClient.setQueryData<Profile>(profileKeys.current(), {
          ...previousProfile,
          ...updatedProfile,
          updated_at: new Date().toISOString(),
        })
      }
      
      return { previousProfile }
    },
    onError: (_err, _updatedProfile, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(profileKeys.current(), context.previousProfile)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.current() })
    },
  })
}


