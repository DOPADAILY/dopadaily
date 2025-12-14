'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, Square, Pause, Play, Trash2, Check, Loader2, AlertCircle } from 'lucide-react'
import { AudioRecorder, formatDuration, formatFileSize, isAudioRecordingSupported } from '@/utils/audioRecording'
import Toast from './Toast'

type VoiceRecorderProps = {
  onRecordingComplete: (blob: Blob, duration: number) => void
  onCancel: () => void
  maxDuration?: number // in seconds, default 900 (15 minutes)
  isUploading?: boolean
}

export default function VoiceRecorder({
  onRecordingComplete,
  onCancel,
  maxDuration = 900,
  isUploading = false
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  const recorderRef = useRef<AudioRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Check browser support
  useEffect(() => {
    if (!isAudioRecordingSupported()) {
      setError('Your browser does not support audio recording. Please use a modern browser like Chrome, Firefox, or Edge.')
    }
  }, [])

  // Timer for updating duration
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        if (recorderRef.current) {
          const currentDuration = recorderRef.current.getCurrentDuration()
          setDuration(currentDuration)

          // Auto-stop if max duration reached
          if (currentDuration >= maxDuration) {
            handleStop()
          }
        }
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording, isPaused, maxDuration])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.cleanup()
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const handleStartRecording = async () => {
    try {
      setError(null)
      setIsInitializing(true)

      // Initialize recorder
      if (!recorderRef.current) {
        recorderRef.current = new AudioRecorder()
        await recorderRef.current.initialize()
      }

      recorderRef.current.start()
      setIsRecording(true)
      setDuration(0)
    } catch (err: any) {
      setError(err.message)
      if (recorderRef.current) {
        recorderRef.current.cleanup()
        recorderRef.current = null
      }
    } finally {
      setIsInitializing(false)
    }
  }

  const handlePauseResume = () => {
    if (!recorderRef.current) return

    if (isPaused) {
      recorderRef.current.resume()
      setIsPaused(false)
    } else {
      recorderRef.current.pause()
      setIsPaused(true)
    }
  }

  const handleStop = async () => {
    if (!recorderRef.current) return

    try {
      const { blob, url, duration: finalDuration } = await recorderRef.current.stop()
      setAudioBlob(blob)
      setAudioUrl(url)
      setDuration(finalDuration)
      setIsRecording(false)
      setIsPaused(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDiscard = () => {
    if (recorderRef.current) {
      recorderRef.current.cleanup()
      recorderRef.current = null
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setIsRecording(false)
    setIsPaused(false)
  }

  const handleSave = () => {
    if (audioBlob && duration > 0) {
      onRecordingComplete(audioBlob, duration)
    }
  }

  const handleCancel = () => {
    handleDiscard()
    onCancel()
  }

  // Calculate progress percentage
  const progressPercentage = (duration / maxDuration) * 100
  const isNearLimit = duration >= maxDuration * 0.9 // 90% of max
  const remainingTime = maxDuration - duration

  return (
    <div className="space-y-6">
      {/* Recording Status */}
      {!audioBlob ? (
        <div className="flex flex-col items-center gap-6">
          {/* Visual Indicator */}
          <div className="relative">
            <div
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording && !isPaused
                ? 'bg-error/20 animate-pulse'
                : isPaused
                  ? 'bg-warning/20'
                  : 'bg-primary/20'
                }`}
            >
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center ${isRecording && !isPaused
                  ? 'bg-error/40'
                  : isPaused
                    ? 'bg-warning/40'
                    : 'bg-primary/40'
                  }`}
              >
                <Mic
                  size={48}
                  className={`${isRecording && !isPaused
                    ? 'text-error'
                    : isPaused
                      ? 'text-warning'
                      : 'text-primary'
                    }`}
                />
              </div>
            </div>

            {/* Progress Ring */}
            {isRecording && (
              <svg className="absolute inset-0 -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className={isNearLimit ? 'text-error' : 'text-primary'}
                  strokeDasharray={`${(progressPercentage * 376.99) / 100} 376.99`}
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>

          {/* Timer */}
          <div className="text-center">
            <div className="text-4xl font-bold text-on-surface tabular-nums">
              {formatDuration(duration)}
            </div>
            {isRecording && (
              <div className={`text-sm mt-2 ${isNearLimit ? 'text-error font-semibold' : 'text-on-surface-secondary'}`}>
                {isNearLimit
                  ? `${formatDuration(remainingTime)} remaining`
                  : `Max: ${formatDuration(maxDuration)}`}
              </div>
            )}
            {isPaused && (
              <div className="text-sm text-warning font-medium mt-2">
                Recording paused
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {!isRecording ? (
              <button
                type="button"
                onClick={handleStartRecording}
                disabled={isInitializing || !!error}
                className="btn btn-primary px-8 py-3 rounded-full flex items-center gap-2 disabled:opacity-50"
              >
                {isInitializing ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Mic size={20} />
                )}
                Start Recording
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handlePauseResume}
                  className="p-4 rounded-full bg-warning/10 hover:bg-warning/20 text-warning transition-colors"
                  title={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? <Play size={24} /> : <Pause size={24} />}
                </button>

                <button
                  type="button"
                  onClick={handleStop}
                  className="p-4 rounded-full bg-error/10 hover:bg-error/20 text-error transition-colors"
                  title="Stop"
                >
                  <Square size={24} />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 rounded-full border-2 border-border hover:bg-backplate transition-colors text-on-surface-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Preview & Save */
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border-2 border-success">
            <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center shrink-0">
              <Check size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-on-surface">Recording Complete!</div>
              <div className="text-sm text-on-surface-secondary">
                Duration: {formatDuration(duration)} • Size: {formatFileSize(audioBlob.size)}
              </div>
            </div>
          </div>

          {/* Audio Preview */}
          {audioUrl && (
            <div className="p-4 rounded-xl border-2 border-border bg-surface-elevated">
              <audio src={audioUrl} controls className="w-full" />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isUploading}
              className="btn btn-primary flex-1 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check size={20} />
                  Save Voice Note
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDiscard}
              disabled={isUploading}
              className="px-6 py-3 rounded-xl border-2 border-border hover:bg-backplate transition-colors text-on-surface-secondary disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 size={20} />
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-error/10 border-2 border-error">
          <AlertCircle size={20} className="text-error shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-error text-sm">Error</div>
            <div className="text-sm text-on-surface-secondary mt-1">{error}</div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {!isRecording && !audioBlob && !error && (
        <div className="text-center text-sm text-on-surface-secondary">
          <p>Click "Start Recording" to begin recording your voice note.</p>
          <p className="mt-1">Maximum duration: {formatDuration(maxDuration)}</p>
        </div>
      )}
    </div>
  )
}

