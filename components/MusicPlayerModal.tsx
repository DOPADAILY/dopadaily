'use client'

import { useEffect, useState, useRef } from 'react'
import { X, Play, Pause, Volume2, VolumeX, Music, Repeat, Maximize2, Minimize2 } from 'lucide-react'

interface AmbientSound {
    id: string
    title: string
    description: string | null
    file_url: string
    category: string
    duration: number | null
    play_count: number
}

interface MusicPlayerModalProps {
    sound: AmbientSound
    isOpen: boolean
    onClose: () => void
    onPlayCountUpdate?: (soundId: string) => void
}

export default function MusicPlayerModal({ sound, isOpen, onClose, onPlayCountUpdate }: MusicPlayerModalProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [volume, setVolume] = useState(0.7)
    const [isMuted, setIsMuted] = useState(false)
    const [isLooping, setIsLooping] = useState(true)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isExpanded, setIsExpanded] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Initialize audio when modal opens (but don't auto-play)
    useEffect(() => {
        if (isOpen) {
            // Reset state
            setIsPlaying(false)
            setCurrentTime(0)
            setDuration(0)

            // Initialize audio (but don't play yet)
            const audio = new Audio(sound.file_url)
            audio.volume = isMuted ? 0 : volume
            audio.loop = isLooping
            audioRef.current = audio

            // Set up event listeners
            audio.addEventListener('loadedmetadata', () => {
                setDuration(audio.duration)
            })

            audio.addEventListener('ended', () => {
                if (!isLooping) {
                    setIsPlaying(false)
                }
            })

            // Update progress
            progressIntervalRef.current = setInterval(() => {
                if (audio && !audio.paused) {
                    setCurrentTime(audio.currentTime)
                }
            }, 100)

            return () => {
                if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current)
                }
                if (audio) {
                    audio.pause()
                    audio.src = ''
                }
            }
        }
    }, [isOpen, sound.id, isMuted, volume, isLooping])

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume
        }
    }, [volume, isMuted])

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.loop = isLooping
        }
    }, [isLooping])

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
                setIsPlaying(false)
            } else {
                audioRef.current.play()
                    .then(() => {
                        setIsPlaying(true)
                        // Increment play count only on first play
                        if (onPlayCountUpdate && currentTime === 0) {
                            onPlayCountUpdate(sound.id)
                        }
                    })
                    .catch(err => {
                        console.error('Failed to play audio:', err)
                        setIsPlaying(false)
                    })
            }
        }
    }

    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume)
        if (isMuted) setIsMuted(false)
    }

    const toggleMute = () => {
        setIsMuted(!isMuted)
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value)
        setCurrentTime(newTime)
        if (audioRef.current) {
            audioRef.current.currentTime = newTime
        }
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
            other: 'from-primary/20 to-secondary/20'
        }
        return colors[category] || colors.other
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div
                className={`bg-surface rounded-2xl shadow-2xl w-full transition-all duration-300 overflow-hidden ${isExpanded ? 'max-w-2xl' : 'max-w-md'
                    }`}
            >
                {/* Header */}
                <div className="relative px-6 pt-6 pb-4 border-b border-border/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                            {isPlaying ? 'Now Playing' : 'Ready to Play'}
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
                                onClick={onClose}
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
                        <div className={`p-6 rounded-full bg-surface/80 backdrop-blur-sm shadow-xl ${isPlaying ? 'animate-pulse' : ''}`}>
                            <Music size={isExpanded ? 64 : 48} className="text-primary" />
                        </div>

                        {/* Equalizer bars */}
                        {isPlaying && (
                            <div className="flex items-end gap-1.5 h-16">
                                {[...Array(isExpanded ? 8 : 5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-2 bg-primary rounded-full animate-pulse"
                                        style={{
                                            height: `${20 + Math.random() * 60}%`,
                                            animationDelay: `${i * 100}ms`,
                                            animationDuration: `${600 + Math.random() * 400}ms`
                                        }}
                                    ></div>
                                ))}
                            </div>
                        )}
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
                        {/* Progress fill */}
                        <div
                            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-100"
                            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                        />
                        {/* Slider input (invisible but interactive) */}
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-on-surface-secondary">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="px-6 py-5 flex items-center justify-between gap-4">
                    {/* Loop toggle */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsLooping(!isLooping)
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
                    <button
                        onClick={togglePlayPause}
                        className="p-5 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
                    >
                        {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                    </button>

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

