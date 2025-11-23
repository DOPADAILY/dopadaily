'use server'

import { createClient } from '@/utils/supabase/server'

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string

  if (!password) {
    return { success: false, error: 'Password is required' }
  }

  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    console.error('Password update error:', error)
    return { success: false, error: 'Failed to update password. The reset link may have expired.' }
  }

  return { success: true }
}

