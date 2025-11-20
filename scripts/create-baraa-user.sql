-- Create user for baraa.elmallah@gmail.com
-- First, enable the pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert the user with a hashed password
-- Replace 'YourPasswordHere' with your desired password
INSERT INTO users (email, password_hash, name, role, is_active)
VALUES (
  'baraa.elmallah@gmail.com',
  crypt('admin123', gen_salt('bf')),  -- Change 'admin123' to your desired password
  'Baraa Elmallah',
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE
SET 
  password_hash = EXCLUDED.password_hash,
  is_active = true,
  role = 'admin';

-- Verify the user was created
SELECT id, email, name, role, is_active, 
       CASE WHEN password_hash IS NOT NULL THEN 'Password set' ELSE 'No password' END as status
FROM users 
WHERE email = 'baraa.elmallah@gmail.com';
