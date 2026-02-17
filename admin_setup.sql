-- 1. Disable the Demo Trigger
DROP TRIGGER IF EXISTS on_verification_request ON verification_requests;
DROP FUNCTION IF EXISTS public.handle_verification_request;

-- 2. Add Admin Flag to Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 3. Policy: Allow Admins to View/Update ALL Requests
-- First, drop the "view own" policy to replace/augment it? 
-- Actually, we can keep "view own" and add "admin view all".
CREATE POLICY "Admins can view all requests"
  ON verification_requests FOR SELECT
  TO authenticated
  USING (
    exists (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update requests"
  ON verification_requests FOR UPDATE
  TO authenticated
  USING (
    exists (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 4. Set YOU as Admin (Optional Check)
-- Since we don't know your ID here, you'll have to run:
-- UPDATE profiles SET is_admin = true WHERE id = 'YOUR_USER_ID';
-- Or we can try to guess/set the first user? No, safer to ask you.
