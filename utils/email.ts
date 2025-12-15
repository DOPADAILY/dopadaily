'use server'

/**
 * Get user email by ID from Supabase Auth
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable
 */
export async function getUserEmailById(userId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch user email:', response.status)
      return null
    }

    const user = await response.json()
    return user.email || null
  } catch (error) {
    console.error('Error fetching user email:', error)
    return null
  }
}

/**
 * Get multiple user emails by IDs from Supabase Auth
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable
 */
export async function getUserEmailsByIds(userIds: string[]): Promise<Record<string, string>> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch user emails:', response.status)
      return {}
    }

    const data = await response.json()
    const emails: Record<string, string> = {}

    if (data.users) {
      data.users.forEach((u: { id: string; email: string }) => {
        if (userIds.includes(u.id)) {
          emails[u.id] = u.email
        }
      })
    }

    return emails
  } catch (error) {
    console.error('Error fetching user emails:', error)
    return {}
  }
}

/**
 * Get all user emails (for global notifications)
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable
 * WARNING: Use carefully - can return many users
 */
export async function getAllUserEmails(): Promise<Array<{ id: string; email: string }>> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch all user emails:', response.status)
      return []
    }

    const data = await response.json()

    if (data.users) {
      return data.users.map((u: { id: string; email: string }) => ({
        id: u.id,
        email: u.email
      }))
    }

    return []
  } catch (error) {
    console.error('Error fetching all user emails:', error)
    return []
  }
}
