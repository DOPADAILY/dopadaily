'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, Loader2, CheckCircle } from 'lucide-react'
import { updatePassword } from './actions'
import PasswordInput from '@/components/PasswordInput'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  // Password validation
  useEffect(() => {
    if (!password) {
      setPasswordError('')
      return
    }

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    if (confirmPassword && password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setPasswordError('')
  }, [password, confirmPassword])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!password || passwordError) {
      setPasswordError(passwordError || 'Please enter a valid password')
      return
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setIsLoading(true)

    const formData = new FormData()
    formData.append('password', password)

    startTransition(async () => {
      const result = await updatePassword(formData)
      setIsLoading(false)

      if (result.success) {
        setIsSuccess(true)
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setError(result.error || 'Failed to reset password. Please try again.')
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
              Password reset successful!
            </h1>
            
            <p className="text-on-surface-secondary mb-6">
              Your password has been updated. Redirecting you to the dashboard...
            </p>
            
            <div className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-lightest border-t-primary"></div>
            </div>
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

          {/* Header */}
          <div className="flex flex-col items-center gap-4 text-center mb-8">
            {/* Logo */}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Brain size={28} className="text-on-primary" />
            </div>

            {/* Title */}
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-on-surface">
                Reset your password
              </h1>
              <p className="text-sm text-on-surface-secondary">
                Enter your new password below.
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

            {/* New Password Input */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-on-surface"
              >
                New password
              </label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="Enter your new password"
                required
                minLength={6}
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={passwordError && password ? 'border-error' : ''}
              />
              <p className="text-xs text-on-surface-secondary">
                Must be at least 6 characters
              </p>
            </div>

            {/* Confirm Password Input */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="confirm-password"
                className="text-sm font-semibold text-on-surface"
              >
                Confirm password
              </label>
              <PasswordInput
                id="confirm-password"
                name="confirm-password"
                placeholder="Re-enter your new password"
                required
                minLength={6}
                disabled={loading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={passwordError && confirmPassword ? 'border-error' : ''}
              />
              {passwordError && (confirmPassword || password.length >= 6) && (
                <p className="text-xs text-error">{passwordError}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !!passwordError || !password || !confirmPassword}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-12 py-3 transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 size={20} className="animate-spin text-on-primary" />}
              <span className="text-sm font-semibold text-on-primary">
                {loading ? 'Resetting...' : 'Reset password'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

