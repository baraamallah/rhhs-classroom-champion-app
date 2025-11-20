-- Create a test admin user for login
-- Password: 'admin123' (hashed with bcrypt)

INSERT INTO users (email, password, name, role, is_active)
VALUES (
  'admin@rhhs.edu.lb',
  '$2a$10$rN8eJE7KxT5Kx.vZ9qYqZeHxGxGxGxGxGxGxGxGxGxGxGxGxGxGxG',  -- This is a placeholder, you need to hash 'admin123'
  'Admin User',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- To create a properly hashed password, you can use this Node.js script:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('admin123', 10);
-- console.log(hash);

-- OR use this SQL function if you have pgcrypto extension:
-- UPDATE users SET password = crypt('admin123', gen_salt('bf')) WHERE email = 'admin@rhhs.edu.lb';
