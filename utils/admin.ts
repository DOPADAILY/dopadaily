import { createClient } from '@/utils/supabase/server'

export async function isAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    return profile?.role === 'admin' || profile?.role === 'super_admin'
}

export async function requireAdmin() {
    const admin = await isAdmin()
    if (!admin) {
        throw new Error('Unauthorized: Admin access required')
    }
    return true
}

