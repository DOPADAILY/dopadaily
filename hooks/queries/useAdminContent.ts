'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export interface DailyTip {
    id: number
    title: string
    content: string
    category: string
    is_active: boolean
    created_at: string
    created_by?: string
}

export interface AdminForumPost {
    id: number
    title: string
    content: string
    category: string
    created_at: string
    user_id: string
    profiles: {
        username: string
    } | null
}

export interface AdminComment {
    id: number
    post_id: number
    user_id: string
    content: string
    created_at: string
    profiles: {
        username: string | null
    } | null
    forum_posts: {
        title: string
    } | null
}

// Query keys factory
export const contentKeys = {
    all: ['admin-content'] as const,
    tips: () => [...contentKeys.all, 'tips'] as const,
    posts: () => [...contentKeys.all, 'posts'] as const,
    comments: () => [...contentKeys.all, 'comments'] as const,
}

// Fetch daily tips
async function fetchDailyTips(): Promise<DailyTip[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('daily_tips')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
}

// Fetch admin forum posts
async function fetchAdminForumPosts(): Promise<AdminForumPost[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('forum_posts')
            .select('*, profiles(username)')
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) {
            // Handle relationship error gracefully
            if (error.code === 'PGRST200') {
                console.warn('Forum posts table exists but missing foreign key relationship to profiles')
                const { data: postsOnly, error: postsOnlyError } = await supabase
                    .from('forum_posts')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(20)

                if (postsOnlyError) throw postsOnlyError
                return postsOnly || []
            }
            throw error
        }

        return data || []
    } catch (err) {
        console.error('Forum posts error:', err)
        return []
    }
}

// Fetch admin comments
async function fetchAdminComments(): Promise<AdminComment[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('forum_comments')
            .select('*, profiles(username), forum_posts(title)')
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) throw error
        return data || []
    } catch (err) {
        console.error('Comments error:', err)
        return []
    }
}

// Create daily tip
interface CreateTipInput {
    title: string
    content: string
    category: string
    is_active: boolean
    created_by: string
}

async function createDailyTip(input: CreateTipInput): Promise<DailyTip> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('daily_tips')
        .insert(input)
        .select()
        .single()

    if (error) throw error
    return data
}

// Delete daily tip
async function deleteDailyTip(id: number): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('daily_tips')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// Delete forum post
async function deleteForumPost(id: number): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('forum_posts')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// Delete comment
async function deleteComment(id: number): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('forum_comments')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// Query hooks
export function useDailyTips() {
    return useQuery({
        queryKey: contentKeys.tips(),
        queryFn: fetchDailyTips,
        staleTime: 2 * 60 * 1000, // 2 minutes
        refetchOnWindowFocus: true,
    })
}

export function useAdminForumPosts() {
    return useQuery({
        queryKey: contentKeys.posts(),
        queryFn: fetchAdminForumPosts,
        staleTime: 1 * 60 * 1000, // 1 minute
        refetchOnWindowFocus: true,
    })
}

export function useAdminComments() {
    return useQuery({
        queryKey: contentKeys.comments(),
        queryFn: fetchAdminComments,
        staleTime: 1 * 60 * 1000, // 1 minute
        refetchOnWindowFocus: true,
    })
}

// Mutation hooks
export function useCreateDailyTip() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createDailyTip,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contentKeys.tips() })
        },
    })
}

export function useDeleteDailyTip() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteDailyTip,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contentKeys.tips() })
        },
    })
}

export function useDeleteForumPost() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteForumPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contentKeys.posts() })
        },
    })
}

export function useDeleteComment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contentKeys.comments() })
        },
    })
}
