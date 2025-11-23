'use client'

import { useEffect, useState } from 'react'
import { X, Award, Sparkles } from 'lucide-react'

interface Milestone {
    id: number
    title: string
    description: string
    badge_icon: string
    badge_color: string
    session_threshold: number
}

interface AchievementModalProps {
    isOpen: boolean
    onClose: () => void
    milestone: Milestone | null
}

export default function AchievementModal({ isOpen, onClose, milestone }: AchievementModalProps) {
    const [confettiKey, setConfettiKey] = useState(0)

    useEffect(() => {
        if (isOpen) {
            // Regenerate confetti every 3 seconds
            const interval = setInterval(() => {
                setConfettiKey(prev => prev + 1)
            }, 3000)

            return () => clearInterval(interval)
        }
    }, [isOpen])

    if (!isOpen || !milestone) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            {/* Confetti Effect - Regenerates continuously */}
            {isOpen && (
                <div key={confettiKey} className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(30)].map((_, i) => (
                        <div
                            key={`${confettiKey}-${i}`}
                            className="absolute animate-confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: '-20px',
                                animationDelay: `${Math.random() * 0.5}s`,
                                animationDuration: `${2 + Math.random() * 2}s`,
                            }}
                        >
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                    backgroundColor: ['#b89c86', '#9c8776', '#cbb7c9', '#10b981', '#f59e0b', '#3b82f6'][Math.floor(Math.random() * 6)],
                                    transform: `rotate(${Math.random() * 360}deg)`,
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Content */}
            <div className="relative bg-surface-elevated border-2 border-primary rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-backplate text-neutral-medium hover:text-on-surface transition-colors cursor-pointer z-10"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div className="p-8 text-center">
                    {/* Sparkles Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <Sparkles size={32} className="text-warning animate-pulse" />
                            <Sparkles size={24} className="absolute -top-2 -right-2 text-primary animate-pulse" style={{ animationDelay: '0.2s' }} />
                            <Sparkles size={20} className="absolute -bottom-2 -left-2 text-secondary animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </div>

                    {/* Achievement Unlocked Text */}
                    <h2 className="text-2xl font-bold text-on-surface mb-2 animate-fade-in">
                        Achievement Unlocked!
                    </h2>
                    <p className="text-sm text-on-surface-secondary mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        You've reached a new milestone! 🎉
                    </p>

                    {/* Badge */}
                    <div
                        className="mx-auto w-32 h-32 rounded-full flex items-center justify-center mb-6 animate-bounce-in shadow-lg"
                        style={{
                            backgroundColor: milestone.badge_color + '20',
                            border: `3px solid ${milestone.badge_color}`,
                            animationDelay: '0.2s'
                        }}
                    >
                        <span className="text-6xl">{milestone.badge_icon}</span>
                    </div>

                    {/* Milestone Details */}
                    <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        <h3 className="text-xl font-bold text-on-surface mb-2">
                            {milestone.title}
                        </h3>
                        <p className="text-sm text-on-surface-secondary mb-2">
                            {milestone.description}
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                            <Award size={16} className="text-primary" />
                            <span className="text-sm font-semibold text-primary">
                                {milestone.session_threshold} Sessions Completed
                            </span>
                        </div>
                    </div>

                    {/* CTA */}
                    <button
                        onClick={onClose}
                        className="mt-8 btn btn-primary w-full animate-fade-in"
                        style={{ animationDelay: '0.4s' }}
                    >
                        Continue Focusing
                    </button>
                </div>
            </div>
        </div>
    )
}


