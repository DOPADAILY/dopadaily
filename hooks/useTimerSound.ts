'use client'

import { useCallback, useRef } from 'react'

// Creates a pleasant chime/bell sound using Web Audio API
export function useTimerSound() {
    const audioContextRef = useRef<AudioContext | null>(null)

    const playCompletionSound = useCallback(() => {
        try {
            // Create or reuse AudioContext
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
            }

            const ctx = audioContextRef.current
            const now = ctx.currentTime

            // Play a sequence of pleasant tones (like a gentle chime)
            const frequencies = [523.25, 659.25, 783.99] // C5, E5, G5 - a major chord

            frequencies.forEach((freq, index) => {
                const oscillator = ctx.createOscillator()
                const gainNode = ctx.createGain()

                oscillator.connect(gainNode)
                gainNode.connect(ctx.destination)

                // Use a sine wave for a soft, pleasant tone
                oscillator.type = 'sine'
                oscillator.frequency.setValueAtTime(freq, now)

                // Stagger each note slightly for a chime effect
                const noteStart = now + (index * 0.15)
                const noteDuration = 0.8

                // Envelope: quick attack, slow decay
                gainNode.gain.setValueAtTime(0, noteStart)
                gainNode.gain.linearRampToValueAtTime(0.3, noteStart + 0.02) // Quick attack
                gainNode.gain.exponentialRampToValueAtTime(0.01, noteStart + noteDuration) // Slow decay

                oscillator.start(noteStart)
                oscillator.stop(noteStart + noteDuration)
            })

            // Add a second chime after a short pause
            setTimeout(() => {
                if (!audioContextRef.current) return
                const ctx = audioContextRef.current
                const now = ctx.currentTime

                frequencies.forEach((freq, index) => {
                    const oscillator = ctx.createOscillator()
                    const gainNode = ctx.createGain()

                    oscillator.connect(gainNode)
                    gainNode.connect(ctx.destination)

                    oscillator.type = 'sine'
                    oscillator.frequency.setValueAtTime(freq, now)

                    const noteStart = now + (index * 0.15)
                    const noteDuration = 1.2

                    gainNode.gain.setValueAtTime(0, noteStart)
                    gainNode.gain.linearRampToValueAtTime(0.25, noteStart + 0.02)
                    gainNode.gain.exponentialRampToValueAtTime(0.01, noteStart + noteDuration)

                    oscillator.start(noteStart)
                    oscillator.stop(noteStart + noteDuration)
                })
            }, 600)

        } catch (error) {
            console.warn('Could not play completion sound:', error)
        }
    }, [])

    // Alternative: Simple beep sound
    const playBeep = useCallback((frequency = 800, duration = 200, volume = 0.3) => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
            }

            const ctx = audioContextRef.current
            const oscillator = ctx.createOscillator()
            const gainNode = ctx.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(ctx.destination)

            oscillator.type = 'sine'
            oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

            gainNode.gain.setValueAtTime(volume, ctx.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000)

            oscillator.start()
            oscillator.stop(ctx.currentTime + duration / 1000)
        } catch (error) {
            console.warn('Could not play beep:', error)
        }
    }, [])

    return { playCompletionSound, playBeep }
}

