import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SoundsClient from './SoundsClient'
import { isNetworkError, logError } from '@/utils/errorHandling'

export default async function SoundsPage() {
  const supabase = await createClient()

  try {
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Only redirect to login if there's a real auth error (not network)
    if (!user && authError && !isNetworkError(authError)) {
      redirect('/login')
    }
    
    // If we have a network error but no user, we can't continue
    if (!user) {
      redirect('/login')
    }

    // Fetch user profile with error handling
    let profile = null
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      
      if (profileError && !isNetworkError(profileError)) {
        logError('Sounds Page - Profile Fetch', profileError)
      }
      
      profile = profileData
    } catch (err) {
      logError('Sounds Page - Profile Fetch Exception', err)
    }

    // Fetch active sounds with error handling
    let sounds = []
    try {
      const { data: soundsData, error } = await supabase
        .from('ambient_sounds')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        logError('Sounds Page - Sounds Fetch', error)
        
        // If it's a network error, show a user-friendly message in the UI
        if (isNetworkError(error)) {
          console.warn('Network connectivity issue - sounds will be unavailable')
        }
      } else {
        sounds = soundsData || []
      }
    } catch (err) {
      logError('Sounds Page - Sounds Fetch Exception', err)
    }

    return <SoundsClient user={user} profile={profile} initialSounds={sounds} />
  } catch (error) {
    logError('Sounds Page - Unexpected Error', error)
    // Fallback: redirect to dashboard on unexpected errors
    redirect('/dashboard')
  }
}


