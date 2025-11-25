'use client'

import { Heart } from 'lucide-react'
import { useToggleLike } from '@/hooks/queries'

interface LikeButtonProps {
    postId: number
    initialLikeCount: number
    initialIsLiked: boolean
}

export default function LikeButton({ postId, initialLikeCount, initialIsLiked }: LikeButtonProps) {
    const toggleLike = useToggleLike()

    // Use optimistic values from mutation or fall back to initial
    const isLiked = initialIsLiked
    const likeCount = initialLikeCount

    const handleLike = (e: React.MouseEvent) => {
        // Prevent the click from bubbling up to the Link wrapper
        e.preventDefault()
        e.stopPropagation()

        toggleLike.mutate(postId)
    }

    return (
        <button
            onClick={handleLike}
            disabled={toggleLike.isPending}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${isLiked
                    ? 'bg-error/10 text-error hover:bg-error/20'
                    : 'text-on-surface-secondary hover:bg-backplate hover:text-error'
                } ${toggleLike.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <Heart
                size={16}
                className={`transition-all ${isLiked ? 'fill-current' : ''}`}
            />
            <span className="text-sm font-medium">{likeCount}</span>
        </button>
    )
}
