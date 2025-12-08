'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { MessageSquare, Plus, Users, Search, Lock, Crown } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import LikeButton from '@/components/LikeButton'
import { useForumPosts, ForumPost, useIsPremium } from '@/hooks/queries'
import { ForumSkeleton } from '@/components/SkeletonLoader'
import UpgradePrompt from '@/components/UpgradePrompt'

interface ForumClientProps {
  totalMembers: number
  totalDiscussions: number
  activeToday: number
}

export default function ForumClient({ totalMembers, totalDiscussions, activeToday }: ForumClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const category = searchParams.get('category') || undefined
  const search = searchParams.get('search') || undefined

  const [searchInput, setSearchInput] = useState(search || '')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Subscription check
  const { isPremium, isLoading: isSubLoading } = useIsPremium()

  // TanStack Query hook with filters
  const { data: posts = [], isLoading, error } = useForumPosts({ category, search })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (searchInput.trim()) params.set('search', searchInput.trim())
    router.push(`/forum?${params.toString()}`)
  }

  // Only show skeleton on initial load when there's no cached data
  if (isLoading && posts.length === 0) {
    return <ForumSkeleton />
  }

  // Show error state
  if (error) {
    return (
      <div className="card">
        <EmptyState
          icon={MessageSquare}
          title="Failed to load discussions"
          description={error.message || 'Something went wrong. Please try again.'}
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <aside className="space-y-6 hidden xl:block">
        {/* Stats Card */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-primary" />
            <h3 className="font-semibold text-on-surface">Community Stats</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-secondary">Members</span>
              <span className="font-semibold text-on-surface">{totalMembers?.toLocaleString() || 0}</span>
            </div>
            <div className="h-px bg-border"></div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-secondary">Discussions</span>
              <span className="font-semibold text-on-surface">{totalDiscussions?.toLocaleString() || 0}</span>
            </div>
            <div className="h-px bg-border"></div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-secondary">Active Today</span>
              <span className="font-semibold text-primary">{activeToday?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        {/* Categories - Desktop vertical list */}
        <div className="card">
          <h3 className="font-semibold text-on-surface mb-4">Categories</h3>
          <div className="space-y-2">
            <Link
              href="/forum"
              className={`w-full block text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${!category || category === 'all'
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-on-surface-secondary hover:bg-backplate hover:text-on-surface'
                }`}
            >
              All Discussions
            </Link>
            {['general', 'strategies', 'wins', 'venting'].map((cat) => (
              <Link
                key={cat}
                href={`/forum?category=${cat}`}
                className={`w-full block text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize cursor-pointer ${category === cat
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-on-surface-secondary hover:bg-backplate hover:text-on-surface'
                  }`}
              >
                {cat === 'general' ? 'General Chat' : cat === 'strategies' ? 'Strategies & Tips' : cat === 'wins' ? 'Small Wins' : 'Safe Space'}
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="xl:col-span-3 space-y-6">
        {/* Mobile Categories - Horizontal scrollable */}
        <div className="xl:hidden overflow-x-auto -mx-4 px-4 animate-stagger-1">
          <div className="flex gap-2 pb-2 min-w-max">
            <Link
              href="/forum"
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${!category || category === 'all'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-elevated border border-border text-on-surface-secondary hover:border-primary'
                }`}
            >
              All
            </Link>
            {['general', 'strategies', 'wins', 'venting'].map((cat) => (
              <Link
                key={cat}
                href={`/forum?category=${cat}`}
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize cursor-pointer whitespace-nowrap ${category === cat
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-elevated border border-border text-on-surface-secondary hover:border-primary'
                  }`}
              >
                {cat === 'general' ? '💬 General' : cat === 'strategies' ? '💡 Strategies' : cat === 'wins' ? '🎉 Wins' : '💭 Safe Space'}
              </Link>
            ))}
          </div>
        </div>

        {/* Create Post CTA - Premium Only */}
        {isPremium ? (
          <Link
            href="/forum/new"
            className="block card bg-linear-to-br from-primary/5 via-surface-elevated to-accent/5 border-2 border-dashed border-primary/30 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/30 transition-colors">
                <Plus size={20} className="text-primary sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-on-surface mb-0 sm:mb-1 group-hover:text-primary transition-colors">
                  Start a New Discussion
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-secondary hidden sm:block">
                  Share your thoughts, ask questions, or celebrate your wins with the community
                </p>
              </div>
            </div>
          </Link>
        ) : (
          <div
            onClick={() => setShowUpgradeModal(true)}
            className="block card bg-linear-to-br from-primary/5 via-surface-elevated to-accent/5 border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-elevated flex items-center justify-center shrink-0">
                <Lock size={20} className="text-on-surface-secondary sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0 sm:mb-1">
                  <h3 className="text-sm sm:text-base font-semibold text-on-surface-secondary">
                    Join the Conversation
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
                    <Crown className="w-3 h-3" />
                    Premium
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-on-surface-secondary hidden sm:block">
                  Upgrade to Premium to post, comment, and interact with the community
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-medium" />
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-surface-elevated text-on-surface placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </form>

        {/* Active Filters */}
        {(category || search) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-on-surface-secondary">Active filters:</span>
            {category && (
              <Link
                href={search ? `/forum?search=${search}` : '/forum'}
                className="badge badge-neutral text-xs capitalize flex items-center gap-1 cursor-pointer hover:bg-error/10 hover:text-error transition-colors"
              >
                {category}
                <span>×</span>
              </Link>
            )}
            {search && (
              <Link
                href={category ? `/forum?category=${category}` : '/forum'}
                className="badge badge-neutral text-xs flex items-center gap-1 cursor-pointer hover:bg-error/10 hover:text-error transition-colors"
              >
                "{search}"
                <span>×</span>
              </Link>
            )}
            <Link
              href="/forum"
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              Clear all
            </Link>
          </div>
        )}

        {/* Posts List */}
        {posts.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No discussions yet"
            description="Be the first to start a conversation and share your thoughts with the community."
            action={
              <Link href="/forum/new" className="btn btn-primary">
                <Plus size={18} />
                Start the conversation
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {posts.map((post, index) => (
              <Link
                key={post.id}
                href={`/forum/${post.id}`}
                className="block card card-interactive hover:border-primary group animate-scale-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="badge badge-neutral capitalize text-xs">
                        {post.category}
                      </span>
                      <span className="text-xs text-on-surface-secondary">
                        {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-on-surface group-hover:text-primary transition-colors mb-2">
                      {post.title}
                    </h2>
                    <p className="text-on-surface-secondary line-clamp-2 text-sm leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                      {post.profiles?.username?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <span className="text-sm font-medium text-on-surface-secondary">
                      {post.profiles?.username || 'Anonymous'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPremium ? (
                      <LikeButton
                        postId={post.id}
                        initialLikeCount={post.like_count || 0}
                        initialIsLiked={post.is_liked || false}
                      />
                    ) : (
                      <div className="flex items-center gap-1 text-on-surface-secondary px-3 py-1.5">
                        <span className="text-sm font-medium">{post.like_count || 0} likes</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-on-surface-secondary px-3 py-1.5">
                      <MessageSquare size={16} />
                      <span className="text-sm font-medium">{post.comment_count || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradePrompt
          feature="Full Forum Access"
          description="Free users can browse discussions. Upgrade to Premium to create posts, comment, and like."
          variant="modal"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  )
}

