'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { getAllUsersWithEmails } from '@/app/admin/users/serverActions'

export interface AdminUser {
    id: string
    username: string | null
    email: string
    role: string
    is_banned: boolean
    ban_reason?: string | null
    banned_until?: string | null
    created_at: string
    session_count: number
    post_count: number
}

// Query keys factory
export const adminUsersKeys = {
    all: ['admin-users'] as const,
    lists: () => [...adminUsersKeys.all, 'list'] as const,
    detail: (id: string) => [...adminUsersKeys.all, 'detail', id] as const,
}

// Fetch all users with stats
async function fetchAdminUsers(): Promise<AdminUser[]> {
    const { profiles, emails, sessionCounts, postCounts } = await getAllUsersWithEmails()

    // Merge data
    const usersData = profiles.map((p) => ({
        ...p,
        email: p.email || (emails && emails[p.id]) || 'N/A',
        session_count: (sessionCounts && sessionCounts[p.id]) || 0,
        post_count: (postCounts && postCounts[p.id]) || 0,
    }))

    return usersData
}

// Toggle user role
interface ToggleUserRoleInput {
    userId: string
    currentRole: string
}

async function toggleUserRole(input: ToggleUserRoleInput): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Not authenticated' }
    }

    // Prevent modifying super_admin role
    if (input.currentRole === 'super_admin') {
        return { success: false, error: 'Cannot modify super admin role' }
    }

    const newRole = input.currentRole === 'admin' ? 'user' : 'admin'

    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', input.userId)

    if (error) {
        return { success: false, error: error.message }
    }

    // Log admin activity
    await supabase
        .from('admin_audit_log')
        .insert({
            admin_id: user.id,
            action: newRole === 'admin' ? 'promoted' : 'demoted',
            target_table: 'profiles',
            target_id: input.userId,
            details: `Changed role to ${newRole}`
        })

    return { success: true }
}

// Ban user
interface BanUserInput {
    userId: string
    reason: string
    duration: string // 'permanent', '1day', '7days', '30days'
}

async function banUser(input: BanUserInput): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Not authenticated' }
    }

    // Check if target is a super_admin (protected)
    const { data: targetProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', input.userId)
        .single()

    if (targetProfile?.role === 'super_admin') {
        return { success: false, error: 'Cannot ban a super admin' }
    }

    let bannedUntil: string | null = null
    if (input.duration !== 'permanent') {
        const days = parseInt(input.duration.replace('days', '').replace('day', ''))
        const until = new Date()
        until.setDate(until.getDate() + days)
        bannedUntil = until.toISOString()
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            is_banned: true,
            ban_reason: input.reason,
            banned_until: bannedUntil
        })
        .eq('id', input.userId)

    if (error) {
        return { success: false, error: error.message }
    }

    // Log admin activity
    await supabase
        .from('admin_audit_log')
        .insert({
            admin_id: user.id,
            action: 'banned',
            target_table: 'profiles',
            target_id: input.userId,
            details: `Banned user: ${input.reason} (${input.duration})`
        })

    return { success: true }
}

// Unban user
interface UnbanUserInput {
    userId: string
}

async function unbanUser(input: UnbanUserInput): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            is_banned: false,
            ban_reason: null,
            banned_until: null
        })
        .eq('id', input.userId)

    if (error) {
        return { success: false, error: error.message }
    }

    // Log admin activity
    await supabase
        .from('admin_audit_log')
        .insert({
            admin_id: user.id,
            action: 'unbanned',
            target_table: 'profiles',
            target_id: input.userId,
            details: 'Unbanned user'
        })

    return { success: true }
}

// Query hooks
export function useAdminUsers() {
    return useQuery({
        queryKey: adminUsersKeys.lists(),
        queryFn: fetchAdminUsers,
        staleTime: 2 * 60 * 1000, // 2 minutes
        refetchOnWindowFocus: true,
    })
}

// Mutation hooks
export function useToggleUserRole() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: toggleUserRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() })
        },
    })
}

export function useBanUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: banUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() })
        },
    })
}

export function useUnbanUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: unbanUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() })
        },
    })
}
