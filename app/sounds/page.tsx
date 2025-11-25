import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SoundsClient from './SoundsClient'

export default async function SoundsPage() {
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Only fetch profile for header - sounds are fetched client-side with TanStack Query
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  return <SoundsClient user={user} profile={profile} />
}
