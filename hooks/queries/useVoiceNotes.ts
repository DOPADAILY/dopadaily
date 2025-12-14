import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { checkVoiceNoteLimit, uploadVoiceNote, deleteVoiceNoteFile, getVoiceNotesUsage, getSignedAudioUrl } from '@/app/notes/voiceActions'
import { getAudioFormat } from '@/utils/audioRecording'

// Query keys
export const voiceNotesKeys = {
  all: ['voice-notes'] as const,
  limits: () => [...voiceNotesKeys.all, 'limits'] as const,
  usage: () => [...voiceNotesKeys.all, 'usage'] as const,
  signedUrl: (path: string) => [...voiceNotesKeys.all, 'signed-url', path] as const,
}

/**
 * Hook to check voice note limits
 */
export function useVoiceNoteLimit(estimatedDuration: number = 0) {
  return useQuery({
    queryKey: [...voiceNotesKeys.limits(), estimatedDuration],
    queryFn: () => checkVoiceNoteLimit(estimatedDuration),
    staleTime: 1000 * 60, // 1 minute
  })
}

/**
 * Hook to get current month's usage
 */
export function useVoiceNotesUsage() {
  return useQuery({
    queryKey: voiceNotesKeys.usage(),
    queryFn: () => getVoiceNotesUsage(),
    staleTime: 1000 * 60, // 1 minute
  })
}

/**
 * Hook to get signed URL for audio playback
 * Audio paths are stored in the database, this generates a temporary URL for playback
 */
export function useSignedAudioUrl(audioPath: string | null | undefined) {
  return useQuery({
    queryKey: voiceNotesKeys.signedUrl(audioPath || ''),
    queryFn: () => getSignedAudioUrl(audioPath!),
    enabled: !!audioPath,
    staleTime: 1000 * 60 * 30, // 30 minutes (URL valid for 1 hour)
    gcTime: 1000 * 60 * 45, // Keep in cache for 45 minutes
  })
}

/**
 * Mutation to upload voice note
 * Returns the file path (stored in DB) - use useSignedAudioUrl for playback
 */
export function useUploadVoiceNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ blob, duration }: { blob: Blob; duration: number }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check limits before upload
      const limits = await checkVoiceNoteLimit(duration)
      if (!limits.canRecord) {
        throw new Error('You have reached your monthly voice note limit. Upgrade to Premium for unlimited recordings.')
      }

      // Upload to storage - returns path, not URL
      const result = await uploadVoiceNote({
        blob,
        userId: user.id,
        duration
      })

      return {
        path: result.path,
        size: result.size,
        duration,
        format: getAudioFormat(blob)
      }
    },
    onSuccess: () => {
      // Invalidate limits and usage queries
      queryClient.invalidateQueries({ queryKey: voiceNotesKeys.limits() })
      queryClient.invalidateQueries({ queryKey: voiceNotesKeys.usage() })
    },
  })
}

/**
 * Mutation to delete voice note file
 */
export function useDeleteVoiceNoteFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (audioUrl: string) => {
      await deleteVoiceNoteFile(audioUrl)
      return { success: true }
    },
    onSuccess: () => {
      // Invalidate usage queries
      queryClient.invalidateQueries({ queryKey: voiceNotesKeys.usage() })
    },
  })
}

