-- 1. Check Bucket Privacy (CRITICAL)
SELECT id, public FROM storage.buckets WHERE id = 'pdfs';

-- 2. List ALL Policies on storage.objects
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
