'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createReminder(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return

  const title = formData.get('title') as string
  const message = formData.get('message') as string
  const isGlobal = formData.get('isGlobal') === 'on'
  const date = formData.get('date') as string // YYYY-MM-DDTHH:mm

  await supabase.from('reminders').insert({
    created_by: user.id,
    title,
    message,
    is_global: isGlobal,
    remind_at: new Date(date).toISOString()
  })

  revalidatePath('/reminders')
}

export async function updateReminder(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }

  const id = parseInt(formData.get('id') as string)
  const title = formData.get('title') as string
  const message = formData.get('message') as string
  const isGlobal = formData.get('isGlobal') === 'on'
  const date = formData.get('date') as string

  // Check if user owns this reminder or is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: reminder } = await supabase
    .from('reminders')
    .select('created_by')
    .eq('id', id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const isOwner = reminder?.created_by === user.id

  if (!isAdmin && !isOwner) {
    return { error: 'You do not have permission to edit this reminder' }
  }

  const { error } = await supabase
    .from('reminders')
    .update({
      title,
      message,
      is_global: isGlobal,
      remind_at: new Date(date).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/reminders')
  return { success: true }
}

export async function deleteReminder(id: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return

  // Check if user owns this reminder or is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: reminder } = await supabase
    .from('reminders')
    .select('created_by')
    .eq('id', id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const isOwner = reminder?.created_by === user.id

  if (!isAdmin && !isOwner) {
    return
  }

  await supabase.from('reminders').delete().eq('id', id)
  revalidatePath('/reminders')
}
