'use client'

import { useEffect, useState } from 'react'

interface AnimatedBackgroundProps {
    variant?: 'default' | 'focus' | 'minimal'
    className?: string
}

export default function AnimatedBackground({ variant = 'default', className = '' }: AnimatedBackgroundProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className={`fixed inset-0 pointer-events-none overflow-hidden -z-10 ${className}`}>
            {/* Base animated gradient overlay */}
            <div
                className="absolute inset-0 animate-bg-breathe"
                style={{
                    background: 'linear-gradient(135deg, rgba(184, 156, 134, 0.15) 0%, transparent 50%, rgba(203, 183, 201, 0.15) 100%)',
                }}
            />

            {/* Animated gradient blobs - VIBRANT */}
            <div className="absolute inset-0">
                {/* Large slow-moving blob - top left - WARM */}
                <div
                    className="absolute top-0 left-0 w-[650px] h-[650px] rounded-full animate-blob-slow"
                    style={{
                        background: 'radial-gradient(circle, rgba(210, 160, 120, 0.7) 0%, rgba(184, 156, 134, 0.4) 35%, transparent 65%)',
                        filter: 'blur(25px)',
                        transform: 'translate(-25%, -25%)',
                    }}
                />

                {/* Medium blob - top right - LAVENDER */}
                <div
                    className="absolute top-0 right-0 w-[550px] h-[550px] rounded-full animate-blob-medium"
                    style={{
                        background: 'radial-gradient(circle, rgba(220, 195, 220, 0.65) 0%, rgba(203, 183, 201, 0.35) 35%, transparent 65%)',
                        filter: 'blur(20px)',
                        transform: 'translate(25%, -25%)',
                        animationDelay: '2s',
                    }}
                />

                {/* Small blob - bottom left - EARTHY */}
                <div
                    className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full animate-blob-fast"
                    style={{
                        background: 'radial-gradient(circle, rgba(180, 155, 130, 0.6) 0%, rgba(156, 135, 118, 0.3) 35%, transparent 65%)',
                        filter: 'blur(18px)',
                        transform: 'translate(-20%, 20%)',
                        animationDelay: '4s',
                    }}
                />

                {/* Medium blob - bottom right - ROSE */}
                <div
                    className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full animate-blob-medium"
                    style={{
                        background: 'radial-gradient(circle, rgba(215, 180, 200, 0.6) 0%, rgba(184, 156, 170, 0.3) 35%, transparent 65%)',
                        filter: 'blur(25px)',
                        transform: 'translate(20%, 25%)',
                        animationDelay: '1s',
                    }}
                />

                {/* Center floating blob - GLOW */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full animate-blob-pulse"
                    style={{
                        background: 'radial-gradient(circle, rgba(230, 200, 215, 0.5) 0%, rgba(203, 183, 201, 0.2) 40%, transparent 65%)',
                        filter: 'blur(15px)',
                    }}
                />

                {/* Extra blob - middle left - PEACH */}
                <div
                    className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full animate-blob-fast"
                    style={{
                        background: 'radial-gradient(circle, rgba(230, 190, 165, 0.55) 0%, rgba(200, 170, 150, 0.25) 35%, transparent 65%)',
                        filter: 'blur(18px)',
                        animationDelay: '3s',
                    }}
                />

                {/* Extra blob - middle right - MAUVE */}
                <div
                    className="absolute top-3/4 right-1/4 w-[420px] h-[420px] rounded-full animate-blob-slow"
                    style={{
                        background: 'radial-gradient(circle, rgba(195, 170, 190, 0.55) 0%, rgba(175, 155, 170, 0.25) 35%, transparent 65%)',
                        filter: 'blur(20px)',
                        animationDelay: '5s',
                    }}
                />

                {/* NEW: Accent blob - top center - GOLD TINT */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full animate-blob-medium"
                    style={{
                        background: 'radial-gradient(circle, rgba(220, 195, 150, 0.5) 0%, rgba(200, 180, 140, 0.2) 35%, transparent 65%)',
                        filter: 'blur(15px)',
                        animationDelay: '2.5s',
                    }}
                />

                {/* NEW: Accent blob - bottom center */}
                <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[380px] h-[380px] rounded-full animate-blob-fast"
                    style={{
                        background: 'radial-gradient(circle, rgba(200, 175, 195, 0.5) 0%, rgba(185, 165, 180, 0.2) 35%, transparent 65%)',
                        filter: 'blur(18px)',
                        animationDelay: '3.5s',
                    }}
                />
            </div>

            {/* Floating particles - SPREAD across 8x5 grid with variation */}
            {variant !== 'minimal' && (
                <div className="absolute inset-0">
                    {[...Array(40)].map((_, i) => {
                        // Create an 8x5 grid pattern with variation
                        const col = i % 8;
                        const row = Math.floor(i / 8);
                        // Base grid position (0-100%)
                        const baseX = (col * 12) + 6; // 8 columns: ~12% each
                        const baseY = (row * 18) + 10; // 5 rows: ~18% each
                        // Add variation based on index (pseudo-random offset)
                        const offsetX = ((i * 7) % 11) - 5; // -5 to +5
                        const offsetY = ((i * 13) % 11) - 5; // -5 to +5

                        return (
                            <div
                                key={i}
                                className="absolute rounded-full animate-float-particle"
                                style={{
                                    width: `${8 + (i % 5) * 3}px`,
                                    height: `${8 + (i % 5) * 3}px`,
                                    left: `${Math.max(2, Math.min(96, baseX + offsetX))}%`,
                                    top: `${Math.max(2, Math.min(96, baseY + offsetY))}%`,
                                    backgroundColor: i % 4 === 0
                                        ? 'rgba(210, 170, 140, 0.8)'
                                        : i % 4 === 1
                                            ? 'rgba(180, 155, 135, 0.75)'
                                            : i % 4 === 2
                                                ? 'rgba(215, 190, 210, 0.75)'
                                                : 'rgba(200, 175, 160, 0.7)',
                                    boxShadow: i % 3 === 0
                                        ? '0 0 12px rgba(210, 170, 140, 0.6)'
                                        : '0 0 8px rgba(200, 180, 190, 0.5)',
                                    animationDuration: `${5 + (i % 5) * 1.5}s`,
                                    animationDelay: `${(i % 8) * 0.3}s`,
                                }}
                            />
                        );
                    })}
                </div>
            )}

            {/* NEW: Sparkle effects - spread across 4x3 grid */}
            {variant !== 'minimal' && (
                <div className="absolute inset-0">
                    {[...Array(12)].map((_, i) => {
                        // 4x3 grid for sparkles
                        const col = i % 4;
                        const row = Math.floor(i / 4);
                        const baseX = (col * 24) + 12; // 4 columns
                        const baseY = (row * 30) + 15; // 3 rows
                        const offsetX = ((i * 11) % 13) - 6;
                        const offsetY = ((i * 17) % 13) - 6;

                        return (
                            <div
                                key={`sparkle-${i}`}
                                className="absolute animate-pulse"
                                style={{
                                    width: '4px',
                                    height: '4px',
                                    left: `${Math.max(5, Math.min(95, baseX + offsetX))}%`,
                                    top: `${Math.max(5, Math.min(95, baseY + offsetY))}%`,
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: '50%',
                                    boxShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(230, 200, 180, 0.6)',
                                    animationDuration: `${1 + (i % 3) * 0.5}s`,
                                    animationDelay: `${(i % 6) * 0.3}s`,
                                }}
                            />
                        );
                    })}
                </div>
            )}

            {/* Focus mode extra effects */}
            {variant === 'focus' && (
                <>
                    {/* Breathing ring */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div
                            className="w-[500px] h-[500px] rounded-full border border-primary/10 animate-breathing-ring"
                            style={{ animationDuration: '4s' }}
                        />
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-secondary/10 animate-breathing-ring"
                            style={{ animationDuration: '4s', animationDelay: '0.5s' }}
                        />
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-accent/10 animate-breathing-ring"
                            style={{ animationDuration: '4s', animationDelay: '1s' }}
                        />
                    </div>
                </>
            )}

            {/* Subtle noise texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.015]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />
        </div>
    )
}

