import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendReminderEmail, sendBatchEmails, generateGlobalReminderHtml } from '@/lib/resend'

// Use service role for cron job - bypasses RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('CRON_SECRET not configured')
    return false
  }

  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const results = {
    personalReminders: { processed: 0, sent: 0, failed: 0 },
    globalReminders: { processed: 0, usersSent: 0, failed: 0 },
    errors: [] as string[]
  }

  try {
    const now = new Date().toISOString()

    // ============================================
    // 1. PROCESS PERSONAL REMINDERS
    // ============================================
    const { data: personalReminders, error: personalError } = await supabase
      .from('reminders')
      .select(`
        id,
        title,
        message,
        remind_at,
        created_by,
        creator:profiles!reminders_created_by_fkey(email, username, email_notifications)
      `)
      .eq('is_global', false)
      .eq('is_notified', false)
      .eq('email_enabled', true)
      .lte('remind_at', now)
      .limit(50) // Process in batches

    if (personalError) {
      results.errors.push(`Personal reminders query error: ${personalError.message}`)
    } else if (personalReminders && personalReminders.length > 0) {
      for (const reminder of personalReminders) {
        results.personalReminders.processed++

        // Supabase returns joined relations as arrays
        const creator = (reminder.creator as any)?.[0] || reminder.creator

        // Skip if user has disabled email notifications
        if (!creator?.email_notifications || !creator?.email) {
          continue
        }

        try {
          const emailResult = await sendReminderEmail({
            recipientEmail: creator.email,
            recipientName: creator.username || 'User',
            reminderTitle: reminder.title,
            reminderMessage: reminder.message || 'No additional details'
          })

          if (emailResult.success) {
            // Mark as notified
            await supabase
              .from('reminders')
              .update({ is_notified: true, notified_at: new Date().toISOString() })
              .eq('id', reminder.id)

            results.personalReminders.sent++
          } else {
            results.personalReminders.failed++
            results.errors.push(`Personal reminder ${reminder.id}: ${emailResult.error}`)
          }
        } catch (err: any) {
          results.personalReminders.failed++
          results.errors.push(`Personal reminder ${reminder.id}: ${err.message}`)
        }
      }
    }

    // ============================================
    // 2. PROCESS GLOBAL REMINDERS
    // ============================================
    const { data: globalReminders, error: globalError } = await supabase
      .from('reminders')
      .select(`
        id,
        title,
        message,
        remind_at,
        created_by,
        creator:profiles!reminders_created_by_fkey(username)
      `)
      .eq('is_global', true)
      .eq('email_enabled', true)
      .lte('remind_at', now)
      .limit(10) // Process fewer global reminders as they send to many users

    if (globalError) {
      results.errors.push(`Global reminders query error: ${globalError.message}`)
    } else if (globalReminders && globalReminders.length > 0) {
      for (const reminder of globalReminders) {
        results.globalReminders.processed++

        // Supabase returns joined relations as arrays
        const creator = (reminder.creator as any)?.[0] || reminder.creator

        try {
          // Get users who haven't been notified for this reminder
          const { data: users, error: usersError } = await supabase
            .rpc('get_users_for_global_reminder', { p_reminder_id: reminder.id })

          if (usersError) {
            results.errors.push(`Global reminder ${reminder.id} users query: ${usersError.message}`)
            continue
          }

          if (!users || users.length === 0) {
            // All users notified, mark reminder as complete
            await supabase
              .from('reminders')
              .update({ is_notified: true, notified_at: new Date().toISOString() })
              .eq('id', reminder.id)
            continue
          }

          // Prepare batch emails
          const emails = await Promise.all(users.map(async (user: any) => ({
            to: user.email,
            subject: `🔔 ${reminder.title} - Dopadaily`,
            html: await generateGlobalReminderHtml({
              recipientName: user.username || 'User',
              reminderTitle: reminder.title,
              reminderMessage: reminder.message || 'Check in with yourself and stay focused!',
              creatorName: creator?.username || 'Dopadaily Team'
            })
          })))

          // Send batch (Resend supports up to 100 at once)
          const batchResult = await sendBatchEmails(emails)

          // Record notifications for each user (reminder.id is BIGINT)
          if (batchResult.sent > 0) {
            const notificationRecords = users.slice(0, batchResult.sent).map((user: any) => ({
              reminder_id: Number(reminder.id), // Ensure it's a number for the insert
              user_id: user.user_id
            }))

            await supabase
              .from('global_reminder_notifications')
              .insert(notificationRecords)
              .select()

            results.globalReminders.usersSent += batchResult.sent
          }

          if (batchResult.failed > 0) {
            results.globalReminders.failed += batchResult.failed
            results.errors.push(...batchResult.errors)
          }

        } catch (err: any) {
          results.globalReminders.failed++
          results.errors.push(`Global reminder ${reminder.id}: ${err.message}`)
        }
      }
    }

    // ============================================
    // 3. CLEANUP OLD NOTIFICATION RECORDS (30+ days)
    // ============================================
    const { data: cleanupResult } = await supabase
      .rpc('cleanup_old_reminder_notifications', { days_to_keep: 30 })

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      results,
      cleanup: { deletedRecords: cleanupResult || 0 }
    })

  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      results
    }, { status: 500 })
  }
}

// Vercel Cron configuration
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for processing
