# ECO Club - Supabase Deployment Fix Guide

## Problem Summary

Your app shows **401 (Unauthorized)** and **404 (Not Found)** errors on Vercel because:

1. **RLS (Row Level Security)** is blocking data access in Supabase
2. **Environment variable mismatch** between client and server
3. **Vercel Analytics** dependency incompatible with Supabase deployment

## ✅ Fixes Applied

### 1. Fixed Environment Variables
- Changed `lib/supabase-data-server.ts` to use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Now consistent across client and server

### 2. Removed Vercel Analytics
- Removed `@vercel/analytics` from `app/layout.tsx`
- App now platform-agnostic

### 3. Created RLS Bypass Script
- New file: `scripts/fix-supabase-rls.sql`
- Allows anon key to read/write data

## 🚀 Deployment Steps

### Step 1: Set Environment Variables

In your deployment platform (Vercel, Supabase, etc.), set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://dqfpinqjomlgpoyfewzk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZnBpbnFqb21sZ3BveWZld3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMzQxODYsImV4cCI6MjA3NjgxMDE4Nn0.2FH88MXYMBClo8hQ1pIMMcV3c7I7xxMaeFOECp1qaXc
AUTH_SECRET=your-secret-key-here-min-32-chars
```

### Step 2: Run Database Scripts in Supabase

Go to Supabase Dashboard → SQL Editor and run **in this order**:

1. **First**: `scripts/database_supabase_script.sql` (creates tables and admin user)
2. **Second**: `scripts/fix-supabase-rls.sql` (fixes RLS policies)

### Step 3: Remove Vercel Analytics Package (Optional)

```bash
npm uninstall @vercel/analytics
```

Or keep it installed but unused.

### Step 4: Deploy

```bash
npm run build
npm start
```

Or deploy to your platform.

## 🔐 Security Note

**IMPORTANT**: The RLS policies allow anonymous access for development. For production:

1. Implement proper RLS policies based on user sessions
2. Use Supabase Auth instead of custom session cookies
3. Restrict policies to authenticated users only

Example production policy:
```sql
CREATE POLICY "Users can only see active data"
ON users FOR SELECT
TO authenticated
USING (is_active = true);
```

## 🧪 Testing

1. Visit your deployed URL
2. Login with: `admin@school.com` / `AdminPassword123!`
3. Check that data loads (classrooms, evaluations, etc.)
4. Open browser console - should see no 401/404 errors

## ❗ Troubleshooting

### Still getting 401 errors?
- Verify environment variables are set in deployment platform
- Check Supabase dashboard that RLS policies exist
- Run `scripts/fix-supabase-rls.sql` again

### Data not showing?
- Check Supabase Table Editor - do tables have data?
- Run `node scripts/test_final_setup.js` locally to verify
- Check browser Network tab for actual API responses

### Build fails?
- Make sure all env vars are set at build time
- Try `npm run build` locally first
- Check deployment logs for specific errors

## 📝 Next Steps

1. Test all features (login, evaluations, leaderboard)
2. Create test supervisor accounts
3. Secure RLS policies for production
4. Consider migrating to Supabase Auth for better security
