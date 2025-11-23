-- Create ambient_sounds table for storing calming sounds/frequencies

CREATE TABLE IF NOT EXISTS ambient_sounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT, -- in bytes
  duration INTEGER, -- in seconds
  category TEXT NOT NULL DEFAULT 'nature', -- nature, white_noise, binaural, lofi, etc.
  is_active BOOLEAN DEFAULT true,
  play_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ambient_sounds_category ON ambient_sounds(category);
CREATE INDEX IF NOT EXISTS idx_ambient_sounds_is_active ON ambient_sounds(is_active);
CREATE INDEX IF NOT EXISTS idx_ambient_sounds_created_at ON ambient_sounds(created_at DESC);

-- Enable RLS
ALTER TABLE ambient_sounds ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone (authenticated) can view active sounds
CREATE POLICY "Anyone can view active sounds"
  ON ambient_sounds
  FOR SELECT
  USING (is_active = true OR auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- Policy: Only admins can insert sounds
CREATE POLICY "Admins can insert sounds"
  ON ambient_sounds
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Policy: Only admins can update sounds
CREATE POLICY "Admins can update sounds"
  ON ambient_sounds
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Policy: Only admins can delete sounds
CREATE POLICY "Admins can delete sounds"
  ON ambient_sounds
  FOR DELETE
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_ambient_sounds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ambient_sounds_updated_at_trigger
  BEFORE UPDATE ON ambient_sounds
  FOR EACH ROW
  EXECUTE FUNCTION update_ambient_sounds_updated_at();

-- Add comment for documentation
COMMENT ON TABLE ambient_sounds IS 'Stores ambient sounds/calming frequencies uploaded by admins for user focus sessions';

-- Verify the table was created
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ambient_sounds'
ORDER BY ordinal_position;


