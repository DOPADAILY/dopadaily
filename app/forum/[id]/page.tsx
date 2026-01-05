import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Calendar } from 'lucide-react'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'
import CommentForm from './CommentForm'
import PostDetailClient from './PostDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile for username and role
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, role')
    .eq('id', user.id)
    .single()

  // Fetch the post
  const { data: post, error: postError } = await supabase
    .from('forum_posts')
    .select('*, profiles(username, avatar_url)')
    .eq('id', id)
    .single()

  if (postError || !post) {
    notFound()
  }

  // Check if current user is author or admin
  const isAuthor = post.user_id === user.id
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  // Fetch comments for this post
  const { data: comments } = await supabase
    .from('forum_comments')
    .select('*, profiles(username, avatar_url)')
    .eq('post_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen">

      {/* Header */}
      <header className="h-16 lg:border-b border-border lg:bg-surface-elevated/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-4">
          <MobileMenuButton />
          <Link
            href="/forum"
            className="inline-flex items-center gap-1 sm:gap-2 text-on-surface-secondary hover:text-on-surface transition-colors text-sm shrink-0"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back to Forum</span>
          </Link>
          <div className="flex-1"></div>
          <UserMenu email={user.email} username={profile?.username} />
        </div>
      </header>

      <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12 max-w-4xl">

        {/* Post Content */}
        <article className="card mb-6">

          {/* Post Header */}
          <div className="flex items-start gap-3 mb-4 pb-4 border-b border-border">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-base font-semibold text-primary shrink-0">
              {post.profiles?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-on-surface">
                {post.profiles?.username || 'Anonymous'}
              </p>
              <div className="flex items-center gap-3 text-xs text-on-surface-secondary mt-1">
                <span className="badge badge-neutral capitalize">{post.category}</span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(post.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
            <PostDetailClient
              postId={post.id}
              title={post.title}
              content={post.content}
              category={post.category}
              createdAt={post.created_at}
              isAuthor={isAuthor}
              isAdmin={isAdmin}
            />
          </div>

          {/* Post Title & Content */}
          <h1 className="text-2xl font-bold text-on-surface mb-4">{post.title}</h1>
          <div className="prose prose-sm max-w-none">
            <p className="text-on-surface leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

        </article>

        {/* Comments Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-on-surface">
              Comments ({comments?.length || 0})
            </h2>
          </div>

          {/* Comment Form */}
          <CommentForm
            postId={id}
            userInitial={profile?.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
          />

          {/* Comments List */}
          {comments && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-semibold text-secondary shrink-0">
                    {comment.profiles?.username?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-backplate rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm text-on-surface">
                          {comment.profiles?.username || 'Anonymous'}
                        </span>
                        <span className="text-xs text-on-surface-secondary">
                          {new Date(comment.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare size={48} className="mx-auto text-neutral-medium mb-3 opacity-50" />
              <p className="text-on-surface-secondary">No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}

