-- Check if user exists and what columns are available
SELECT id, email, name, role, is_active, 
       CASE WHEN password_hash IS NOT NULL THEN 'has password_hash' ELSE 'no password_hash' END as password_status
FROM users 
WHERE email = 'baraa.elmallah@gmail.com';

-- Check for duplicate emails
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Show all users to see what exists
SELECT id, email, name, role, is_active FROM users ORDER BY created_at DESC LIMIT 10;

