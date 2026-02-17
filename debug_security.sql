-- CHECK 1: Is RLS enabled on storage.objects?
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage') 
AND relname = 'objects';

-- CHECK 2: Is the bucket private?
SELECT id, public 
FROM storage.buckets 
WHERE id = 'pdfs';

-- CHECK 3: Do you have a premium profile? (Replace 'your-user-id' with auth.uid() if running in context, but here we just list generic info or count premiums)
SELECT count(*) as premium_user_count FROM profiles WHERE is_premium = true;
