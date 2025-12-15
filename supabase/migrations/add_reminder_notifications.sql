-- Migration: Add reminder email notifications support
-- This adds fields to track email notifications for reminders
-- Safe migration - uses IF NOT EXISTS / IF EXISTS checks

-- ============================================
-- 1. ADD COLUMNS TO REMINDERS TABLE
-- ============================================

-- Add notification tracking columns (safe - won't fail if already exists)
DO $$
BEGIN
  -- is_notified: Track if notification has been sent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reminders' 
    AND column_name = 'is_notified'
  ) THEN
    ALTER TABLE public.reminders ADD COLUMN is_notified BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added column: reminders.is_notified';
  ELSE
    RAISE NOTICE 'Column reminders.is_notified already exists, skipping';
  END IF;

  -- notified_at: When notification was sent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reminders' 
    AND column_name = 'notified_at'
  ) THEN
    ALTER TABLE public.reminders ADD COLUMN notified_at TIMESTAMPTZ;
    RAISE NOTICE 'Added column: reminders.notified_at';
  ELSE
    RAISE NOTICE 'Column reminders.notified_at already exists, skipping';
  END IF;

  -- email_enabled: Whether to send email for this reminder
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reminders' 
    AND column_name = 'email_enabled'
  ) THEN
    ALTER TABLE public.reminders ADD COLUMN email_enabled BOOLEAN DEFAULT TRUE;
    RAISE NOTICE 'Added column: reminders.email_enabled';
  ELSE
    RAISE NOTICE 'Column reminders.email_enabled already exists, skipping';
  END IF;
END $$;

-- ============================================
-- 2. ADD INDEXES FOR CRON JOB EFFICIENCY
-- ============================================

-- Index for finding unnotified, due reminders
CREATE INDEX IF NOT EXISTS idx_reminders_notification_pending 
ON public.reminders (remind_at, is_notified) 
WHERE is_notified = FALSE;

-- Index for global reminders
CREATE INDEX IF NOT EXISTS idx_reminders_global 
ON public.reminders (is_global, remind_at) 
WHERE is_global = TRUE;

-- ============================================
-- 3. CREATE GLOBAL REMINDER NOTIFICATIONS TABLE
-- ============================================

-- Track which users have been notified for each global reminder
CREATE TABLE IF NOT EXISTS public.global_reminder_notifications (
  id SERIAL PRIMARY KEY,
  reminder_id BIGINT NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notified_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reminder_id, user_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_global_reminder_notifications_lookup 
ON public.global_reminder_notifications (reminder_id, user_id);

CREATE INDEX IF NOT EXISTS idx_global_reminder_notifications_reminder 
ON public.global_reminder_notifications (reminder_id);

-- Enable RLS
ALTER TABLE public.global_reminder_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own notification records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'global_reminder_notifications' 
    AND policyname = 'Users can view own notification records'
  ) THEN
    CREATE POLICY "Users can view own notification records"
    ON public.global_reminder_notifications
    FOR SELECT
    USING (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can view own notification records';
  END IF;
END $$;

-- ============================================
-- 4. ADD EMAIL NOTIFICATIONS PREFERENCE TO PROFILES
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'email_notifications'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email_notifications BOOLEAN DEFAULT TRUE;
    RAISE NOTICE 'Added column: profiles.email_notifications';
  ELSE
    RAISE NOTICE 'Column profiles.email_notifications already exists, skipping';
  END IF;
END $$;

-- ============================================
-- 5. CREATE HELPER FUNCTION FOR GLOBAL REMINDERS
-- ============================================

-- Function to get users eligible for global reminder notification
CREATE OR REPLACE FUNCTION public.get_users_for_global_reminder(p_reminder_id BIGINT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  username TEXT,
  is_premium BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.email,
    p.username,
    COALESCE(p.subscription_status = 'active', FALSE) as is_premium
  FROM public.profiles p
  WHERE 
    p.is_banned = FALSE
    AND p.email IS NOT NULL
    AND COALESCE(p.email_notifications, TRUE) = TRUE
    AND NOT EXISTS (
      -- Exclude users already notified for this reminder
      SELECT 1 FROM public.global_reminder_notifications grn 
      WHERE grn.reminder_id = p_reminder_id AND grn.user_id = p.id
    );
END;
$$;

-- Grant execute permission to service_role (for cron job)
GRANT EXECUTE ON FUNCTION public.get_users_for_global_reminder(BIGINT) TO service_role;

-- ============================================
-- 6. GRANT PERMISSIONS ON NEW TABLE
-- ============================================

GRANT ALL ON TABLE public.global_reminder_notifications TO service_role;
GRANT SELECT ON TABLE public.global_reminder_notifications TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.global_reminder_notifications_id_seq TO service_role;

-- ============================================
-- 7. CLEANUP FUNCTION FOR OLD NOTIFICATION RECORDS
-- ============================================

-- Function to clean up old notification records (older than 30 days)
-- Can be called manually or via a separate cron job if needed
CREATE OR REPLACE FUNCTION public.cleanup_old_reminder_notifications(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.global_reminder_notifications
  WHERE notified_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_old_reminder_notifications(INTEGER) TO service_role;

-- ============================================
-- 8. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN public.reminders.is_notified IS 'Whether email notification has been sent for this reminder';
COMMENT ON COLUMN public.reminders.notified_at IS 'Timestamp when email notification was sent';
COMMENT ON COLUMN public.reminders.email_enabled IS 'Whether to send email notification for this reminder (user can toggle)';
COMMENT ON COLUMN public.profiles.email_notifications IS 'User preference for receiving email notifications (global setting)';
COMMENT ON TABLE public.global_reminder_notifications IS 'Tracks which users have been notified for global reminders to prevent duplicates';

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  -- Count new columns in reminders
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'reminders' 
  AND column_name IN ('is_notified', 'notified_at', 'email_enabled');
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Reminders notification columns: %/3', col_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  - reminders: is_notified, notified_at, email_enabled columns';
  RAISE NOTICE '  - reminders: 2 new indexes for cron job';
  RAISE NOTICE '  - profiles: email_notifications column';
  RAISE NOTICE '  - global_reminder_notifications: new table';
  RAISE NOTICE '  - get_users_for_global_reminder(): helper function';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Add CRON_SECRET to Vercel environment variables';
  RAISE NOTICE '  2. Add SUPABASE_SERVICE_ROLE_KEY to Vercel environment variables';
  RAISE NOTICE '  3. Deploy to Vercel (cron job auto-configures from vercel.json)';
  RAISE NOTICE '============================================';
END $$;
