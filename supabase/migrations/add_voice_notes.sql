-- =====================================================
-- VOICE NOTES FEATURE
-- Migration: Add voice recording capability to notes
-- Created: 2025-01-14
-- =====================================================

-- =====================================================
-- 1. ALTER NOTES TABLE - Add Audio Fields
-- =====================================================

ALTER TABLE "public"."notes"
ADD COLUMN IF NOT EXISTS "audio_url" text,
ADD COLUMN IF NOT EXISTS "audio_duration" integer, -- in seconds
ADD COLUMN IF NOT EXISTS "audio_size" bigint, -- in bytes
ADD COLUMN IF NOT EXISTS "audio_format" text; -- webm, mp4, wav

COMMENT ON COLUMN "public"."notes"."audio_url" IS 'URL to audio file in Supabase Storage';
COMMENT ON COLUMN "public"."notes"."audio_duration" IS 'Duration of audio recording in seconds';
COMMENT ON COLUMN "public"."notes"."audio_size" IS 'Size of audio file in bytes';
COMMENT ON COLUMN "public"."notes"."audio_format" IS 'Audio file format (webm, mp4, wav)';

-- Add check constraint for audio duration (max 15 minutes = 900 seconds for premium)
ALTER TABLE "public"."notes"
ADD CONSTRAINT "notes_audio_duration_check" 
CHECK (audio_duration IS NULL OR (audio_duration > 0 AND audio_duration <= 900));

-- Add check constraint for audio size (max 100MB = 104857600 bytes)
ALTER TABLE "public"."notes"
ADD CONSTRAINT "notes_audio_size_check"
CHECK (audio_size IS NULL OR (audio_size > 0 AND audio_size <= 104857600));

-- Make content nullable since voice-only notes don't need text
ALTER TABLE "public"."notes"
ALTER COLUMN "content" DROP NOT NULL;

-- Add check to ensure either content or audio exists
ALTER TABLE "public"."notes"
ADD CONSTRAINT "notes_content_or_audio_required"
CHECK (
  (content IS NOT NULL AND content <> '') OR 
  (audio_url IS NOT NULL AND audio_url <> '')
);

-- =====================================================
-- 2. CREATE VOICE NOTES USAGE TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS "public"."voice_notes_usage" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "month_year" text NOT NULL, -- format: "2025-01" for January 2025
    "total_recordings" integer DEFAULT 0,
    "total_duration_seconds" integer DEFAULT 0,
    "total_size_bytes" bigint DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT timezone('utc', now()),
    "updated_at" timestamp with time zone DEFAULT timezone('utc', now()),
    UNIQUE(user_id, month_year)
);

COMMENT ON TABLE "public"."voice_notes_usage" IS 'Tracks monthly voice note usage per user for premium limits';

CREATE INDEX "idx_voice_notes_usage_user_month" ON "public"."voice_notes_usage" ("user_id", "month_year");

-- =====================================================
-- 3. CREATE FUNCTIONS FOR USAGE TRACKING
-- =====================================================

-- Function to update usage when voice note is created/updated
CREATE OR REPLACE FUNCTION "public"."update_voice_notes_usage"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_month text;
    old_duration integer;
    old_size bigint;
    new_duration integer;
    new_size bigint;
BEGIN
    -- Get current month in format YYYY-MM
    current_month := to_char(now(), 'YYYY-MM');
    
    -- Handle INSERT
    IF (TG_OP = 'INSERT' AND NEW.audio_url IS NOT NULL) THEN
        new_duration := COALESCE(NEW.audio_duration, 0);
        new_size := COALESCE(NEW.audio_size, 0);
        
        INSERT INTO voice_notes_usage (user_id, month_year, total_recordings, total_duration_seconds, total_size_bytes)
        VALUES (NEW.user_id, current_month, 1, new_duration, new_size)
        ON CONFLICT (user_id, month_year) 
        DO UPDATE SET 
            total_recordings = voice_notes_usage.total_recordings + 1,
            total_duration_seconds = voice_notes_usage.total_duration_seconds + new_duration,
            total_size_bytes = voice_notes_usage.total_size_bytes + new_size,
            updated_at = now();
    END IF;
    
    -- Handle UPDATE
    IF (TG_OP = 'UPDATE') THEN
        old_duration := COALESCE(OLD.audio_duration, 0);
        old_size := COALESCE(OLD.audio_size, 0);
        new_duration := COALESCE(NEW.audio_duration, 0);
        new_size := COALESCE(NEW.audio_size, 0);
        
        -- If audio was added
        IF (OLD.audio_url IS NULL AND NEW.audio_url IS NOT NULL) THEN
            INSERT INTO voice_notes_usage (user_id, month_year, total_recordings, total_duration_seconds, total_size_bytes)
            VALUES (NEW.user_id, current_month, 1, new_duration, new_size)
            ON CONFLICT (user_id, month_year) 
            DO UPDATE SET 
                total_recordings = voice_notes_usage.total_recordings + 1,
                total_duration_seconds = voice_notes_usage.total_duration_seconds + new_duration,
                total_size_bytes = voice_notes_usage.total_size_bytes + new_size,
                updated_at = now();
        
        -- If audio was removed
        ELSIF (OLD.audio_url IS NOT NULL AND NEW.audio_url IS NULL) THEN
            UPDATE voice_notes_usage
            SET 
                total_recordings = GREATEST(total_recordings - 1, 0),
                total_duration_seconds = GREATEST(total_duration_seconds - old_duration, 0),
                total_size_bytes = GREATEST(total_size_bytes - old_size, 0),
                updated_at = now()
            WHERE user_id = NEW.user_id AND month_year = current_month;
        
        -- If audio was replaced/updated
        ELSIF (OLD.audio_url IS NOT NULL AND NEW.audio_url IS NOT NULL AND 
               (OLD.audio_duration != NEW.audio_duration OR OLD.audio_size != NEW.audio_size)) THEN
            UPDATE voice_notes_usage
            SET 
                total_duration_seconds = total_duration_seconds - old_duration + new_duration,
                total_size_bytes = total_size_bytes - old_size + new_size,
                updated_at = now()
            WHERE user_id = NEW.user_id AND month_year = current_month;
        END IF;
    END IF;
    
    -- Handle DELETE
    IF (TG_OP = 'DELETE' AND OLD.audio_url IS NOT NULL) THEN
        old_duration := COALESCE(OLD.audio_duration, 0);
        old_size := COALESCE(OLD.audio_size, 0);
        
        UPDATE voice_notes_usage
        SET 
            total_recordings = GREATEST(total_recordings - 1, 0),
            total_duration_seconds = GREATEST(total_duration_seconds - old_duration, 0),
            total_size_bytes = GREATEST(total_size_bytes - old_size, 0),
            updated_at = now()
        WHERE user_id = OLD.user_id AND month_year = current_month;
        
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for usage tracking
DROP TRIGGER IF EXISTS "trigger_update_voice_notes_usage" ON "public"."notes";
CREATE TRIGGER "trigger_update_voice_notes_usage"
    AFTER INSERT OR UPDATE OR DELETE ON "public"."notes"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_voice_notes_usage"();

-- =====================================================
-- 4. FUNCTION TO CHECK USER LIMITS (Premium Feature)
-- =====================================================

CREATE OR REPLACE FUNCTION "public"."check_voice_note_limit"(
    p_user_id uuid,
    p_duration integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_subscription text;
    current_month text;
    current_usage record;
    max_recordings integer;
    max_duration_minutes integer;
    result jsonb;
BEGIN
    -- Get current month
    current_month := to_char(now(), 'YYYY-MM');
    
    -- Get user's subscription status
    SELECT subscription_plan INTO user_subscription
    FROM profiles
    WHERE id = p_user_id;
    
    -- Set limits based on subscription
    IF user_subscription = 'premium' THEN
        max_recordings := 999999; -- Unlimited
        max_duration_minutes := 999999; -- Unlimited
    ELSE
        max_recordings := 3; -- Free tier: 3 recordings per month
        max_duration_minutes := 15; -- Free tier: 15 minutes total per month
    END IF;
    
    -- Get current usage
    SELECT * INTO current_usage
    FROM voice_notes_usage
    WHERE user_id = p_user_id AND month_year = current_month;
    
    -- If no usage record, create default
    IF current_usage IS NULL THEN
        current_usage.total_recordings := 0;
        current_usage.total_duration_seconds := 0;
    END IF;
    
    -- Check limits
    result := jsonb_build_object(
        'can_record', 
        (current_usage.total_recordings < max_recordings AND 
         (current_usage.total_duration_seconds + p_duration) <= (max_duration_minutes * 60)),
        'is_premium', 
        (user_subscription = 'premium'),
        'current_recordings', 
        current_usage.total_recordings,
        'max_recordings', 
        max_recordings,
        'current_duration_seconds', 
        current_usage.total_duration_seconds,
        'max_duration_seconds', 
        (max_duration_minutes * 60),
        'remaining_recordings', 
        GREATEST(max_recordings - current_usage.total_recordings, 0),
        'remaining_duration_seconds', 
        GREATEST((max_duration_minutes * 60) - current_usage.total_duration_seconds, 0)
    );
    
    RETURN result;
END;
$$;

-- =====================================================
-- 5. ROW LEVEL SECURITY FOR VOICE NOTES USAGE
-- =====================================================

ALTER TABLE "public"."voice_notes_usage" ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own voice notes usage"
    ON "public"."voice_notes_usage"
    FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can view all usage
CREATE POLICY "Admins can view all voice notes usage"
    ON "public"."voice_notes_usage"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON TABLE "public"."voice_notes_usage" TO "anon";
GRANT ALL ON TABLE "public"."voice_notes_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."voice_notes_usage" TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."update_voice_notes_usage"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."update_voice_notes_usage"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."update_voice_notes_usage"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."check_voice_note_limit"(uuid, integer) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."check_voice_note_limit"(uuid, integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."check_voice_note_limit"(uuid, integer) TO "service_role";

-- =====================================================
-- 7. CREATE STORAGE BUCKET (Run in Supabase Dashboard)
-- =====================================================

-- Note: This part needs to be run separately in Supabase Dashboard > Storage
-- or via the Supabase JavaScript client, as it's not pure SQL

/*
-- Create bucket via SQL (if your Supabase version supports it)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'voice-notes',
    'voice-notes',
    false, -- private bucket
    104857600, -- 100MB limit
    ARRAY['audio/webm', 'audio/mp4', 'audio/wav', 'audio/mpeg', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;
*/

-- =====================================================
-- 8. STORAGE RLS POLICIES
-- =====================================================

-- Users can upload their own voice notes
CREATE POLICY "Users can upload own voice notes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'voice-notes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own voice notes
CREATE POLICY "Users can read own voice notes"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'voice-notes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own voice notes
CREATE POLICY "Users can update own voice notes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'voice-notes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own voice notes
CREATE POLICY "Users can delete own voice notes"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'voice-notes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify migration
DO $$
BEGIN
    RAISE NOTICE 'Voice Notes Migration Complete!';
    RAISE NOTICE 'Premium Limits: Free = 3 recordings, 15 min/month | Premium = Unlimited';
    RAISE NOTICE 'Max file size: 100MB';
    RAISE NOTICE 'Max duration: 15 minutes per recording';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Create storage bucket "voice-notes" in Supabase Dashboard';
    RAISE NOTICE '2. Set bucket as private with 100MB file size limit';
    RAISE NOTICE '3. Test usage tracking with check_voice_note_limit() function';
END $$;

