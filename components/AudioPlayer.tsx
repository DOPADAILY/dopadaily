'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Download, Trash2, Volume2 } from 'lucide-react'
import { formatDuration } from '@/utils/audioRecording'

type AudioPlayerProps = {
  audioUrl: string
  duration?: number
  onDelete?: () => void
  showDelete?: boolean
  className?: string
}

export default function AudioPlayer({
  audioUrl,
  duration,
  onDelete,
  showDelete = false,
  className = ''
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration || 0)
  const [volume, setVolume] = useState(1)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const time = parseFloat(e.target.value)
    audio.currentTime = time
    setCurrentTime(time)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = parseFloat(e.target.value)
    audio.volume = newVolume
    setVolume(newVolume)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = audioUrl
    link.download = `voice-note-${Date.now()}.webm`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0

  return (
    <div className={`rounded-xl border-2 border-border bg-surface-elevated p-4 ${className}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="w-10 h-10 shrink-0 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center transition-colors active:scale-95"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>

        {/* Progress & Time */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            {/* Progress Bar Background */}
            <div className="h-2 bg-border rounded-full overflow-hidden">
              {/* Progress Bar Fill */}
              <div
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Seek Slider (invisible but interactive) */}
            <input
              type="range"
              min="0"
              max={audioDuration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Seek"
            />
          </div>

          {/* Time Display */}
          <div className="flex items-center justify-between mt-1.5 text-xs text-on-surface-secondary tabular-nums">
            <span>{formatDuration(Math.floor(currentTime))}</span>
            <span>{formatDuration(Math.floor(audioDuration))}</span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            className="p-2 hover:bg-backplate rounded-lg transition-colors"
            aria-label="Volume"
          >
            <Volume2 size={18} className="text-on-surface-secondary" />
          </button>

          {showVolumeSlider && (
            <div className="absolute right-0 bottom-full mb-2 p-3 bg-surface-elevated border-2 border-border rounded-lg shadow-lg z-10">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-2 bg-border rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                aria-label="Volume level"
              />
            </div>
          )}
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="p-2 hover:bg-backplate rounded-lg transition-colors"
          title="Download"
        >
          <Download size={18} className="text-on-surface-secondary" />
        </button>

        {/* Delete Button */}
        {showDelete && onDelete && (
          <button
            onClick={onDelete}
            className="p-2 hover:bg-error/10 rounded-lg transition-colors"
            title="Delete recording"
          >
            <Trash2 size={18} className="text-error" />
          </button>
        )}
      </div>
    </div>
  )
}

