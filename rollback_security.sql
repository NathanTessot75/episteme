-- 1. Revert Storage Policies
DROP POLICY IF EXISTS "Premium users can download pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own pdfs" ON storage.objects;

-- 2. Make Bucket Public Again
UPDATE storage.buckets
SET public = true
WHERE id = 'pdfs';

-- 3. Remove Premium Column (Optional - data loss warning via comment)
-- WARNING: This will delete the 'is_premium' status for all users.
ALTER TABLE profiles DROP COLUMN IF EXISTS is_premium;

-- 4. Disable RLS on storage.objects (Only if it was disabled before, otherwise keep it safe)
-- generally safer to keep RLS enabled but with a public bucket it doesn't matter for SELECTs if public=true
-- But to fully revert to "wild west" state if that's what it was:
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY; 
-- (Commented out for safety, usually you want RLS enabled)
