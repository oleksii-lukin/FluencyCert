ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Only allow access via service_role / secret key (server-side only)
-- Client-side requests with the publishable key are denied
CREATE POLICY "No client access" ON profiles
  AS PERMISSIVE
  FOR ALL
  USING (false);
