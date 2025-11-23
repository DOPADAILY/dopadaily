'use client'

import { useAudioStore } from '@/stores/audioStore'
import { Play, Pause, Volume2, VolumeX, X, Maximize2 } from 'lucide-react'

export default function MiniPlayer() {
    const {
        currentSound,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        togglePlayPause,
        toggleMute,
        openModal,
        cleanup
    } = useAudioStore()

    if (!currentSound) return null

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '0:00'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-elevated border-t border-border shadow-xl">
            {/* Progress bar */}
            <div className="h-1 bg-backplate">
                <div
                    className="h-full bg-primary transition-all duration-100"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="px-4 py-3 flex items-center gap-4">
                {/* Sound info */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className="shrink-0 w-12 h-12 rounded-lg bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <span className="text-primary font-bold text-xs">
                            {currentSound.category.slice(0, 2).toUpperCase()}
                        </span>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-on-surface truncate">
                            {currentSound.title}
                        </h4>
                        <p className="text-xs text-on-surface-secondary">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    {/* Play/Pause */}
                    <button
                        onClick={togglePlayPause}
                        className="p-2 bg-primary hover:bg-primary/90 text-white rounded-full transition-all hover:scale-105"
                    >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                    </button>

                    {/* Volume */}
                    <button
                        onClick={toggleMute}
                        className="p-2 hover:bg-backplate rounded-full transition-colors hidden sm:flex"
                    >
                        {isMuted ? (
                            <VolumeX size={18} className="text-on-surface-secondary" />
                        ) : (
                            <Volume2 size={18} className="text-primary" />
                        )}
                    </button>

                    {/* Expand */}
                    <button
                        onClick={openModal}
                        className="p-2 hover:bg-backplate rounded-full transition-colors hidden sm:flex"
                        title="Open player"
                    >
                        <Maximize2 size={18} className="text-on-surface-secondary" />
                    </button>

                    {/* Close */}
                    <button
                        onClick={cleanup}
                        className="p-2 hover:bg-error/10 text-error rounded-full transition-colors"
                        title="Stop and close"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}

