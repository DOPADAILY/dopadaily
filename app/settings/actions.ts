'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Delete user's own account
export async function deleteOwnAccount(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check if user is a super_admin (cannot delete themselves)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'super_admin') {
    return { success: false, error: 'Super admins cannot delete their own account' }
  }

  // Use admin client to delete user from auth
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Delete user (cascades to profiles and related data)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)

  if (error) {
    console.error('Error deleting account:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Admin: Delete another user's account
export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check if current user is admin
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin' && adminProfile?.role !== 'super_admin') {
    return { success: false, error: 'Not authorized' }
  }

  // Check if target is a super_admin (cannot be deleted)
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('role, username, email')
    .eq('id', userId)
    .single()

  if (!targetProfile) {
    return { success: false, error: 'User not found' }
  }

  if (targetProfile.role === 'super_admin') {
    return { success: false, error: 'Cannot delete a super admin' }
  }

  // Prevent self-deletion via this route
  if (userId === user.id) {
    return { success: false, error: 'Use the settings page to delete your own account' }
  }

  // Use admin client to delete user from auth
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Delete user (cascades to profiles and related data)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (error) {
    console.error('Error deleting user:', error)
    return { success: false, error: error.message }
  }

  // Log admin activity
  await supabase
    .from('admin_audit_log')
    .insert({
      admin_id: user.id,
      action: 'deleted_user',
      target_table: 'profiles',
      target_id: userId,
      details: `Deleted user: ${targetProfile.username || targetProfile.email}`
    })

  revalidatePath('/admin/users')
  return { success: true }
}
