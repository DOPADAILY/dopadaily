# Supabase Storage Setup for Ambient Sounds

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name**: `ambient-sounds`
   - **Public bucket**: ✅ Yes (so users can play sounds without auth headers)
   - **File size limit**: 50 MB (adjust as needed)
   - **Allowed MIME types**: 
     - `audio/mpeg` (MP3)
     - `audio/wav` (WAV)
     - `audio/ogg` (OGG)
     - `audio/webm` (WebM)
     - `audio/aac` (AAC)

## Step 2: Set Up Storage Policies

Navigate to **Storage** → **Policies** → `ambient-sounds` bucket and create these policies:

### Policy 1: Public Read Access
```sql
-- Anyone can view/download sounds
CREATE POLICY "Public can download sounds"
ON storage.objects FOR SELECT
USING (bucket_id = 'ambient-sounds');
```

### Policy 2: Admin Upload Access
```sql
-- Only admins can upload sounds
CREATE POLICY "Admins can upload sounds"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ambient-sounds' 
  AND auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
```

### Policy 3: Admin Update Access
```sql
-- Only admins can update sounds
CREATE POLICY "Admins can update sounds"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'ambient-sounds'
  AND auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
```

### Policy 4: Admin Delete Access
```sql
-- Only admins can delete sounds
CREATE POLICY "Admins can delete sounds"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ambient-sounds'
  AND auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
```

## Step 3: Verify Setup

After running the SQL scripts and setting up storage:

1. Run `CREATE_AMBIENT_SOUNDS_TABLE.sql` in SQL Editor
2. Verify the bucket exists in Storage
3. Verify policies are active
4. Test uploading a small audio file

## Supported Audio Formats

- **MP3** (.mp3) - Recommended for broad compatibility
- **WAV** (.wav) - High quality, larger file size
- **OGG** (.ogg) - Good compression, web-friendly
- **WebM** (.webm) - Modern, efficient
- **AAC** (.aac) - Good quality-to-size ratio

## File Naming Convention

Files will be uploaded with this pattern:
```
{timestamp}_{sanitized-title}.{extension}
```

Example: `1700000000000_ocean-waves.mp3`

## Notes

- Max file size: 50 MB (configurable)
- Recommended duration: 30 seconds to 10 minutes (for looping)
- Files are automatically made public for streaming
- Metadata stored in `ambient_sounds` table


