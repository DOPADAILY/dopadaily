'use client'

import { useEffect } from 'react'

// TypeScript interface for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWARegister() {
    useEffect(() => {
        // Register service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((registration) => {
                        console.log('Service Worker registered:', registration.scope)

                        // Check for updates periodically
                        setInterval(() => {
                            registration.update()
                        }, 60000) // Check every minute
                    })
                    .catch((error) => {
                        console.log('Service Worker registration failed:', error)
                    })
            })
        }

        // Handle install prompt
        let deferredPrompt: BeforeInstallPromptEvent | null = null

        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault()
            // Stash the event so it can be triggered later
            deferredPrompt = e as BeforeInstallPromptEvent

            // You can show a custom install button here
            console.log('PWA install prompt available')

            // Optional: Dispatch custom event for UI to show install button
            window.dispatchEvent(new CustomEvent('pwa-install-available'))
        })

        // Track successful installation
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed')
            deferredPrompt = null
            // Optional: Track analytics or show success message
        })
    }, [])

    return null // This component doesn't render anything
}

