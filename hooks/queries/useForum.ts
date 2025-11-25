'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export interface ForumPost {
  id: number
  title: string
  content: string
  category: string
  user_id: string
  created_at: string
  profiles?: {
    username: string | null
    avatar_url: string | null
  }
  like_count?: number
  comment_count?: number
  is_liked?: boolean
}

export interface ForumComment {
  id: number
  post_id: number
  user_id: string
  content: string
  created_at: string
  profiles?: {
    username: string | null
    avatar_url: string | null
  }
}

// Query keys factory
export const forumKeys = {
  all: ['forum'] as const,
  posts: () => [...forumKeys.all, 'posts'] as const,
  postList: (filters: { category?: string; search?: string }) => 
    [...forumKeys.posts(), filters] as const,
  post: (id: number) => [...forumKeys.all, 'post', id] as const,
  comments: (postId: number) => [...forumKeys.all, 'comments', postId] as const,
  stats: () => [...forumKeys.all, 'stats'] as const,
}

// Fetch forum posts
interface FetchPostsParams {
  category?: string
  search?: string
  limit?: number
}

async function fetchPosts(params: FetchPostsParams = {}): Promise<ForumPost[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let query = supabase
    .from('forum_posts')
    .select('*, profiles(username, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(params.limit || 20)
  
  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category)
  }
  
  if (params.search?.trim()) {
    query = query.or(`title.ilike.%${params.search}%,content.ilike.%${params.search}%`)
  }
  
  const { data: posts, error } = await query
  
  if (error) throw error
  if (!posts) return []
  
  const postIds = posts.map(p => p.id)
  
  // Fetch comment counts, like counts, and user likes in parallel
  const [commentCounts, likeCounts, userLikes] = await Promise.all([
    supabase.from('forum_comments').select('post_id').in('post_id', postIds),
    supabase.from('post_reactions').select('post_id').in('post_id', postIds),
    user 
      ? supabase.from('post_reactions').select('post_id').eq('user_id', user.id).in('post_id', postIds)
      : Promise.resolve({ data: null }),
  ])
  
  const commentMap = commentCounts.data?.reduce((acc: Record<number, number>, curr) => {
    acc[curr.post_id] = (acc[curr.post_id] || 0) + 1
    return acc
  }, {}) || {}
  
  const likeMap = likeCounts.data?.reduce((acc: Record<number, number>, curr) => {
    acc[curr.post_id] = (acc[curr.post_id] || 0) + 1
    return acc
  }, {}) || {}
  
  const userLikesSet = new Set(userLikes.data?.map(l => l.post_id) || [])
  
  return posts.map(post => ({
    ...post,
    comment_count: commentMap[post.id] || 0,
    like_count: likeMap[post.id] || 0,
    is_liked: userLikesSet.has(post.id),
  }))
}

// Create post
interface CreatePostInput {
  title: string
  content: string
  category: string
}

async function createPostApi(input: CreatePostInput): Promise<ForumPost> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('forum_posts')
    .insert({
      title: input.title,
      content: input.content,
      category: input.category,
      user_id: user.id,
    })
    .select('*, profiles(username, avatar_url)')
    .single()
  
  if (error) throw error
  return data
}

// Toggle like
interface ToggleLikeResult {
  isLiked: boolean
  likeCount: number
}

async function toggleLikeApi(postId: number): Promise<ToggleLikeResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  // Check if user already liked this post
  const { data: existingLike } = await supabase
    .from('post_reactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .single()
  
  if (existingLike) {
    // Unlike
    const { error } = await supabase
      .from('post_reactions')
      .delete()
      .eq('id', existingLike.id)
    
    if (error) throw error
  } else {
    // Like
    const { error } = await supabase
      .from('post_reactions')
      .insert({
        user_id: user.id,
        post_id: postId,
        reaction_type: 'like',
      })
    
    if (error) throw error
  }
  
  // Get updated like count
  const { count } = await supabase
    .from('post_reactions')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)
  
  return { isLiked: !existingLike, likeCount: count || 0 }
}

// Fetch comments for a post
async function fetchComments(postId: number): Promise<ForumComment[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('forum_comments')
    .select('*, profiles(username, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data || []
}

// Create comment
interface CreateCommentInput {
  postId: number
  content: string
}

async function createCommentApi(input: CreateCommentInput): Promise<ForumComment> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('forum_comments')
    .insert({
      post_id: input.postId,
      user_id: user.id,
      content: input.content,
    })
    .select('*, profiles(username, avatar_url)')
    .single()
  
  if (error) throw error
  return data
}

// Query hooks
export function useForumPosts(filters: FetchPostsParams = {}) {
  return useQuery({
    queryKey: forumKeys.postList(filters),
    queryFn: () => fetchPosts(filters),
  })
}

export function useForumComments(postId: number) {
  return useQuery({
    queryKey: forumKeys.comments(postId),
    queryFn: () => fetchComments(postId),
    enabled: !!postId,
  })
}

// Mutation hooks with optimistic updates
export function useCreatePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createPostApi,
    onSuccess: () => {
      // Invalidate all post lists to refresh
      queryClient.invalidateQueries({ queryKey: forumKeys.posts() })
    },
  })
}

export function useToggleLike() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: toggleLikeApi,
    onMutate: async (postId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: forumKeys.posts() })
      
      // Snapshot all post lists
      const previousQueries = queryClient.getQueriesData({ queryKey: forumKeys.posts() })
      
      // Optimistically update all post lists
      queryClient.setQueriesData(
        { queryKey: forumKeys.posts() },
        (old: ForumPost[] | undefined) => {
          if (!old) return old
          return old.map(post => {
            if (post.id === postId) {
              const newIsLiked = !post.is_liked
              return {
                ...post,
                is_liked: newIsLiked,
                like_count: newIsLiked
                  ? (post.like_count || 0) + 1
                  : Math.max((post.like_count || 0) - 1, 0),
              }
            }
            return post
          })
        }
      )
      
      return { previousQueries }
    },
    onError: (_err, _postId, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: forumKeys.posts() })
    },
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createCommentApi,
    onMutate: async (newComment) => {
      await queryClient.cancelQueries({ queryKey: forumKeys.comments(newComment.postId) })
      
      const previousComments = queryClient.getQueryData<ForumComment[]>(
        forumKeys.comments(newComment.postId)
      )
      
      // Optimistic comment
      const optimisticComment: ForumComment = {
        id: Date.now(),
        post_id: newComment.postId,
        user_id: 'temp',
        content: newComment.content,
        created_at: new Date().toISOString(),
        profiles: { username: 'You', avatar_url: null },
      }
      
      queryClient.setQueryData<ForumComment[]>(
        forumKeys.comments(newComment.postId),
        (old) => [...(old || []), optimisticComment]
      )
      
      return { previousComments }
    },
    onError: (_err, newComment, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(
          forumKeys.comments(newComment.postId),
          context.previousComments
        )
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: forumKeys.comments(variables.postId) })
      queryClient.invalidateQueries({ queryKey: forumKeys.posts() })
    },
  })
}


