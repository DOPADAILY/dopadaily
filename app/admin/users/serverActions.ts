'use server'

import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/utils/admin'

export async function getAllUsersWithEmails() {
  await requireAdmin()
  const supabase = await createClient()

  // Get all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
    return { profiles: [], emails: {}, sessionCounts: {}, postCounts: {} }
  }

  // Get session counts
  const { data: sessions } = await supabase
    .from('focus_sessions')
    .select('user_id')

  const sessionCounts: Record<string, number> = {}
  sessions?.forEach((s) => {
    sessionCounts[s.user_id] = (sessionCounts[s.user_id] || 0) + 1
  })

  // Get post counts
  const { data: posts } = await supabase
    .from('forum_posts')
    .select('user_id')

  const postCounts: Record<string, number> = {}
  posts?.forEach((p) => {
    postCounts[p.user_id] = (postCounts[p.user_id] || 0) + 1
  })

  // Get emails from auth.users using service role
  // Note: This requires SUPABASE_SERVICE_ROLE_KEY in .env.local
  const authUsers = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    }
  )

  const authData = await authUsers.json()
  const emails: Record<string, string> = {}

  if (authData.users) {
    authData.users.forEach((u: any) => {
      emails[u.id] = u.email
    })
  }

  return {
    profiles: profiles || [],
    emails,
    sessionCounts,
    postCounts,
  }
}

