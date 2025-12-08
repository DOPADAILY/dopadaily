import { Ban, Home, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function BannedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch ban details if user exists
  let banReason = null
  let bannedUntil = null
  let isPermanent = true

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('ban_reason, banned_until, is_banned')
      .eq('id', user.id)
      .single()

    if (profile && profile.is_banned) {
      banReason = profile.ban_reason
      bannedUntil = profile.banned_until
      isPermanent = !bannedUntil
    } else if (profile && !profile.is_banned) {
      // User is not banned anymore, redirect to dashboard
      redirect('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
            <Ban size={40} className="text-error" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-on-surface mb-3">
            Account Suspended
          </h1>

          {/* Message */}
          <p className="text-on-surface-secondary mb-6">
            Your account has been suspended by our moderation team. You no longer have access to Dopadaily.
          </p>

          {/* Ban Reason */}
          {banReason && (
            <div className="bg-error/5 border border-error/20 rounded-lg p-4 mb-4 text-left">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="text-error mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-on-surface mb-1">Reason:</p>
                  <p className="text-sm text-on-surface-secondary">{banReason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Ban Duration */}
          {!isPermanent && bannedUntil && (
            <div className="bg-backplate border border-border rounded-lg p-4 mb-4 text-left">
              <div className="flex items-start gap-2">
                <Clock size={18} className="text-on-surface-secondary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-on-surface mb-1">Temporary Ban</p>
                  <p className="text-sm text-on-surface-secondary">
                    Your account will be automatically unbanned on{' '}
                    {new Date(bannedUntil).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="bg-backplate border border-border rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-on-surface-secondary mb-2">
              <strong className="text-on-surface">Common suspension reasons:</strong>
            </p>
            <ul className="text-xs text-on-surface-secondary space-y-1 list-disc list-inside">
              <li>Violation of community guidelines</li>
              <li>Inappropriate content or behavior</li>
              <li>Spam or harassment</li>
              <li>Multiple user reports</li>
            </ul>
          </div>

          {/* Contact */}
          <p className="text-sm text-on-surface-secondary mb-6">
            If you believe this is a mistake, please contact us at{' '}
            <a
              href="mailto:support@calmfocus.com"
              className="text-primary hover:underline"
            >
              support@calmfocus.com
            </a>
          </p>

          {/* Home Link */}
          <Link
            href="/"
            className="btn btn-ghost inline-flex items-center gap-2"
          >
            <Home size={18} />
            Return to Home
          </Link>
        </div>

        {/* Sign Out Note */}
        <p className="text-center text-xs text-on-surface-secondary mt-4">
          You have been automatically signed out.
        </p>
      </div>
    </div>
  )
}

