'use server'

import { createClient } from '@/utils/supabase/server'

export async function requestPasswordReset(formData: FormData) {
    const email = formData.get('email') as string

    if (!email) {
        return { success: false, error: 'Email is required' }
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    })

    if (error) {
        console.error('Password reset error:', error)
        return { success: false, error: 'Failed to send reset email. Please try again.' }
    }

    return { success: true }
}

