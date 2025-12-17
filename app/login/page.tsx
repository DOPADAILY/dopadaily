'use client'

import { login } from './actions'
import Link from 'next/link'
import { Brain, Loader2, Sparkles } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState, useTransition, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import PasswordInput from '@/components/PasswordInput'

function LoginContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlMessage = searchParams?.get('error') || searchParams?.get('message')
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(urlMessage)

  // Check if user is already logged in
  // Only redirect if we can VERIFY the session (not just read from cookies)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient()
        // Use getUser() to actually verify with server, not just read cookies
        const { data: { user }, error } = await supabase.auth.getUser()

        // Only redirect if we have a verified user AND no errors
        if (user && !error) {
          router.replace('/dashboard')
        }
      } catch (err) {
        // Network error - don't redirect, stay on login page
        console.warn('[Login] Network error checking session, staying on login page')
      }
    }
    checkSession()
  }, [router])

  // Keep URL-provided messages (e.g. redirects) in sync with local error display.
  useEffect(() => {
    setErrorMessage(urlMessage)
  }, [urlMessage])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const result = await login(formData)
        if (result?.error) {
          setErrorMessage(result.error)
        }
      } finally {
        setIsLoading(false)
      }
    })
  }

  const loading = isPending || isLoading

  return (
    <div className="fixed inset-0 flex h-screen w-screen overflow-hidden bg-surface">

      {/* Desktop Layout */}
      <div className="hidden h-full w-full lg:flex">

        {/* Left Side - Login Form */}
        <div className="flex h-full w-1/2 flex-col items-center justify-center overflow-y-auto bg-surface px-[16px]">

          {/* Login Form Container */}
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
                  Welcome back
                </h1>
                <p className="w-full text-[16px] font-normal leading-[24px] text-on-surface-secondary">
                  Sign in to continue your wellness journey
                </p>
              </div>
            </div>

            {/* Content - Form */}
            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-[32px]">

              {/* Form Section */}
              <div className="flex w-full flex-col gap-[12px]">
                {errorMessage && (
                  <div className="rounded-[8px] border border-error bg-error-bg p-3">
                    <p className="text-[14px] text-error">{errorMessage}</p>
                  </div>
                )}

                <div className="flex w-full flex-col gap-[20px]">
                  {/* Email Input */}
                  <div className="flex w-full flex-col gap-[6px]">
                    <label
                      htmlFor="email"
                      className="text-[14px] font-semibold leading-[20px] text-on-surface"
                    >
                      Email
                    </label>
                    <div className="relative w-full rounded-[8px] border border-border bg-surface-elevated focus-within:border-primary transition-colors">
                      <div className="box-border flex w-full items-center gap-[8px] overflow-clip rounded-[inherit] px-[14px] py-[10px]">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          required
                          disabled={loading}
                          className="min-w-0 flex-1 bg-transparent text-[14px] font-normal leading-[20px] text-on-surface outline-none placeholder:text-neutral-medium disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="flex w-full flex-col gap-[6px]">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="text-[14px] font-semibold leading-[20px] text-on-surface"
                      >
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-[12px] font-medium text-primary hover:underline"
                      >
                        Forgot?
                      </Link>
                    </div>
                    <PasswordInput
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="box-border flex w-full items-center justify-center gap-[8px] rounded-[8px] bg-primary px-[48px] py-[12px] transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 size={20} className="animate-spin text-on-primary" />}
                <span className="text-[16px] font-semibold leading-[24px] text-on-primary">
                  {loading ? 'Signing in...' : 'Sign in'}
                </span>
              </button>
            </form>

            {/* Create Account Link */}
            <div className="flex items-start justify-center gap-[4px]">
              <p className="text-[14px] font-normal leading-[20px] text-on-surface-secondary">
                Don't have an account?
              </p>
              <Link
                href="/signup"
                className="text-[14px] cursor-pointer font-semibold leading-[20px] text-primary hover:underline"
              >
                Sign up
              </Link>
            </div>

            {/* Help Text */}
            <p className="text-center text-[14px] leading-[20px] text-on-surface-secondary">
              By continuing, you agree to our{' '}
              <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>

        {/* Right Side - Calm Wellness Illustration */}
        <div className="relative flex h-[calc(100vh-32px)] w-1/2 flex-col self-center overflow-hidden rounded-lg bg-linear-to-br from-primary via-secondary to-accent" style={{ marginRight: '16px' }}>

          {/* Floating Elements - Therapeutic Theme */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Soft breathing circles */}
            <div className="absolute top-[15%] left-[20%] w-32 h-32 rounded-full bg-white/10 animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute top-[40%] right-[15%] w-24 h-24 rounded-full bg-white/8 animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
            <div className="absolute bottom-[25%] left-[30%] w-20 h-20 rounded-full bg-white/12 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>

            {/* Sparkle effects */}
            <div className="absolute top-[25%] right-[25%]">
              <Sparkles className="w-6 h-6 text-white/30 animate-pulse" style={{ animationDuration: '3s' }} />
            </div>
            <div className="absolute bottom-[35%] right-[20%]">
              <Sparkles className="w-4 h-4 text-white/20 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1.5s' }} />
            </div>

            {/* Calm wave pattern */}
            <svg className="absolute bottom-0 left-0 w-full h-48 opacity-20" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,50 C300,100 600,0 900,50 L900,120 L0,120 Z" fill="white" className="animate-pulse" style={{ animationDuration: '8s' }} />
            </svg>
            <svg className="absolute bottom-0 left-0 w-full h-40 opacity-15" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,70 C400,20 800,90 1200,40 L1200,120 L0,120 Z" fill="white" className="animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
            </svg>
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
                Your peaceful path to better focus and mental wellness
              </h2>
              <p className="text-[16px] font-normal leading-[24px] text-white/90 drop-shadow-sm" style={{ maxWidth: '518px' }}>
                Join thousands of people building better focus habits and finding support in our community. Simple, therapeutic, and science-backed.
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
                Welcome back
              </h1>
              <p className="text-center text-[16px] font-normal leading-[24px] text-on-surface-secondary">
                Sign in to continue your wellness journey
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-[24px]">
              {errorMessage && (
                <div className="rounded-[8px] border border-error bg-error-bg p-3">
                  <p className="text-[14px] text-error">{errorMessage}</p>
                </div>
              )}

              <div className="flex flex-col gap-[6px]">
                <label
                  htmlFor="email-mobile"
                  className="text-[14px] font-semibold leading-[20px] text-on-surface"
                >
                  Email
                </label>
                <div className="rounded-[8px] border border-border bg-surface-elevated focus-within:border-primary transition-colors">
                  <div className="flex items-center px-[14px] py-[10px]">
                    <input
                      id="email-mobile"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      required
                      disabled={loading}
                      className="w-full bg-transparent text-[14px] font-normal leading-[20px] text-on-surface outline-none placeholder:text-neutral-medium disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-[6px]">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password-mobile"
                    className="text-[14px] font-semibold leading-[20px] text-on-surface"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[12px] font-medium text-primary hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <PasswordInput
                  id="password-mobile"
                  name="password"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-[8px] rounded-[8px] bg-primary px-[48px] py-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 size={20} className="animate-spin text-on-primary" />}
                <span className="text-[16px] font-semibold leading-[24px] text-on-primary">
                  {loading ? 'Signing in...' : 'Sign in'}
                </span>
              </button>
            </form>

            {/* Sign up link */}
            <div className="flex items-center justify-center gap-[4px]">
              <p className="text-[14px] font-normal leading-[20px] text-on-surface-secondary">
                Don't have an account?
              </p>
              <Link
                href="/signup"
                className="text-[14px] cursor-pointer font-semibold leading-[20px] text-primary"
              >
                Sign up
              </Link>
            </div>

            {/* Help text */}
            <p className="text-center text-[14px] leading-[20px] text-on-surface-secondary">
              By continuing, you agree to our{' '}
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

export default function Login() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex h-screen w-screen items-center justify-center bg-surface">
        <div className="h-[48px] w-[48px] animate-spin rounded-full border-4 border-neutral-lightest border-t-primary"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
