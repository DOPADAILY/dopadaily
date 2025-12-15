'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/utils/admin'
import { sendUserBannedEmail, sendUserUnbannedEmail } from '@/lib/resend'

export async function toggleUserRole(userId: string, currentRole: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const newRole = currentRole === 'admin' ? 'user' : 'admin'

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user role:', error)
    return { success: false, error: error.message }
  }

  // Log admin action
  await supabase.from('admin_audit_log').insert({
    admin_id: user!.id,
    action: `Changed user role to ${newRole}`,
    target_table: 'profiles',
    target_id: userId,
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function banUser(userId: string, reason: string, duration: 'permanent' | '7days' | '30days') {
  await requireAdmin()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's email before banning
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('username, email')
    .eq('id', userId)
    .single()

  // Calculate ban expiry if not permanent
  let bannedUntil = null
  if (duration === '7days') {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    bannedUntil = date.toISOString()
  } else if (duration === '30days') {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    bannedUntil = date.toISOString()
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      is_banned: true,
      ban_reason: reason,
      banned_until: bannedUntil,
      banned_by: user!.id
    })
    .eq('id', userId)

  if (error) {
    console.error('Error banning user:', error)
    return { success: false, error: error.message }
  }

  // Log admin action
  await supabase.from('admin_audit_log').insert({
    admin_id: user!.id,
    action: `Banned user: ${reason} (${duration})`,
    target_table: 'profiles',
    target_id: userId,
  })

  // Send email notification to banned user
  if (userProfile?.email) {
    sendUserBannedEmail({
      recipientEmail: userProfile.email,
      recipientName: userProfile.username || 'User',
      reason,
      duration,
      bannedUntil
    }).catch(err => {
      console.error('Failed to send ban notification email:', err)
    })
  }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function unbanUser(userId: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's email before unbanning
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('username, email')
    .eq('id', userId)
    .single()

  const { error } = await supabase
    .from('profiles')
    .update({
      is_banned: false,
      ban_reason: null,
      banned_until: null,
      banned_by: null
    })
    .eq('id', userId)

  if (error) {
    console.error('Error unbanning user:', error)
    return { success: false, error: error.message }
  }

  // Log admin action
  await supabase.from('admin_audit_log').insert({
    admin_id: user!.id,
    action: `Unbanned user`,
    target_table: 'profiles',
    target_id: userId,
  })

  // Send email notification to unbanned user
  if (userProfile?.email) {
    sendUserUnbannedEmail({
      recipientEmail: userProfile.email,
      recipientName: userProfile.username || 'User'
    }).catch(err => {
      console.error('Failed to send unban notification email:', err)
    })
  }

  revalidatePath('/admin/users')
  return { success: true }
}

