'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export interface GlobalReminder {
    id: number
    title: string
    message: string | null
    category: string
    remind_at: string
    recurrence_pattern: string | null
    is_global: boolean
    created_at: string
    created_by?: string
}

// Query keys factory
export const adminRemindersKeys = {
    all: ['admin-reminders'] as const,
    lists: () => [...adminRemindersKeys.all, 'list'] as const,
    detail: (id: number) => [...adminRemindersKeys.all, 'detail', id] as const,
}

// Fetch global reminders
async function fetchAdminReminders(): Promise<GlobalReminder[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('is_global', true)
        .order('remind_at', { ascending: true })

    if (error) throw error
    return data || []
}

// Create global reminder
interface CreateGlobalReminderInput {
    title: string
    message: string | null
    category: string
    remind_at: string
    recurrence_pattern: string | null
    created_by: string
}

async function createGlobalReminder(input: CreateGlobalReminderInput): Promise<GlobalReminder> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('reminders')
        .insert({
            ...input,
            is_global: true,
        })
        .select()
        .single()

    if (error) throw error
    return data
}

// Update global reminder
interface UpdateGlobalReminderInput {
    id: number
    title: string
    message: string | null
    category: string
    remind_at: string
    recurrence_pattern: string | null
}

async function updateGlobalReminder(input: UpdateGlobalReminderInput): Promise<GlobalReminder> {
    const supabase = createClient()
    const { id, ...updates } = input

    const { data, error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

// Delete global reminder
async function deleteGlobalReminder(id: number): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// Query hooks
export function useAdminReminders() {
    return useQuery({
        queryKey: adminRemindersKeys.lists(),
        queryFn: fetchAdminReminders,
        staleTime: 1 * 60 * 1000, // 1 minute
        refetchOnWindowFocus: true,
    })
}

// Mutation hooks
export function useCreateGlobalReminder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createGlobalReminder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminRemindersKeys.lists() })
        },
    })
}

export function useUpdateGlobalReminder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateGlobalReminder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminRemindersKeys.lists() })
        },
    })
}

export function useDeleteGlobalReminder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteGlobalReminder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminRemindersKeys.lists() })
        },
    })
}
