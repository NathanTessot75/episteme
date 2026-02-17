-- 1. Drop the verification requests table (cascades policies and triggers)
DROP TABLE IF EXISTS verification_requests CASCADE;

-- 2. Drop the admin flag from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;

-- 3. Drop the functions
DROP FUNCTION IF EXISTS public.handle_verification_request;
