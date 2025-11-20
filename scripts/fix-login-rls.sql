-- Fix RLS for login to work
-- The server-side login needs to read users without authentication

-- Option 1: Disable RLS on users table (simplest for now)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, use this instead:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- 
-- -- Allow service role (server-side) to read all users
-- DROP POLICY IF EXISTS "Allow service role read users" ON users;
-- CREATE POLICY "Allow service role read users" ON users
--   FOR SELECT USING (true);
-- 
-- -- Allow authenticated users to read users (for supervisor selection)
-- DROP POLICY IF EXISTS "Allow authenticated read users" ON users;
-- CREATE POLICY "Allow authenticated read users" ON users
--   FOR SELECT USING (auth.role() = 'authenticated');

-- Verify RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';
