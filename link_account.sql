-- 1. Create Verification Requests Table
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL, -- 'ResearchGate', 'University', etc.
  profile_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Users can CREATE requests
CREATE POLICY "Users can create requests" 
  ON verification_requests FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Users can VIEW their own requests
CREATE POLICY "Users can view own requests" 
  ON verification_requests FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 4. DEMO MAGIC: Auto-approve valid ResearchGate URLs
-- This function automatically sets the user to Premium if they submit a valid-looking URL.
CREATE OR REPLACE FUNCTION public.handle_verification_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple check: if provider is ResearchGate and URL contains 'researchgate.net'
  IF NEW.provider = 'ResearchGate' AND NEW.profile_url ILIKE '%researchgate.net%' THEN
    -- 1. Mark request as approved
    NEW.status := 'approved';
    
    -- 2. Upgrade user profile
    UPDATE public.profiles
    SET is_premium = true
    WHERE id = NEW.user_id;
  END IF;
  return NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function on every new insert
DROP TRIGGER IF EXISTS on_verification_request ON verification_requests;
CREATE TRIGGER on_verification_request
BEFORE INSERT ON verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_verification_request();
