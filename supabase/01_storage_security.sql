-- 1. Update Profiles Table
-- Add specific column for premium status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- 2. Secure Storage Bucket
-- Update the 'pdfs' bucket to be private (public = false)
UPDATE storage.buckets
SET public = false
WHERE id = 'pdfs';

-- 3. Enable RLS on objects (Usually already enabled, skipping to avoid permission errors)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Create Policy for PDF Access
-- Drop existing policies to avoid conflicts (optional but safer)
DROP POLICY IF EXISTS "Premium users can download pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own pdfs" ON storage.objects;

-- Allow users to upload their own files (unchanged)
CREATE POLICY "Users can upload their own pdfs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pdfs' AND auth.uid() = owner);

-- Allow VIEW/DOWNLOAD only if user is premium OR is the owner of the file
CREATE POLICY "Premium users can download pdfs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pdfs' 
  AND (
    auth.uid() = owner -- Users can always see their own files
    OR 
    exists (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND is_premium = true
    )
  )
);
