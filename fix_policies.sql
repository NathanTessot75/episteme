-- Remove the conflicting public policies
DROP POLICY IF EXISTS "Storage Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Storage Public Upload" ON storage.objects;

-- verification check (optional, just to see what's left)
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
