# Email Notifications with Resend - Setup Guide

## Overview

Dopadaily uses Resend for transactional email notifications. This includes:

- **Message notifications** - When someone sends you a message
- **Welcome emails** - When new users sign up
- **Ban/Unban notifications** - When user account status changes
- **Reminder notifications** - Personal and global reminders (via Vercel Cron)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Email Flow                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Server Actions (instant)         Vercel Cron (scheduled)   │
│  ├── sendMessage()                └── /api/cron/reminders   │
│  ├── signup()                         ├── Personal reminders│
│  ├── banUser()                        ├── Global reminders  │
│  └── unbanUser()                      └── Cleanup old data  │
│           │                                    │             │
│           └────────────┬───────────────────────┘             │
│                        ▼                                     │
│               lib/resend.ts                                  │
│               (Resend API)                                   │
│                        │                                     │
│                        ▼                                     │
│                   User Email                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Resend account (free tier: 100 emails/day, 3,000/month)
- Verified domain on Resend
- Vercel project (for cron jobs)

## Environment Variables

Add these to your `.env.local` and Vercel:

```bash
# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=Dopadaily <noreply@yourdomain.com>

# For Cron Jobs (Vercel only)
CRON_SECRET=your-random-secret-string
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Setup Steps

### 1. Resend Setup

1. Go to https://resend.com and sign up
2. Verify your email
3. Add and verify your domain at **Domains** → **Add Domain**
4. Get your API key from **Settings** → **API Keys**

### 2. Database Migration

Run the reminder notifications migration in Supabase SQL Editor:

```sql
-- File: supabase/migrations/add_reminder_notifications.sql
-- Run this in Supabase Dashboard → SQL Editor
```

This adds:

- `is_notified`, `notified_at`, `email_enabled` columns to `reminders`
- `email_notifications` column to `profiles`
- `global_reminder_notifications` table
- Helper functions for cron job

### 3. Environment Variables

**Local Development (.env.local):**

```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=Dopadaily <noreply@dopadaily.org>
```

**Vercel Dashboard (for production + cron):**

```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=Dopadaily <noreply@dopadaily.org>
CRON_SECRET=generate-a-random-secret-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Deploy to Vercel

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This runs every 5 minutes and:

- Sends personal reminder emails when due
- Sends global reminder emails to all users
- Cleans up notification records older than 30 days

## Email Templates

All templates are in `lib/resend.ts`:

| Function                       | Purpose                         |
| ------------------------------ | ------------------------------- |
| `sendNewMessageEmail()`        | New message notification        |
| `sendWelcomeEmail()`           | Welcome new users               |
| `sendUserBannedEmail()`        | Account suspension notice       |
| `sendUserUnbannedEmail()`      | Account restored notice         |
| `sendReminderEmail()`          | Personal reminder               |
| `sendBatchEmails()`            | Batch send for global reminders |
| `generateGlobalReminderHtml()` | Global reminder template        |

## Color Scheme

Emails use a warm amber theme:

- Header: `#d97706` → `#b45309` gradient
- Buttons: `#d97706` solid
- Accent boxes: `#fef3c7` background

## Testing

### Test Locally

1. Set `RESEND_API_KEY` in `.env.local`
2. Trigger actions (send message, sign up, etc.)
3. Check your email

### Test Cron Job

```bash
# Test the cron endpoint locally
curl -X GET http://localhost:3000/api/cron/reminders \
  -H "Authorization: Bearer your-cron-secret"
```

### Test in Production

After deploying to Vercel, the cron job runs automatically. Check:

- Vercel Dashboard → Logs → Functions
- Filter by `/api/cron/reminders`

## Troubleshooting

### Emails not sending?

1. Check `RESEND_API_KEY` is set correctly
2. Verify domain is verified on Resend
3. Check Resend dashboard for delivery logs

### Cron job not running?

1. Ensure `CRON_SECRET` is set in Vercel
2. Check Vercel cron logs
3. Verify `vercel.json` has the cron config

### 403 Error from Resend?

- You're likely using a test API key
- Test keys can only send to the verified account email
- Use a production API key with verified domain

## File Structure

```
├── lib/
│   └── resend.ts                    # Email client & templates
├── app/
│   ├── api/cron/reminders/
│   │   └── route.ts                 # Cron job handler
│   ├── messages/
│   │   └── actions.ts               # Message emails
│   ├── admin/users/
│   │   └── actions.ts               # Ban/unban emails
│   └── signup/
│       └── actions.ts               # Welcome emails
├── supabase/migrations/
│   └── add_reminder_notifications.sql
└── vercel.json                      # Cron configuration
```

## User Preferences

Users can control email notifications via:

- `profiles.email_notifications` - Global toggle (default: true)
- `reminders.email_enabled` - Per-reminder toggle (default: true)

---

Last updated: December 2025
