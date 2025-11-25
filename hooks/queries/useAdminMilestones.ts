'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export interface AdminMilestone {
    id: number
    title: string
    description: string
    session_threshold: number
    badge_icon: string
    badge_color: string
    is_active: boolean
    created_at?: string
}

// Query keys factory
export const adminMilestonesKeys = {
    all: ['admin-milestones'] as const,
    lists: () => [...adminMilestonesKeys.all, 'list'] as const,
    detail: (id: number) => [...adminMilestonesKeys.all, 'detail', id] as const,
}

// Fetch all milestones
async function fetchAdminMilestones(): Promise<AdminMilestone[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .order('session_threshold', { ascending: true })

    if (error) throw error
    return data || []
}

// Create milestone
interface CreateMilestoneInput {
    title: string
    description: string
    session_threshold: number
    badge_icon: string
    badge_color: string
    is_active: boolean
}

async function createMilestone(input: CreateMilestoneInput): Promise<AdminMilestone> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('milestones')
        .insert(input)
        .select()
        .single()

    if (error) throw error
    return data
}

// Update milestone
interface UpdateMilestoneInput {
    id: number
    title: string
    description: string
    session_threshold: number
    badge_icon: string
    badge_color: string
    is_active: boolean
}

async function updateMilestone(input: UpdateMilestoneInput): Promise<AdminMilestone> {
    const supabase = createClient()
    const { id, ...updates } = input

    const { data, error } = await supabase
        .from('milestones')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

// Delete milestone
async function deleteMilestone(id: number): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// Toggle milestone active status
interface ToggleMilestoneActiveInput {
    id: number
    is_active: boolean
}

async function toggleMilestoneActive(input: ToggleMilestoneActiveInput): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('milestones')
        .update({ is_active: !input.is_active })
        .eq('id', input.id)

    if (error) throw error
}

// Query hooks
export function useAdminMilestones() {
    return useQuery({
        queryKey: adminMilestonesKeys.lists(),
        queryFn: fetchAdminMilestones,
        staleTime: 5 * 60 * 1000, // 5 minutes - milestones don't change often
        refetchOnWindowFocus: true,
    })
}

// Mutation hooks
export function useCreateMilestone() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createMilestone,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminMilestonesKeys.lists() })
        },
    })
}

export function useUpdateMilestone() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateMilestone,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminMilestonesKeys.lists() })
        },
    })
}

export function useDeleteMilestone() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteMilestone,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminMilestonesKeys.lists() })
        },
    })
}

export function useToggleMilestoneActive() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: toggleMilestoneActive,
        onMutate: async (input) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: adminMilestonesKeys.lists() })

            // Snapshot previous value
            const previousMilestones = queryClient.getQueryData<AdminMilestone[]>(adminMilestonesKeys.lists())

            // Optimistically update
            if (previousMilestones) {
                queryClient.setQueryData<AdminMilestone[]>(
                    adminMilestonesKeys.lists(),
                    previousMilestones.map(milestone =>
                        milestone.id === input.id
                            ? { ...milestone, is_active: !input.is_active }
                            : milestone
                    )
                )
            }

            return { previousMilestones }
        },
        onError: (_err, _input, context) => {
            // Rollback on error
            if (context?.previousMilestones) {
                queryClient.setQueryData(adminMilestonesKeys.lists(), context.previousMilestones)
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: adminMilestonesKeys.lists() })
        },
    })
}
