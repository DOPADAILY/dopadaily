'use client'

import { useState, useEffect } from 'react'
import { X, User, Mail, Calendar, Clock, TrendingUp, MessageSquare, Target, Shield, Ban, AlertCircle, Crown } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import UserAvatar from './UserAvatar'

interface UserDetailModalProps {
  userId: string
  onClose: () => void
}

interface UserDetail {
  id: string
  username: string | null
  email: string
  full_name: string | null
  role: string
  is_banned: boolean
  ban_reason?: string | null
  banned_until?: string | null
  created_at: string
  daily_goal: number
  default_focus_duration: number
  default_break_duration: number
  session_count: number
  total_minutes: number
  post_count: number
  comment_count: number
  reaction_count: number
  last_active: string | null
}

export default function UserDetailModal({ userId, onClose }: UserDetailModalProps) {
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserDetails()
  }, [userId])

  const fetchUserDetails = async () => {
    const supabase = createClient()

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError)
      setLoading(false)
      return
    }

    // Fetch email from auth
    const authUsers = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      }
    )

    const authData = await authUsers.json()
    const authUser = authData.users?.find((u: any) => u.id === userId)

    // Fetch session stats
    const { data: sessions } = await supabase
      .from('focus_sessions')
      .select('duration_minutes, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    const sessionCount = sessions?.length || 0
    const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0
    const lastSession = sessions?.[0]

    // Fetch post count
    const { count: postCount } = await supabase
      .from('forum_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Fetch comment count
    const { count: commentCount } = await supabase
      .from('forum_comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Fetch reaction count
    const { count: reactionCount } = await supabase
      .from('post_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get last active (most recent of: session, post, comment, reaction)
    const { data: lastPost } = await supabase
      .from('forum_posts')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const { data: lastComment } = await supabase
      .from('forum_comments')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const lastActivities = [
      lastSession?.created_at,
      lastPost?.created_at,
      lastComment?.created_at
    ].filter(Boolean).sort().reverse()

    setUser({
      ...profile,
      email: profile.email || authUser?.email || 'N/A',
      session_count: sessionCount,
      total_minutes: totalMinutes,
      post_count: postCount || 0,
      comment_count: commentCount || 0,
      reaction_count: reactionCount || 0,
      last_active: lastActivities[0] || null
    })

    setLoading(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return formatDate(dateString)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <User size={24} className="text-primary" />
            User Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-backplate rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-6">
            {/* User Header Skeleton */}
            <div className="flex items-start gap-4 p-4 bg-backplate rounded-lg border border-border animate-pulse">
              <div className="w-16 h-16 rounded-full bg-neutral-medium/20"></div>
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-neutral-medium/20 rounded w-1/3"></div>
                <div className="h-4 bg-neutral-medium/20 rounded w-1/2"></div>
                <div className="h-4 bg-neutral-medium/20 rounded w-2/3"></div>
              </div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 bg-backplate rounded-lg border border-border animate-pulse">
                  <div className="h-4 bg-neutral-medium/20 rounded w-2/3 mb-3"></div>
                  <div className="h-8 bg-neutral-medium/20 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-neutral-medium/20 rounded w-3/4"></div>
                </div>
              ))}
            </div>

            {/* Preferences Skeleton */}
            <div className="p-4 bg-backplate rounded-lg border border-border animate-pulse">
              <div className="h-5 bg-neutral-medium/20 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 bg-neutral-medium/20 rounded w-2/3"></div>
                    <div className="h-4 bg-neutral-medium/20 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Info Skeleton */}
            <div className="p-4 bg-backplate rounded-lg border border-border animate-pulse">
              <div className="h-5 bg-neutral-medium/20 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-neutral-medium/20 rounded w-1/4"></div>
                    <div className="h-4 bg-neutral-medium/20 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : user ? (
          <div className="p-6 space-y-6">
            {/* User Header */}
            <div className="flex items-start gap-4 p-4 bg-backplate rounded-lg border border-border">
              <UserAvatar username={user.username || undefined} email={user.email} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-on-surface">
                    {user.full_name || user.username || 'Anonymous'}
                  </h3>
                  {user.role === 'super_admin' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                      <Crown size={12} />
                      Super Admin
                    </span>
                  )}
                  {user.role === 'admin' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      <Shield size={12} />
                      Admin
                    </span>
                  )}
                  {user.is_banned && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-error/10 text-error">
                      <Ban size={12} />
                      Banned
                    </span>
                  )}
                </div>
                {user.username && user.full_name && (
                  <p className="text-sm text-on-surface-secondary">@{user.username}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-sm text-on-surface-secondary">
                  <Mail size={14} />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-on-surface-secondary">
                  <Calendar size={14} />
                  <span>Joined {formatDate(user.created_at)}</span>
                </div>
                {user.last_active && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-on-surface-secondary">
                    <Clock size={14} />
                    <span>Last active {formatRelativeTime(user.last_active)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ban Info */}
            {user.is_banned && (user.ban_reason || user.banned_until) && (
              <div className="p-4 bg-error/5 border border-error/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="text-error mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface mb-2">Ban Information</p>
                    {user.ban_reason && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-on-surface-secondary mb-1">Reason:</p>
                        <p className="text-sm text-on-surface">{user.ban_reason}</p>
                      </div>
                    )}
                    {user.banned_until && (
                      <div>
                        <p className="text-xs font-medium text-on-surface-secondary mb-1">Ban Type:</p>
                        <p className="text-sm text-on-surface">
                          Temporary - Expires on {formatDate(user.banned_until)} at{' '}
                          {new Date(user.banned_until).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    )}
                    {!user.banned_until && (
                      <div>
                        <p className="text-xs font-medium text-on-surface-secondary mb-1">Ban Type:</p>
                        <p className="text-sm text-on-surface">Permanent</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Focus Sessions */}
              <div className="p-4 bg-backplate rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-primary" />
                  <p className="text-xs font-semibold text-on-surface-secondary">Focus Sessions</p>
                </div>
                <p className="text-2xl font-bold text-on-surface">{user.session_count}</p>
                <p className="text-xs text-on-surface-secondary mt-1">
                  {user.total_minutes} minutes total
                </p>
              </div>

              {/* Posts */}
              <div className="p-4 bg-backplate rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={16} className="text-secondary" />
                  <p className="text-xs font-semibold text-on-surface-secondary">Posts</p>
                </div>
                <p className="text-2xl font-bold text-on-surface">{user.post_count}</p>
                <p className="text-xs text-on-surface-secondary mt-1">Published</p>
              </div>

              {/* Comments */}
              <div className="p-4 bg-backplate rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={16} className="text-accent" />
                  <p className="text-xs font-semibold text-on-surface-secondary">Comments</p>
                </div>
                <p className="text-2xl font-bold text-on-surface">{user.comment_count}</p>
                <p className="text-xs text-on-surface-secondary mt-1">Posted</p>
              </div>

              {/* Reactions */}
              <div className="p-4 bg-backplate rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-success" />
                  <p className="text-xs font-semibold text-on-surface-secondary">Reactions</p>
                </div>
                <p className="text-2xl font-bold text-on-surface">{user.reaction_count}</p>
                <p className="text-xs text-on-surface-secondary mt-1">Given</p>
              </div>
            </div>

            {/* Preferences */}
            <div className="p-4 bg-backplate rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Target size={18} className="text-primary" />
                <h4 className="font-semibold text-on-surface">User Preferences</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-on-surface-secondary mb-1">Daily Goal</p>
                  <p className="text-sm font-medium text-on-surface">{user.daily_goal} sessions</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-secondary mb-1">Focus Duration</p>
                  <p className="text-sm font-medium text-on-surface">{user.default_focus_duration} minutes</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-secondary mb-1">Break Duration</p>
                  <p className="text-sm font-medium text-on-surface">{user.default_break_duration} minutes</p>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="p-4 bg-backplate rounded-lg border border-border">
              <h4 className="font-semibold text-on-surface mb-3">Account Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-secondary">User ID:</span>
                  <span className="text-on-surface font-mono text-xs">{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-secondary">Role:</span>
                  <span className="text-on-surface font-medium capitalize">{user.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-secondary">Status:</span>
                  <span className={`font-medium ${user.is_banned ? 'text-error' : 'text-success'}`}>
                    {user.is_banned ? 'Banned' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-on-surface-secondary">User not found</p>
          </div>
        )}
      </div>
    </div>
  )
}

