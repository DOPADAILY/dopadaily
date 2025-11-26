# Email Notifications with Resend - Setup Guide

## Overview
This guide explains how to add email notifications for reminders using Resend and Supabase Edge Functions.

## Prerequisites
- Supabase project
- Resend account (free tier: 100 emails/day, 3,000/month)
- Supabase CLI installed

## Step 1: Sign up for Resend

1. Go to https://resend.com
2. Sign up for free account
3. Verify your email
4. Add your domain (or use `onboarding@resend.dev` for testing)
5. Get your API key from Settings → API Keys

## Step 2: Set Up Supabase Edge Function

### Create the Edge Function

```bash
# In your project root
supabase functions new send-reminder-emails
```

### Function Code

Create `supabase/functions/send-reminder-emails/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    // Get reminders due in the next 5 minutes that haven't been sent
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)
    
    const { data: dueReminders, error } = await supabase
      .from('reminders')
      .select(`
        *,
        profiles!reminders_created_by_fkey(email, username)
      `)
      .lte('remind_at', fiveMinutesFromNow.toISOString())
      .gte('remind_at', now.toISOString())
      .eq('email_sent', false)
    
    if (error) throw error
    
    const results = []
    
    // Send emails for each reminder
    for (const reminder of dueReminders || []) {
      // For global reminders, get all user emails
      let recipients = []
      
      if (reminder.is_global) {
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('email')
        recipients = allProfiles?.map(p => p.email) || []
      } else {
        recipients = [reminder.profiles.email]
      }
      
      // Send email via Resend
      for (const email of recipients) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Dopadaily <reminders@yourdomain.com>',
            to: [email],
            subject: `Reminder: ${reminder.title}`,
            html: `
              <h2>${reminder.title}</h2>
              ${reminder.message ? `<p>${reminder.message}</p>` : ''}
              <p>This reminder was scheduled for ${new Date(reminder.remind_at).toLocaleString()}</p>
              <p><a href="https://yourapp.com/reminders">Manage your reminders</a></p>
            `,
          }),
        })
        
        results.push({ email, status: response.status })
      }
      
      // Mark reminder as sent
      await supabase
        .from('reminders')
        .update({ email_sent: true })
        .eq('id', reminder.id)
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: dueReminders?.length || 0,
        results 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

## Step 3: Update Database Schema

Add email tracking to reminders table:

```sql
-- Add email_sent column
ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_reminders_due_not_sent 
ON reminders(remind_at, email_sent) 
WHERE email_sent = false;
```

## Step 4: Set Environment Variables

In Supabase Dashboard → Settings → Edge Functions:

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

## Step 5: Deploy the Edge Function

```bash
# Deploy
supabase functions deploy send-reminder-emails

# Set secrets
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
```

## Step 6: Set Up Cron Job

Create a cron job to run every 5 minutes:

```sql
-- In Supabase SQL Editor
SELECT cron.schedule(
  'send-reminder-emails',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminder-emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );
  $$
);
```

## Step 7: Add Email Preferences to Settings

Update `app/settings/SettingsClient.tsx`:

```typescript
// Add to preferences form
<div>
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      name="email_reminders"
      defaultChecked={emailReminders}
      className="rounded text-primary"
    />
    <div>
      <span className="text-sm font-semibold text-on-surface">Email Reminders</span>
      <p className="text-xs text-on-surface-secondary">
        Receive reminder notifications via email
      </p>
    </div>
  </label>
</div>
```

Update database schema:

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_reminders BOOLEAN DEFAULT true;
```

## Step 8: Test

1. Create a reminder for 5 minutes from now
2. Wait 5 minutes
3. Check your email
4. Verify reminder is marked as sent in database

## Email Template Customization

Improve the email HTML in the Edge Function:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #b89c86; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #b89c86; color: white; padding: 12px 24px; 
             text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Reminder from Dopadaily</h1>
    </div>
    <div class="content">
      <h2>${reminder.title}</h2>
      ${reminder.message ? `<p>${reminder.message}</p>` : ''}
      <p><strong>Scheduled for:</strong> ${new Date(reminder.remind_at).toLocaleString()}</p>
      <a href="https://yourapp.com/reminders" class="button">
        View All Reminders
      </a>
    </div>
    <div class="footer">
      <p>You're receiving this because you created a reminder in Dopadaily</p>
      <p><a href="https://yourapp.com/settings">Manage notification preferences</a></p>
    </div>
  </div>
</body>
</html>
```

## Costs

**Resend Pricing:**
- Free: 100 emails/day, 3,000/month
- Pro: $20/month for 50,000 emails
- Scale: Custom pricing

**Supabase Edge Functions:**
- Free: 500K function invocations/month
- Pro: 2M function invocations/month

## Monitoring

Check email delivery in Resend Dashboard:
1. Go to Resend Dashboard → Emails
2. See delivery status, opens, clicks
3. Monitor bounce rates

Check Edge Function logs:
```bash
supabase functions logs send-reminder-emails
```

## Troubleshooting

### Emails not sending
1. Check Resend API key is correct
2. Verify domain is verified in Resend
3. Check Edge Function logs for errors
4. Ensure cron job is running

### Emails going to spam
1. Verify domain in Resend
2. Set up SPF, DKIM, DMARC records
3. Use your own domain (not onboarding@resend.dev)
4. Avoid spam trigger words in subject/content

### Duplicate emails
1. Check cron job isn't running too frequently
2. Ensure `email_sent` flag is being set
3. Add debouncing logic in Edge Function

## Next Steps

1. Set up domain in Resend
2. Customize email templates
3. Add unsubscribe link
4. Implement email preferences in settings
5. Add email delivery tracking
6. Set up monitoring alerts

## Resources

- Resend Docs: https://resend.com/docs
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase Cron: https://supabase.com/docs/guides/database/extensions/pg_cron

