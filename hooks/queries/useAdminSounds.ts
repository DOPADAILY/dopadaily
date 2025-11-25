'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export interface AdminSound {
    id: string
    title: string
    description: string | null
    file_url: string
    file_name: string
    file_size: number | null
    duration: number | null
    category: string
    is_active: boolean
    play_count: number
    created_at: string
    created_by?: string
}

// Query keys factory
export const adminSoundsKeys = {
    all: ['admin-sounds'] as const,
    lists: () => [...adminSoundsKeys.all, 'list'] as const,
    detail: (id: string) => [...adminSoundsKeys.all, 'detail', id] as const,
}

// Fetch all sounds
async function fetchAdminSounds(): Promise<AdminSound[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('ambient_sounds')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
}

// Upload sound
interface UploadSoundInput {
    title: string
    description: string
    category: string
    is_active: boolean
    file: File
    created_by: string
}

async function uploadSound(input: UploadSoundInput): Promise<AdminSound> {
    const supabase = createClient()

    // Sanitize filename
    const timestamp = Date.now()
    const sanitizedTitle = input.title.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const fileExt = input.file.name.split('.').pop()
    const fileName = `${timestamp}_${sanitizedTitle}.${fileExt}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ambient-sounds')
        .upload(fileName, input.file, {
            cacheControl: '3600',
            upsert: false
        })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('ambient-sounds')
        .getPublicUrl(fileName)

    // Get audio duration
    let duration: number | null = null
    try {
        const audio = new Audio(URL.createObjectURL(input.file))
        await new Promise((resolve) => {
            audio.addEventListener('loadedmetadata', () => {
                duration = Math.round(audio.duration)
                resolve(null)
            })
        })
    } catch (err) {
        console.log('Could not get duration:', err)
    }

    // Save metadata to database
    const { data: newSound, error: dbError } = await supabase
        .from('ambient_sounds')
        .insert({
            title: input.title,
            description: input.description || null,
            file_url: publicUrl,
            file_name: fileName,
            file_size: input.file.size,
            duration: duration,
            category: input.category,
            is_active: input.is_active,
            created_by: input.created_by
        })
        .select()
        .single()

    if (dbError) throw dbError

    // Log admin activity
    if (newSound) {
        await supabase
            .from('admin_audit_log')
            .insert({
                admin_id: input.created_by,
                action: 'created',
                target_table: 'ambient_sounds',
                target_id: newSound.id,
                details: `Uploaded sound: ${input.title} (${input.category})`
            })
    }

    return newSound
}

// Delete sound
interface DeleteSoundInput {
    id: string
    file_name: string
    title: string
    admin_id: string
}

async function deleteSound(input: DeleteSoundInput): Promise<void> {
    const supabase = createClient()

    // Delete from storage
    const { error: storageError } = await supabase.storage
        .from('ambient-sounds')
        .remove([input.file_name])

    if (storageError) console.error('Storage deletion error:', storageError)

    // Delete from database
    const { error: dbError } = await supabase
        .from('ambient_sounds')
        .delete()
        .eq('id', input.id)

    if (dbError) throw dbError

    // Log admin activity
    await supabase
        .from('admin_audit_log')
        .insert({
            admin_id: input.admin_id,
            action: 'deleted',
            target_table: 'ambient_sounds',
            target_id: input.id,
            details: `Deleted sound: ${input.title}`
        })
}

// Toggle sound active status
interface ToggleSoundActiveInput {
    id: string
    is_active: boolean
    title: string
    admin_id: string
}

async function toggleSoundActive(input: ToggleSoundActiveInput): Promise<void> {
    const supabase = createClient()
    const newStatus = !input.is_active

    const { error } = await supabase
        .from('ambient_sounds')
        .update({ is_active: newStatus })
        .eq('id', input.id)

    if (error) throw error

    // Log admin activity
    await supabase
        .from('admin_audit_log')
        .insert({
            admin_id: input.admin_id,
            action: 'updated',
            target_table: 'ambient_sounds',
            target_id: input.id,
            details: `${newStatus ? 'Activated' : 'Deactivated'} sound: ${input.title}`
        })
}

// Query hooks
export function useAdminSounds() {
    return useQuery({
        queryKey: adminSoundsKeys.lists(),
        queryFn: fetchAdminSounds,
        staleTime: 2 * 60 * 1000, // 2 minutes
        refetchOnWindowFocus: true,
    })
}

// Mutation hooks
export function useUploadSound() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: uploadSound,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminSoundsKeys.lists() })
        },
    })
}

export function useDeleteSound() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteSound,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminSoundsKeys.lists() })
        },
    })
}

export function useToggleSoundActive() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: toggleSoundActive,
        onMutate: async (input) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: adminSoundsKeys.lists() })

            // Snapshot previous value
            const previousSounds = queryClient.getQueryData<AdminSound[]>(adminSoundsKeys.lists())

            // Optimistically update
            if (previousSounds) {
                queryClient.setQueryData<AdminSound[]>(
                    adminSoundsKeys.lists(),
                    previousSounds.map(sound =>
                        sound.id === input.id
                            ? { ...sound, is_active: !input.is_active }
                            : sound
                    )
                )
            }

            return { previousSounds }
        },
        onError: (_err, _input, context) => {
            // Rollback on error
            if (context?.previousSounds) {
                queryClient.setQueryData(adminSoundsKeys.lists(), context.previousSounds)
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: adminSoundsKeys.lists() })
        },
    })
}
