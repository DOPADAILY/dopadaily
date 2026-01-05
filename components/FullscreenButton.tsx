'use client'

import { useState, useEffect } from 'react'
import { Maximize, Minimize } from 'lucide-react'

export default function FullscreenButton() {
    const [isFullscreen, setIsFullscreen] = useState(false)

    useEffect(() => {
        // Check if already in fullscreen
        const checkFullscreen = () => {
            setIsFullscreen(
                !!(
                    document.fullscreenElement ||
                    (document as any).webkitFullscreenElement ||
                    (document as any).mozFullScreenElement ||
                    (document as any).msFullscreenElement
                )
            )
        }

        // Listen for fullscreen changes
        const events = [
            'fullscreenchange',
            'webkitfullscreenchange',
            'mozfullscreenchange',
            'MSFullscreenChange',
        ]

        events.forEach((event) => {
            document.addEventListener(event, checkFullscreen)
        })

        checkFullscreen()

        return () => {
            events.forEach((event) => {
                document.removeEventListener(event, checkFullscreen)
            })
        }
    }, [])

    const toggleFullscreen = async () => {
        try {
            if (!isFullscreen) {
                // Enter fullscreen
                const element = document.documentElement
                if (element.requestFullscreen) {
                    await element.requestFullscreen()
                } else if ((element as any).webkitRequestFullscreen) {
                    // Safari
                    await (element as any).webkitRequestFullscreen()
                } else if ((element as any).mozRequestFullScreen) {
                    // Firefox
                    await (element as any).mozRequestFullScreen()
                } else if ((element as any).msRequestFullscreen) {
                    // IE/Edge
                    await (element as any).msRequestFullscreen()
                }
            } else {
                // Exit fullscreen
                if (document.exitFullscreen) {
                    await document.exitFullscreen()
                } else if ((document as any).webkitExitFullscreen) {
                    await (document as any).webkitExitFullscreen()
                } else if ((document as any).mozCancelFullScreen) {
                    await (document as any).mozCancelFullScreen()
                } else if ((document as any).msExitFullscreen) {
                    await (document as any).msExitFullscreen()
                }
            }
        } catch (error) {
            console.error('Error toggling fullscreen:', error)
        }
    }

    // Don't show button if fullscreen API is not supported
    if (
        !document.documentElement.requestFullscreen &&
        !(document.documentElement as any).webkitRequestFullscreen &&
        !(document.documentElement as any).mozRequestFullScreen &&
        !(document.documentElement as any).msRequestFullscreen
    ) {
        return null
    }

    return (
        <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
            {isFullscreen ? (
                <Minimize className="w-5 h-5 text-on-surface" />
            ) : (
                <Maximize className="w-5 h-5 text-on-surface" />
            )}
        </button>
    )
}

