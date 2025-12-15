'use server'

import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// Email sender configuration
// Use your verified domain for sending emails
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Dopadaily <noreply@dopadaily.org>'
const APP_NAME = 'Dopadaily'
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dopadaily.org'

// Base email template with consistent styling
function getBaseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f0eb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); padding: 32px 40px; border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                ${APP_NAME}
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Stay focused. Stay productive.
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #6b5f54; font-size: 13px;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
              <p style="margin: 0; color: #9a8f85; font-size: 12px;">
                You're receiving this email because you have an account with ${APP_NAME}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

// Button component for CTAs (email-client compatible)
function getButton(text: string, url: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
      <tr>
        <td style="background-color: #d97706; border-radius: 10px;">
          <a href="${url}" 
             style="display: inline-block; padding: 14px 32px; background-color: #d97706; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `
}

/**
 * Send a new message notification email
 */
export async function sendNewMessageEmail(params: {
  recipientEmail: string
  recipientName: string
  senderName: string
  messagePreview: string
  conversationUrl: string
}): Promise<{ success: boolean; error?: string }> {
  const { recipientEmail, recipientName, senderName, messagePreview, conversationUrl } = params

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #2b231e; font-size: 22px; font-weight: 600;">
      💬 New Message from ${senderName}
    </h2>
    
    <p style="margin: 0 0 20px 0; color: #4a4039; font-size: 16px; line-height: 1.6;">
      Hi ${recipientName || 'there'},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #4a4039; font-size: 16px; line-height: 1.6;">
      You have a new message from <strong>${senderName}</strong>:
    </p>
    
    <div style="padding: 20px; background-color: #fef3c7; border-left: 4px solid #d97706; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <p style="margin: 0; color: #4a4039; font-size: 15px; line-height: 1.6; font-style: italic;">
        "${messagePreview.length > 200 ? messagePreview.substring(0, 200) + '...' : messagePreview}"
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      ${getButton('View Message', conversationUrl)}
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b5f54; font-size: 13px;">
      Reply directly in ${APP_NAME} to continue the conversation.
    </p>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `💬 New message from ${senderName} - ${APP_NAME}`,
      html: getBaseTemplate(content)
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Email send error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Send a user banned notification email
 */
export async function sendUserBannedEmail(params: {
  recipientEmail: string
  recipientName: string
  reason?: string
  duration?: string
  bannedUntil?: string | null
}): Promise<{ success: boolean; error?: string }> {
  const { recipientEmail, recipientName, reason, duration, bannedUntil } = params

  const durationText = bannedUntil
    ? `until ${new Date(bannedUntil).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`
    : duration === 'permanent'
      ? 'permanently'
      : `for ${duration}`

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #dc2626; font-size: 22px; font-weight: 600;">
      ⚠️ Account Suspended
    </h2>
    
    <p style="margin: 0 0 20px 0; color: #4a4039; font-size: 16px; line-height: 1.6;">
      Hi ${recipientName || 'there'},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #4a4039; font-size: 16px; line-height: 1.6;">
      Your ${APP_NAME} account has been suspended ${durationText}.
    </p>
    
    ${reason ? `
    <div style="padding: 20px; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; color: #991b1b; font-size: 14px; font-weight: 600;">
        Reason:
      </p>
      <p style="margin: 0; color: #7f1d1d; font-size: 15px; line-height: 1.6;">
        ${reason}
      </p>
    </div>
    ` : ''}
    
    <p style="margin: 20px 0; color: #4a4039; font-size: 16px; line-height: 1.6;">
      If you believe this was a mistake, please contact our support team.
    </p>
    
    <p style="margin: 20px 0 0 0; color: #6b5f54; font-size: 13px;">
      - The ${APP_NAME} Team
    </p>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `⚠️ Your ${APP_NAME} account has been suspended`,
      html: getBaseTemplate(content)
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Email send error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Send a user unbanned notification email
 */
export async function sendUserUnbannedEmail(params: {
  recipientEmail: string
  recipientName: string
}): Promise<{ success: boolean; error?: string }> {
  const { recipientEmail, recipientName } = params

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #16a34a; font-size: 22px; font-weight: 600;">
      ✅ Account Restored
    </h2>
    
    <p style="margin: 0 0 20px 0; color: #4a4039; font-size: 16px; line-height: 1.6;">
      Hi ${recipientName || 'there'},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #4a4039; font-size: 16px; line-height: 1.6;">
      Great news! Your ${APP_NAME} account has been restored and you can now access all features again.
    </p>
    
    <div style="padding: 20px; background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <p style="margin: 0; color: #166534; font-size: 15px; line-height: 1.6;">
        You can now log in and continue using ${APP_NAME} as normal.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      ${getButton('Go to ' + APP_NAME, APP_URL + '/dashboard')}
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b5f54; font-size: 13px;">
      Welcome back! - The ${APP_NAME} Team
    </p>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `✅ Your ${APP_NAME} account has been restored`,
      html: getBaseTemplate(content)
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Email send error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail(params: {
  recipientEmail: string
  recipientName: string
}): Promise<{ success: boolean; error?: string }> {
  const { recipientEmail, recipientName } = params

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #2b231e; font-size: 22px; font-weight: 600;">
      🎉 Welcome to ${APP_NAME}!
    </h2>
    
    <p style="margin: 0 0 20px 0; color: #4a4039; font-size: 16px; line-height: 1.6;">
      Hi ${recipientName || 'there'},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #4a4039; font-size: 16px; line-height: 1.6;">
      Welcome aboard! We're excited to have you join the ${APP_NAME} community.
    </p>
    
    <div style="padding: 24px; background-color: #fef3c7; border-radius: 12px; margin: 24px 0;">
      <h3 style="margin: 0 0 16px 0; color: #b45309; font-size: 18px; font-weight: 600;">
        Here's what you can do:
      </h3>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #4a4039; font-size: 15px; line-height: 2;">
        <li>🎯 Set focus sessions to stay productive</li>
        <li>📝 Take notes during your work sessions</li>
        <li>🎵 Use ambient sounds to help you concentrate</li>
        <li>📊 Track your progress and build streaks</li>
        <li>💬 Connect with the community</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      ${getButton('Start Your First Session', APP_URL + '/dashboard')}
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b5f54; font-size: 13px;">
      If you have any questions, feel free to reach out. Happy focusing! 🚀
    </p>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `🎉 Welcome to ${APP_NAME}!`,
      html: getBaseTemplate(content)
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Email send error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Send a reminder notification email (personal reminders)
 */
export async function sendReminderEmail(params: {
  recipientEmail: string
  recipientName: string
  reminderTitle: string
  reminderMessage: string
}): Promise<{ success: boolean; error?: string }> {
  const { recipientEmail, recipientName, reminderTitle, reminderMessage } = params

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #2b231e; font-size: 22px; font-weight: 600;">
      ⏰ Reminder: ${reminderTitle}
    </h2>
    
    <p style="margin: 0 0 20px 0; color: #4a4039; font-size: 16px; line-height: 1.6;">
      Hi ${recipientName || 'there'},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #4a4039; font-size: 16px; line-height: 1.6;">
      This is a reminder you set for yourself:
    </p>
    
    <div style="padding: 24px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 12px 12px 0; margin: 24px 0;">
      <h3 style="margin: 0 0 12px 0; color: #b45309; font-size: 18px; font-weight: 600;">
        ${reminderTitle}
      </h3>
      <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">
        ${reminderMessage}
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      ${getButton('Open ' + APP_NAME, APP_URL + '/dashboard')}
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b5f54; font-size: 13px; text-align: center;">
      You set this reminder in ${APP_NAME}.
    </p>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `⏰ Reminder: ${reminderTitle} - ${APP_NAME}`,
      html: getBaseTemplate(content)
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Email send error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Send admin notification email (for important admin alerts)
 */
export async function sendAdminNotificationEmail(params: {
  recipientEmail: string
  subject: string
  title: string
  message: string
  actionUrl?: string
  actionText?: string
}): Promise<{ success: boolean; error?: string }> {
  const { recipientEmail, subject, title, message, actionUrl, actionText } = params

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #2b231e; font-size: 22px; font-weight: 600;">
      🔔 ${title}
    </h2>
    
    <p style="margin: 0 0 20px 0; color: #4a4039; font-size: 16px; line-height: 1.6;">
      ${message}
    </p>
    
    ${actionUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      ${getButton(actionText || 'View Details', actionUrl)}
    </div>
    ` : ''}
    
    <p style="margin: 20px 0 0 0; color: #6b5f54; font-size: 13px;">
      This is an automated notification from ${APP_NAME}.
    </p>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `🔔 ${subject} - ${APP_NAME}`,
      html: getBaseTemplate(content)
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Email send error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Send batch emails (for global reminders - up to 100 at a time)
 */
export async function sendBatchEmails(emails: Array<{
  to: string
  subject: string
  html: string
}>): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
  const results = {
    success: true,
    sent: 0,
    failed: 0,
    errors: [] as string[]
  }

  if (emails.length === 0) {
    return results
  }

  // Resend supports batch sending up to 100 emails at once
  const batchSize = 100

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)

    try {
      const { data, error } = await resend.batch.send(
        batch.map(email => ({
          from: FROM_EMAIL,
          to: email.to,
          subject: email.subject,
          html: email.html
        }))
      )

      if (error) {
        results.failed += batch.length
        results.errors.push(`Batch ${i / batchSize + 1}: ${error.message}`)
      } else {
        results.sent += batch.length
      }
    } catch (err: any) {
      results.failed += batch.length
      results.errors.push(`Batch ${i / batchSize + 1}: ${err.message}`)
    }
  }

  results.success = results.failed === 0

  return results
}

// Helper to generate global reminder email HTML
export async function generateGlobalReminderHtml(params: {
  recipientName: string
  reminderTitle: string
  reminderMessage: string
  creatorName: string
}): Promise<string> {
  const { recipientName, reminderTitle, reminderMessage, creatorName } = params

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #2b231e; font-size: 22px; font-weight: 600;">
      🔔 Community Reminder
    </h2>
    
    <p style="margin: 0 0 20px 0; color: #4a4039; font-size: 16px; line-height: 1.6;">
      Hi ${recipientName || 'there'},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #4a4039; font-size: 16px; line-height: 1.6;">
      Here's an important reminder from the ${APP_NAME} team:
    </p>
    
    <div style="padding: 24px; background-color: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 0 12px 12px 0; margin: 24px 0;">
      <h3 style="margin: 0 0 12px 0; color: #0369a1; font-size: 18px; font-weight: 600;">
        ${reminderTitle}
      </h3>
      <p style="margin: 0; color: #0c4a6e; font-size: 15px; line-height: 1.6;">
        ${reminderMessage}
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      ${getButton('Open ' + APP_NAME, APP_URL + '/dashboard')}
    </div>
    
    <p style="margin: 20px 0 0 0; color: #6b5f54; font-size: 13px; text-align: center;">
      This reminder was sent to all ${APP_NAME} community members by ${creatorName}.
    </p>
  `

  return getBaseTemplate(content)
}
