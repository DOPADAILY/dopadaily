'use server'

import { createClient } from '@/utils/supabase/server'

/**
 * Check voice note limits for current user
 */
export async function checkVoiceNoteLimit(estimatedDuration: number = 0) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase.rpc('check_voice_note_limit', {
    p_user_id: user.id,
    p_duration: estimatedDuration
  })

  if (error) {
    console.error('Error checking voice note limit:', error)
    throw error
  }

  return {
    canRecord: data.can_record as boolean,
    isPremium: data.is_premium as boolean,
    currentRecordings: data.current_recordings as number,
    maxRecordings: data.max_recordings as number,
    remainingRecordings: data.remaining_recordings as number,
    currentDuration: data.current_duration_seconds as number,
    maxDuration: data.max_duration_seconds as number,
    remainingDuration: data.remaining_duration_seconds as number,
  }
}

/**
 * Upload audio blob to Supabase Storage
 * Returns the file path (not URL) - use getSignedAudioUrl to get playable URL
 */
export async function uploadVoiceNote(audioData: {
  blob: Blob
  userId: string
  duration: number
}): Promise<{ path: string; size: number }> {
  const supabase = await createClient()

  // Generate unique filename with user ID folder
  const timestamp = Date.now()
  const fileName = `${audioData.userId}/${timestamp}.webm`

  // Convert blob to ArrayBuffer for upload
  const arrayBuffer = await audioData.blob.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  // Upload to storage
  const { error } = await supabase.storage
    .from('voice-notes')
    .upload(fileName, buffer, {
      contentType: audioData.blob.type || 'audio/webm',
      upsert: false
    })

  if (error) {
    console.error('Error uploading voice note:', error)
    throw new Error('Failed to upload voice note')
  }

  // Return the path - we'll generate signed URLs on-demand for playback
  return {
    path: fileName,
    size: audioData.blob.size
  }
}

/**
 * Get a signed URL for playing audio (valid for 1 hour)
 */
export async function getSignedAudioUrl(audioPath: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Verify the user owns this file (path starts with their user ID)
  if (!audioPath.startsWith(user.id + '/')) {
    throw new Error('Unauthorized access to audio file')
  }

  const { data, error } = await supabase.storage
    .from('voice-notes')
    .createSignedUrl(audioPath, 3600) // 1 hour expiry

  if (error) {
    console.error('Error creating signed URL:', error)
    throw new Error('Failed to get audio URL')
  }

  return data.signedUrl
}

/**
 * Delete audio file from storage
 * Accepts either a file path (e.g., "user-id/123456.webm") or a full URL
 */
export async function deleteVoiceNoteFile(audioPathOrUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  try {
    let filePath = audioPathOrUrl

    // If it's a URL, extract the path
    if (audioPathOrUrl.includes('://')) {
      const urlParts = audioPathOrUrl.split('/')
      const bucketIndex = urlParts.indexOf('voice-notes')

      if (bucketIndex === -1) {
        throw new Error('Invalid audio URL')
      }

      filePath = urlParts.slice(bucketIndex + 1).join('/')
    }

    // Verify file belongs to user
    if (!filePath.startsWith(user.id + '/')) {
      throw new Error('Unauthorized')
    }

    const { error } = await supabase.storage
      .from('voice-notes')
      .remove([filePath])

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting audio file:', error)
    throw error
  }
}

/**
 * Get current month's usage stats
 */
export async function getVoiceNotesUsage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get current month in YYYY-MM format
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data, error } = await supabase
    .from('voice_notes_usage')
    .select('*')
    .eq('user_id', user.id)
    .eq('month_year', currentMonth)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" - that's ok
    console.error('Error fetching usage:', error)
    throw error
  }

  return {
    totalRecordings: data?.total_recordings || 0,
    totalDurationSeconds: data?.total_duration_seconds || 0,
    totalSizeBytes: data?.total_size_bytes || 0,
  }
}

