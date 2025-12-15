'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import { sendWelcomeEmail } from '@/lib/resend'

export async function checkUsernameAvailability(username: string) {
  const supabase = await createClient()

  // Check if username exists in profiles table
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single()

  // If no data found, username is available
  return { available: !data }
}

export async function checkEmailAvailability(email: string) {
  const supabase = await createClient()

  // Try to check if user exists by querying profiles with email
  // This is a workaround since we can't directly query auth.users
  const { data: { user }, error } = await supabase.auth.getUser()

  // For now, we'll rely on Supabase's built-in email validation during signup
  return { available: true }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const username = formData.get('username') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate username
  if (!username || username.length < 3) {
    redirect('/signup?error=' + encodeURIComponent('Username must be at least 3 characters'))
  }

  // Check if username is alphanumeric with underscores/hyphens only
  const usernameRegex = /^[a-zA-Z0-9_-]+$/
  if (!usernameRegex.test(username)) {
    redirect('/signup?error=' + encodeURIComponent('Username can only contain letters, numbers, hyphens, and underscores'))
  }

  // Check if username is available
  const { available: usernameAvailable } = await checkUsernameAvailability(username)
  if (!usernameAvailable) {
    redirect('/signup?error=' + encodeURIComponent('This username is already taken. Please choose another.'))
  }

  // Basic email validation
  if (!email || !email.includes('@')) {
    redirect('/signup?error=' + encodeURIComponent('Please enter a valid email address'))
  }

  if (!password || password.length < 6) {
    redirect('/signup?error=' + encodeURIComponent('Password must be at least 6 characters'))
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
      }
    }
  })

  if (error) {
    // Check if it's a duplicate email error
    if (error.message.includes('already registered') || error.message.includes('already exists')) {
      redirect('/signup?error=' + encodeURIComponent('This email is already registered. Please login instead.'))
    }
    redirect('/signup?error=' + encodeURIComponent(error.message))
  }

  // Send welcome email (non-blocking)
  sendWelcomeEmail({
    recipientEmail: email,
    recipientName: username
  }).catch(err => {
    console.error('Failed to send welcome email:', err)
  })

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

