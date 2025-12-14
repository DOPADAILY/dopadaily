'use client'

import { Loader2, AlertCircle, Mic } from 'lucide-react'
import AudioPlayer from '@/components/AudioPlayer'
import { useSignedAudioUrl } from '@/hooks/queries'

type SignedAudioPlayerProps = {
  audioPath: string
  duration?: number
  onDelete?: () => void
  showDelete?: boolean
  className?: string
}

/**
 * Audio player that fetches signed URLs for private bucket audio files.
 * Use this for audio stored in the database (which stores paths, not URLs).
 */
export default function SignedAudioPlayer({
  audioPath,
  duration,
  onDelete,
  showDelete = false,
  className = ''
}: SignedAudioPlayerProps) {
  const { data: signedUrl, isLoading, error } = useSignedAudioUrl(audioPath)

  if (isLoading) {
    return (
      <div className={`rounded-xl border-2 border-border bg-surface-elevated p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
            <Loader2 size={18} className="text-primary animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="h-2 bg-border rounded-full animate-pulse" />
            <div className="flex items-center justify-between mt-1.5">
              <div className="h-3 w-10 bg-border rounded animate-pulse" />
              <div className="h-3 w-10 bg-border rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !signedUrl) {
    return (
      <div className={`rounded-xl border-2 border-error/30 bg-error/5 p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-full bg-error/20 flex items-center justify-center">
            <AlertCircle size={18} className="text-error" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-error">Failed to load audio</div>
            <div className="text-xs text-on-surface-secondary mt-0.5">
              {error?.message || 'Unable to access audio file'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AudioPlayer
      audioUrl={signedUrl}
      duration={duration}
      onDelete={onDelete}
      showDelete={showDelete}
      className={className}
    />
  )
}

/**
 * Compact version for note cards
 */
export function CompactSignedAudioPlayer({
  audioPath,
  duration,
}: {
  audioPath: string
  duration?: number
}) {
  const { data: signedUrl, isLoading, error } = useSignedAudioUrl(audioPath)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10">
        <Loader2 size={14} className="text-primary animate-spin" />
        <span className="text-xs text-on-surface-secondary">Loading audio...</span>
      </div>
    )
  }

  if (error || !signedUrl) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-error/10">
        <AlertCircle size={14} className="text-error" />
        <span className="text-xs text-error">Audio unavailable</span>
      </div>
    )
  }

  return (
    <div className="mt-2">
      <audio src={signedUrl} controls className="w-full h-8" style={{ minHeight: '32px' }} />
      {duration && (
        <div className="text-xs text-on-surface-secondary mt-1 flex items-center gap-1">
          <Mic size={12} />
          <span>{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</span>
        </div>
      )}
    </div>
  )
}
