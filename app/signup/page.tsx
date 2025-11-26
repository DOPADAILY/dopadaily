'use client'

import { signup } from './actions'
import Link from 'next/link'
import { Brain, Loader2, Heart, Users, Zap } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState, useTransition, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import PasswordInput from '@/components/PasswordInput'

function SignupContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const error = searchParams?.get('error')
    const [isPending, startTransition] = useTransition()
    const [isLoading, setIsLoading] = useState(false)
    const [username, setUsername] = useState('')
    const [usernameError, setUsernameError] = useState('')
    const [email, setEmail] = useState('')
    const [emailError, setEmailError] = useState('')

    // Check if user is already logged in
    useEffect(() => {
        const checkSession = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                router.replace('/dashboard')
            }
        }
        checkSession()
    }, [router])

    // Username validation
    useEffect(() => {
        if (!username) {
            setUsernameError('')
            return
        }

        if (username.length < 3) {
            setUsernameError('Username must be at least 3 characters')
            return
        }

        // Check alphanumeric with underscores/hyphens
        const usernameRegex = /^[a-zA-Z0-9_-]+$/
        if (!usernameRegex.test(username)) {
            setUsernameError('Only letters, numbers, hyphens, and underscores allowed')
            return
        }

        setUsernameError('')
    }, [username])

    // Email validation
    useEffect(() => {
        if (!email) {
            setEmailError('')
            return
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address')
            return
        }

        setEmailError('')
    }, [email])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        // Validate username and email before submitting
        if (!username || usernameError) {
            setUsernameError(usernameError || 'Please enter a username')
            return
        }

        if (!email || emailError) {
            setEmailError(emailError || 'Please enter a valid email address')
            return
        }

        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        startTransition(async () => {
            await signup(formData)
            setIsLoading(false)
        })
    }

    const loading = isPending || isLoading

    return (
        <div className="fixed inset-0 flex h-screen w-screen overflow-hidden bg-surface">

            {/* Desktop Layout */}
            <div className="hidden h-full w-full lg:flex">

                {/* Left Side - Signup Form */}
                <div className="flex h-full w-1/2 flex-col items-center justify-center overflow-y-auto bg-surface px-[16px]">

                    {/* Signup Form Container */}
                    <div className="flex w-full max-w-[420px] flex-col gap-[32px]">

                        {/* Header */}
                        <div className="flex w-full flex-col items-center gap-[16px] text-center">
                            {/* Logo Mark */}
                            <div className="flex h-[48px] w-[48px] items-center justify-center rounded-xl bg-primary">
                                <Brain size={28} className="text-on-primary" />
                            </div>

                            {/* Text */}
                            <div className="flex w-full flex-col gap-[4px] text-center">
                                <h1 className="w-full text-[24px] font-bold leading-[36px] text-on-surface">
                                    Create your account
                                </h1>
                                <p className="w-full text-[16px] font-normal leading-[24px] text-on-surface-secondary">
                                    Start your journey to better focus and wellness
                                </p>
                            </div>
                        </div>

                        {/* Content - Form */}
                        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-[32px]">

                            {/* Form Section */}
                            <div className="flex w-full flex-col gap-[12px]">
                                {error && (
                                    <div className="rounded-[8px] border border-error bg-error-bg p-3">
                                        <p className="text-[14px] text-error">{error}</p>
                                    </div>
                                )}

                                <div className="flex w-full flex-col gap-[20px]">
                                    {/* Username Input */}
                                    <div className="flex w-full flex-col gap-[6px]">
                                        <label
                                            htmlFor="username"
                                            className="text-[14px] font-semibold leading-[20px] text-on-surface"
                                        >
                                            Username
                                        </label>
                                        <div className={`relative w-full rounded-[8px] border ${usernameError ? 'border-error' : 'border-border'} bg-surface-elevated focus-within:border-primary transition-colors`}>
                                            <div className="box-border flex w-full items-center gap-[8px] overflow-clip rounded-[inherit] px-[14px] py-[10px]">
                                                <input
                                                    id="username"
                                                    name="username"
                                                    type="text"
                                                    placeholder="Choose a username"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    required
                                                    disabled={loading}
                                                    className="min-w-0 flex-1 bg-transparent text-[14px] font-normal leading-[20px] text-on-surface outline-none placeholder:text-neutral-medium disabled:opacity-50"
                                                />
                                            </div>
                                        </div>
                                        {usernameError && (
                                            <p className="text-[12px] text-error">{usernameError}</p>
                                        )}
                                    </div>

                                    {/* Email Input */}
                                    <div className="flex w-full flex-col gap-[6px]">
                                        <label
                                            htmlFor="email"
                                            className="text-[14px] font-semibold leading-[20px] text-on-surface"
                                        >
                                            Email
                                        </label>
                                        <div className={`relative w-full rounded-[8px] border ${emailError ? 'border-error' : 'border-border'} bg-surface-elevated focus-within:border-primary transition-colors`}>
                                            <div className="box-border flex w-full items-center gap-[8px] overflow-clip rounded-[inherit] px-[14px] py-[10px]">
                                                <input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    placeholder="Enter your email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    disabled={loading}
                                                    className="min-w-0 flex-1 bg-transparent text-[14px] font-normal leading-[20px] text-on-surface outline-none placeholder:text-neutral-medium disabled:opacity-50"
                                                />
                                            </div>
                                        </div>
                                        {emailError && (
                                            <p className="text-[12px] text-error">{emailError}</p>
                                        )}
                                    </div>

                                    {/* Password Input */}
                                    <div className="flex w-full flex-col gap-[6px]">
                                        <label
                                            htmlFor="password"
                                            className="text-[14px] font-semibold leading-[20px] text-on-surface"
                                        >
                                            Password
                                        </label>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            placeholder="Create a password (min. 6 characters)"
                                            required
                                            minLength={6}
                                            disabled={loading}
                                        />
                                        <p className="text-[12px] text-on-surface-secondary">Must be at least 6 characters</p>
                                    </div>
                                </div>
                            </div>

                            {/* Create Account Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="box-border flex w-full items-center justify-center gap-[8px] rounded-[8px] bg-primary px-[48px] py-[12px] transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading && <Loader2 size={20} className="animate-spin text-on-primary" />}
                                <span className="text-[16px] font-semibold leading-[24px] text-on-primary">
                                    {loading ? 'Creating account...' : 'Create account'}
                                </span>
                            </button>
                        </form>

                        {/* Sign In Link */}
                        <div className="flex items-start justify-center gap-[4px]">
                            <p className="text-[14px] font-normal leading-[20px] text-on-surface-secondary">
                                Already have an account?
                            </p>
                            <Link
                                href="/login"
                                className="text-[14px] cursor-pointer font-semibold leading-[20px] text-primary hover:underline"
                            >
                                Sign in
                            </Link>
                        </div>

                        {/* Help Text */}
                        <p className="text-center text-[14px] leading-[20px] text-on-surface-secondary">
                            By creating an account, you agree to our{' '}
                            <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
                            {' '}and{' '}
                            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                        </p>
                    </div>
                </div>

                {/* Right Side - Community & Benefits Illustration */}
                <div className="relative flex h-[calc(100vh-32px)] w-1/2 flex-col self-center overflow-hidden rounded-lg bg-linear-to-br from-secondary via-accent to-primary" style={{ marginRight: '16px' }}>

                    {/* Floating Icons - Community Theme */}
                    <div className="absolute inset-0 overflow-hidden">
                        {/* Feature badges floating */}
                        <div className="absolute top-[20%] left-[15%] flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm animate-float">
                            <Heart className="w-5 h-5 text-white" />
                            <span className="text-white text-sm font-medium">Supportive</span>
                        </div>

                        <div className="absolute top-[40%] right-[10%] flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm animate-float" style={{ animationDelay: '1s' }}>
                            <Users className="w-5 h-5 text-white" />
                            <span className="text-white text-sm font-medium">Community</span>
                        </div>

                        <div className="absolute bottom-[30%] left-[20%] flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm animate-float" style={{ animationDelay: '2s' }}>
                            <Zap className="w-5 h-5 text-white" />
                            <span className="text-white text-sm font-medium">Focus Tools</span>
                        </div>

                        {/* Soft glow elements */}
                        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>
                        <div className="absolute top-[30%] right-[20%] w-48 h-48 rounded-full bg-white/10 blur-2xl animate-pulse" style={{ animationDuration: '7s' }}></div>

                        {/* Gradient overlay for depth */}
                        <div className="absolute inset-0 bg-linear-to-t from-black/10 via-transparent to-white/5"></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 flex h-full flex-col px-[32px] py-[64px]">
                        {/* Logo & Brand Name - Top Left */}
                        <div className="flex items-center gap-[8px] self-start">
                            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Brain size={20} className="text-white" />
                            </div>
                            <p className="text-[18px] font-extrabold leading-[28px] text-white">
                                Dopadaily
                            </p>
                        </div>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Text Content at Bottom - Centered */}
                        <div className="flex flex-col items-center gap-[20px] text-center">
                            <h2 className="text-[28px] font-bold leading-[42px] text-white drop-shadow-sm" style={{ maxWidth: '560px' }}>
                                Join our community of focused individuals
                            </h2>
                            <p className="text-[16px] font-normal leading-[24px] text-white/90 drop-shadow-sm" style={{ maxWidth: '518px' }}>
                                Start your journey with science-backed tools for focus, community support, and personalized wellness tracking. It's free to get started.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="flex h-full w-full flex-col lg:hidden">

                {/* Mobile Header with Logo */}
                <div className="flex h-[80px] shrink-0 items-center justify-center border-b border-border bg-surface">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <Brain size={20} className="text-on-primary" />
                        </div>
                        <span className="text-lg font-bold text-on-surface">Dopadaily</span>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex flex-1 flex-col overflow-y-auto bg-surface px-6 py-8">
                    <div className="mx-auto flex w-full max-w-[360px] flex-col gap-[32px]">

                        {/* Header */}
                        <div className="flex flex-col items-center gap-[16px] text-center">
                            <h1 className="text-center text-[24px] font-bold leading-[36px] text-on-surface">
                                Create your account
                            </h1>
                            <p className="text-center text-[16px] font-normal leading-[24px] text-on-surface-secondary">
                                Start your journey to better focus and wellness
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-[24px]">
                            {error && (
                                <div className="rounded-[8px] border border-error bg-error-bg p-3">
                                    <p className="text-[14px] text-error">{error}</p>
                                </div>
                            )}

                            <div className="flex flex-col gap-[6px]">
                                <label
                                    htmlFor="username-mobile"
                                    className="text-[14px] font-semibold leading-[20px] text-on-surface"
                                >
                                    Username
                                </label>
                                <div className={`rounded-[8px] border ${usernameError ? 'border-error' : 'border-border'} bg-surface-elevated focus-within:border-primary transition-colors`}>
                                    <div className="flex items-center px-[14px] py-[10px]">
                                        <input
                                            id="username-mobile"
                                            name="username"
                                            type="text"
                                            placeholder="Choose a username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                            disabled={loading}
                                            className="w-full bg-transparent text-[14px] font-normal leading-[20px] text-on-surface outline-none placeholder:text-neutral-medium disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                                {usernameError && (
                                    <p className="text-[12px] text-error">{usernameError}</p>
                                )}
                            </div>

                            <div className="flex flex-col gap-[6px]">
                                <label
                                    htmlFor="email-mobile"
                                    className="text-[14px] font-semibold leading-[20px] text-on-surface"
                                >
                                    Email
                                </label>
                                <div className={`rounded-[8px] border ${emailError ? 'border-error' : 'border-border'} bg-surface-elevated focus-within:border-primary transition-colors`}>
                                    <div className="flex items-center px-[14px] py-[10px]">
                                        <input
                                            id="email-mobile"
                                            name="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={loading}
                                            className="w-full bg-transparent text-[14px] font-normal leading-[20px] text-on-surface outline-none placeholder:text-neutral-medium disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                                {emailError && (
                                    <p className="text-[12px] text-error">{emailError}</p>
                                )}
                            </div>

                            <div className="flex flex-col gap-[6px]">
                                <label
                                    htmlFor="password-mobile"
                                    className="text-[14px] font-semibold leading-[20px] text-on-surface"
                                >
                                    Password
                                </label>
                                <PasswordInput
                                    id="password-mobile"
                                    name="password"
                                    placeholder="Create a password (min. 6 characters)"
                                    required
                                    minLength={6}
                                    disabled={loading}
                                />
                                <p className="text-[12px] text-on-surface-secondary">Must be at least 6 characters</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-[8px] rounded-[8px] bg-primary px-[48px] py-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading && <Loader2 size={20} className="animate-spin text-on-primary" />}
                                <span className="text-[16px] font-semibold leading-[24px] text-on-primary">
                                    {loading ? 'Creating account...' : 'Create account'}
                                </span>
                            </button>
                        </form>

                        {/* Sign in link */}
                        <div className="flex items-center justify-center gap-[4px]">
                            <p className="text-[14px] font-normal leading-[20px] text-on-surface-secondary">
                                Already have an account?
                            </p>
                            <Link
                                href="/login"
                                className="text-[14px] cursor-pointer font-semibold leading-[20px] text-primary"
                            >
                                Sign in
                            </Link>
                        </div>

                        {/* Help text */}
                        <p className="text-center text-[14px] leading-[20px] text-on-surface-secondary">
                            By creating an account, you agree to our{' '}
                            <a href="/terms" className="text-primary">Terms</a>
                            {' '}and{' '}
                            <a href="/privacy" className="text-primary">Privacy Policy</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function Signup() {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 flex h-screen w-screen items-center justify-center bg-surface">
                <div className="h-[48px] w-[48px] animate-spin rounded-full border-4 border-neutral-lightest border-t-primary"></div>
            </div>
        }>
            <SignupContent />
        </Suspense>
    )
}
