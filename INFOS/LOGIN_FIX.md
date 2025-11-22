## 🔍 Login Issue Diagnosis

**Error:** "Cannot coerce the result to a single JSON object"

**What this means:**
The login query is failing because either:
1. ❌ No user exists with email `baraa.elmallah@gmail.com`
2. ❌ Multiple users exist with the same email (duplicates)
3. ❌ The `password_hash` column doesn't exist or is named differently

**Quick Fix Steps:**

### Step 1: Check if user exists
Run `scripts/check-users.sql` in Supabase SQL Editor to see:
- If your user exists
- What the password column is called (`password` vs `password_hash`)
- If there are duplicate emails

### Step 2: Create/Fix your user

**Option A - If user doesn't exist:**
You need to create a user in the `users` table. Use Supabase Table Editor or run:

```sql
-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert user with hashed password
INSERT INTO users (email, password_hash, name, role, is_active)
VALUES (
  'baraa.elmallah@gmail.com',
  crypt('your_password_here', gen_salt('bf')),
  'Baraa Elmallah',
  'admin',
  true
);
```

**Option B - If column is named `password` instead of `password_hash`:**
The login code expects `password_hash` but your table might use `password`. Either:
1. Rename the column in Supabase, OR
2. Update the login code to use `password`

### Step 3: Test login
After creating/fixing the user, try logging in again with:
- Email: `baraa.elmallah@gmail.com`
- Password: (whatever you set)

**Need help?** Run the diagnostic SQL first and share the results!
