'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export interface AmbientSound {
    id: string
    title: string
    description: string | null
    file_url: string
    category: string
    duration: number | null
    play_count: number
}

// Query keys factory
export const soundKeys = {
    all: ['sounds'] as const,
    lists: () => [...soundKeys.all, 'list'] as const,
    list: (filters: string) => [...soundKeys.lists(), { filters }] as const,
    details: () => [...soundKeys.all, 'detail'] as const,
    detail: (id: string) => [...soundKeys.details(), id] as const,
}

// Fetch sounds
async function fetchSounds(): Promise<AmbientSound[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('ambient_sounds')
        .select('*')
        .order('play_count', { ascending: false })

    if (error) {
        throw error
    }

    return data || []
}

// Hook to fetch sounds
export function useSounds() {
    return useQuery({
        queryKey: soundKeys.lists(),
        queryFn: fetchSounds,
    })
}

// Increment play count
async function incrementPlayCount({ soundId, currentCount }: { soundId: string, currentCount: number }) {
    const supabase = createClient()

    const { error } = await supabase
        .from('ambient_sounds')
        .update({ play_count: currentCount + 1 })
        .eq('id', soundId)

    if (error) {
        throw error
    }
}

// Hook to increment play count
export function useIncrementPlayCount() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: incrementPlayCount,
        onSuccess: () => {
            // Invalidate sounds list to refetch updated counts
            queryClient.invalidateQueries({ queryKey: soundKeys.lists() })
        },
    })
}
