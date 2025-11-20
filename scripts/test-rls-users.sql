-- First, check if RLS is blocking the query
-- Temporarily disable RLS on users table to test
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Now try to select the user
SELECT id, email, name, role, is_active 
FROM users 
WHERE email = 'baraa.elmallah@gmail.com';

-- If the above returns nothing, the user doesn't exist
-- If it returns a user, then RLS was the problem

-- To re-enable RLS after testing:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
