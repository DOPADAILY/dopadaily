'use client'

import { useState } from 'react'
import { X, Play, Pause, Volume2, VolumeX, Music, Repeat, Maximize2, Minimize2, Loader2 } from 'lucide-react'
import { useAudioStore } from '@/stores/audioStore'

export default function MusicPlayerModal() {
    const [isExpanded, setIsExpanded] = useState(false)

    const {
        currentSound,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        volume,
        isMuted,
        isLooping,
        isModalOpen,
        togglePlayPause,
        seek,
        setVolume: updateVolume,
        toggleMute,
        toggleLoop,
        closeModal
    } = useAudioStore()

    if (!isModalOpen || !currentSound) return null

    const sound = currentSound

    const handleVolumeChange = (newVolume: number) => {
        updateVolume(newVolume)
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value)
        seek(newTime)
    }

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '0:00'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getCategoryColor = (category: string) => {
        const colors: { [key: string]: string } = {
            nature: 'from-green-500/20 to-emerald-500/20',
            white_noise: 'from-gray-500/20 to-slate-500/20',
            binaural: 'from-purple-500/20 to-pink-500/20',
            lofi: 'from-orange-500/20 to-red-500/20',
            meditation: 'from-blue-500/20 to-cyan-500/20',
            rain: 'from-indigo-500/20 to-blue-500/20',
            ocean: 'from-cyan-500/20 to-teal-500/20',
            forest: 'from-green-600/20 to-lime-500/20',
            '8d_audio': 'from-violet-500/20 to-purple-500/20',
            other: 'from-primary/20 to-secondary/20'
        }
        return colors[category] || colors.other
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div
                className={`bg-surface rounded-2xl shadow-2xl w-full transition-all duration-300 overflow-hidden ${isExpanded ? 'max-w-2xl' : 'max-w-md'
                    }`}
            >
                {/* Header */}
                <div className="relative px-6 pt-6 pb-4 border-b border-border/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                            {isLoading ? (
                                <>
                                    <Loader2 size={12} className="animate-spin" />
                                    Loading...
                                </>
                            ) : isPlaying ? (
                                'Now Playing'
                            ) : (
                                'Ready to Play'
                            )}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-2 hover:bg-backplate rounded-lg transition-colors"
                                title={isExpanded ? 'Minimize' : 'Expand'}
                            >
                                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-backplate rounded-lg transition-colors"
                                title="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Album Art / Visualizer */}
                <div className={`relative bg-linear-to-br ${getCategoryColor(sound.category)} ${isExpanded ? 'h-64' : 'h-48'} flex items-center justify-center transition-all duration-300`}>
                    {/* Animated waves in background */}
                    <div className="absolute inset-0 overflow-hidden">
                        {isPlaying && (
                            <>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-primary/10 rounded-full animate-ping" style={{ animationDuration: '4s' }}></div>
                            </>
                        )}
                    </div>

                    {/* Music icon */}
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className={`p-6 rounded-full bg-surface/80 backdrop-blur-sm shadow-xl transition-all duration-300 ${isPlaying ? 'animate-sound-pulse scale-105' : ''}`}>
                            <Music size={isExpanded ? 64 : 48} className={`text-primary transition-transform duration-300 ${isPlaying ? 'animate-spin-slow' : ''}`} />
                        </div>

                        {/* Waveform Equalizer bars */}
                        <div className={`flex items-end justify-center gap-1 h-16 transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-30'}`}>
                            {[...Array(isExpanded ? 12 : 7)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1.5 bg-linear-to-t from-primary to-primary-light rounded-full transition-all ${isPlaying ? 'waveform-bar' : ''}`}
                                    style={{
                                        height: isPlaying ? undefined : '20%',
                                        minHeight: '8px',
                                        animationDelay: `${i * 0.1}s`,
                                        animationDuration: `${0.8 + Math.random() * 0.4}s`,
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Category badge */}
                    <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-surface/90 backdrop-blur-sm text-xs font-semibold text-primary rounded-full border border-primary/20">
                            {sound.category.replace('_', ' ').toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Song Info */}
                <div className="px-6 py-4 border-b border-border/50">
                    <h2 className="text-2xl font-bold text-on-surface mb-2 truncate">
                        {sound.title}
                    </h2>
                    {sound.description && (
                        <p className="text-sm text-on-surface-secondary line-clamp-2">
                            {sound.description}
                        </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-on-surface-secondary">
                        <span>{sound.play_count} plays</span>
                        {duration > 0 && <span>• {formatTime(duration)}</span>}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="px-6 py-3">
                    <div className="relative w-full h-2 bg-backplate rounded-full overflow-hidden">
                        {isLoading ? (
                            /* Spotify-like loading shimmer */
                            <div className="absolute inset-0 animate-shimmer" />
                        ) : (
                            /* Progress fill */
                            <div
                                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-100"
                                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                            />
                        )}
                        {/* Slider input (invisible but interactive) */}
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            disabled={isLoading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
                        />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-on-surface-secondary">
                        <span>{isLoading ? '—' : formatTime(currentTime)}</span>
                        <span>{isLoading ? 'Loading...' : formatTime(duration)}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="px-6 py-5 flex items-center justify-between gap-4">
                    {/* Loop toggle */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleLoop()
                        }}
                        className={`p-3 rounded-full transition-all ${isLooping
                            ? 'bg-primary/20 text-primary'
                            : 'hover:bg-backplate text-on-surface-secondary'
                            }`}
                        title={isLooping ? 'Looping enabled' : 'Looping disabled'}
                    >
                        <Repeat size={20} />
                    </button>

                    {/* Play/Pause button */}
                    <div className="relative">
                        {isPlaying && (
                            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
                        )}
                        <button
                            onClick={togglePlayPause}
                            disabled={isLoading}
                            className={`relative p-5 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-wait ${isPlaying ? 'btn-glow hover:shadow-xl' : 'hover:scale-105 hover:shadow-xl'
                                }`}
                        >
                            {isLoading ? (
                                <Loader2 size={28} className="animate-spin" />
                            ) : isPlaying ? (
                                <Pause size={28} />
                            ) : (
                                <Play size={28} className="ml-1" />
                            )}
                        </button>
                    </div>

                    {/* Volume control */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                toggleMute()
                            }}
                            className="p-3 hover:bg-backplate rounded-full transition-colors"
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? (
                                <VolumeX size={20} className="text-on-surface-secondary" />
                            ) : (
                                <Volume2 size={20} className="text-primary" />
                            )}
                        </button>
                        {isExpanded && (
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={isMuted ? 0 : volume}
                                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                className="w-20 accent-primary"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
