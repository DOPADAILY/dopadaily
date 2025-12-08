'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useToggleLike } from '@/hooks/queries'

interface LikeButtonProps {
    postId: number
    initialLikeCount: number
    initialIsLiked: boolean
}

export default function LikeButton({ postId, initialLikeCount, initialIsLiked }: LikeButtonProps) {
    const toggleLike = useToggleLike()
    const [isAnimating, setIsAnimating] = useState(false)

    // Use optimistic values from mutation or fall back to initial
    const isLiked = initialIsLiked
    const likeCount = initialLikeCount

    const handleLike = (e: React.MouseEvent) => {
        // Prevent the click from bubbling up to the Link wrapper
        e.preventDefault()
        e.stopPropagation()

        // Trigger animation
        setIsAnimating(true)
        setTimeout(() => setIsAnimating(false), 400)

        toggleLike.mutate(postId)
    }

    return (
        <button
            onClick={handleLike}
            disabled={toggleLike.isPending}
            className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${isLiked
                    ? 'bg-error/10 text-error hover:bg-error/20'
                    : 'text-on-surface-secondary hover:bg-backplate hover:text-error'
                } ${toggleLike.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {/* Burst effect on like */}
            {isAnimating && isLiked && (
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="absolute w-8 h-8 rounded-full bg-error/20 animate-ping" />
                </span>
            )}
            <Heart
                size={16}
                className={`transition-all ${isLiked ? 'fill-current' : ''} ${isAnimating ? 'animate-heart-pop' : ''} group-hover:scale-110`}
            />
            <span className="text-sm font-medium">{likeCount}</span>
        </button>
    )
}
