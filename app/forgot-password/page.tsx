'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Brain, Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { requestPasswordReset } from './actions'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  // Email validation
  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
      return false
    }

    setEmailError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!validateEmail(email)) {
      setEmailError(emailError || 'Please enter a valid email address')
      return
    }

    setIsLoading(true)

    const formData = new FormData()
    formData.append('email', email)

    startTransition(async () => {
      const result = await requestPasswordReset(formData)
      setIsLoading(false)

      if (result.success) {
        setIsSuccess(true)
      } else {
        setError(result.error || 'Failed to send reset email. Please try again.')
      }
    })
  }

  const loading = isPending || isLoading

  if (isSuccess) {
    return (
      <div className="fixed inset-0 flex h-screen w-screen overflow-hidden bg-surface">
        <div className="flex h-full w-full items-center justify-center px-6">
          <div className="card text-center p-8 max-w-md w-full">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-success/10">
                <CheckCircle size={48} className="text-success" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-on-surface mb-3">
              Check your email
            </h1>
            
            <p className="text-on-surface-secondary mb-6">
              We've sent a password reset link to <strong className="text-on-surface">{email}</strong>
            </p>
            
            <p className="text-sm text-on-surface-secondary mb-6">
              Click the link in the email to reset your password. If you don't see it, check your spam folder.
            </p>
            
            <Link
              href="/login"
              className="btn btn-primary w-full"
            >
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex h-screen w-screen overflow-hidden bg-surface">
      {/* Desktop & Mobile Layout */}
      <div className="flex h-full w-full items-center justify-center px-6">
        <div className="w-full max-w-[420px]">
          
          {/* Back to Login Link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline mb-8"
          >
            <ArrowLeft size={16} />
            Back to Sign in
          </Link>

          {/* Header */}
          <div className="flex flex-col items-center gap-4 text-center mb-8">
            {/* Logo */}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Brain size={28} className="text-on-primary" />
            </div>

            {/* Title */}
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-on-surface">
                Forgot your password?
              </h1>
              <p className="text-sm text-on-surface-secondary">
                No worries! Enter your email and we'll send you a link to reset your password.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {error && (
              <div className="rounded-lg border border-error bg-error-bg p-3">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-semibold text-on-surface"
              >
                Email address
              </label>
              <div className={`relative rounded-lg border ${emailError ? 'border-error' : 'border-border'} bg-surface-elevated focus-within:border-primary transition-colors`}>
                <div className="flex items-center px-4 py-3 gap-2">
                  <Mail size={18} className="text-neutral-medium" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      validateEmail(e.target.value)
                    }}
                    required
                    disabled={loading}
                    className="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-neutral-medium disabled:opacity-50"
                  />
                </div>
              </div>
              {emailError && (
                <p className="text-xs text-error">{emailError}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !!emailError}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-12 py-3 transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 size={20} className="animate-spin text-on-primary" />}
              <span className="text-sm font-semibold text-on-primary">
                {loading ? 'Sending...' : 'Send reset link'}
              </span>
            </button>
          </form>

          {/* Help Text */}
          <p className="text-center text-sm text-on-surface-secondary mt-6">
            Remember your password?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

