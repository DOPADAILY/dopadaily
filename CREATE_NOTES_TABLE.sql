-- =============================================
-- NOTES TABLE FOR CALM FOCUS APP
-- Run this in Supabase SQL Editor
-- =============================================
-- PRIVACY: Notes are completely PRIVATE to each user.
-- No admin or other user can view another user's notes.
-- =============================================

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'focus', 'ideas', 'reflections', 'goals')),
  is_pinned BOOLEAN DEFAULT false,
  focus_session_id BIGINT REFERENCES focus_sessions(id) ON DELETE SET NULL,
  color TEXT DEFAULT 'default' CHECK (color IN ('default', 'blue', 'green', 'yellow', 'purple', 'pink')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned);
CREATE INDEX IF NOT EXISTS idx_notes_focus_session_id ON notes(focus_session_id);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES (Notes are PRIVATE - only owner can access)
-- =============================================

-- Policy: Users can view their own notes ONLY
CREATE POLICY "Users can view own notes"
  ON notes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own notes
CREATE POLICY "Users can create own notes"
  ON notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own notes ONLY
CREATE POLICY "Users can update own notes"
  ON notes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own notes ONLY
CREATE POLICY "Users can delete own notes"
  ON notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- NOTE: No admin access policy - notes are completely private!

-- If you previously ran this script with admin policy, drop it:
DROP POLICY IF EXISTS "Admins can view all notes" ON notes;

-- =============================================
-- TRIGGER FOR UPDATED_AT
-- =============================================

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_notes_updated_at ON notes;
CREATE TRIGGER trigger_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_notes_updated_at();

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON notes TO authenticated;

-- =============================================
-- VERIFICATION QUERIES (Optional - run to verify)
-- =============================================

-- Check table exists
-- SELECT * FROM notes LIMIT 1;

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'notes';

-- Check policies exist
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'notes';

