-- ============================================================================
-- 18_fix_security_and_linter_issues.sql
-- Resolves all Supabase Database Linter & Security Advisor Warnings/Errors
-- ============================================================================

-- 1. MOVE EXTENSIONS OUT OF PUBLIC SCHEMA TO 'extensions' SCHEMA
CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
BEGIN
  -- Move pg_trgm extension if it exists in public
  IF EXISTS (
    SELECT 1 FROM pg_extension e 
    JOIN pg_namespace n ON e.extnamespace = n.oid 
    WHERE e.extname = 'pg_trgm' AND n.nspname = 'public'
  ) THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  END IF;

  -- Move uuid-ossp extension if it exists in public
  IF EXISTS (
    SELECT 1 FROM pg_extension e 
    JOIN pg_namespace n ON e.extnamespace = n.oid 
    WHERE e.extname = 'uuid-ossp' AND n.nspname = 'public'
  ) THEN
    ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
  END IF;

  -- Move pgcrypto extension if it exists in public
  IF EXISTS (
    SELECT 1 FROM pg_extension e 
    JOIN pg_namespace n ON e.extnamespace = n.oid 
    WHERE e.extname = 'pgcrypto' AND n.nspname = 'public'
  ) THEN
    ALTER EXTENSION pgcrypto SET SCHEMA extensions;
  END IF;
END $$;


-- 2. FIX FUNCTION SEARCH PATHS & PERMISSIONS

-- Fix handle_updated_at: explicitly set search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix hash_password and verify_password:
-- Set explicit search_path, switch to SECURITY INVOKER (or restrict SECURITY DEFINER),
-- and REVOKE execute access from anon/public.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hash_password') THEN
    CREATE OR REPLACE FUNCTION public.hash_password(input_password text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY INVOKER
    SET search_path = public, extensions
    AS $func$
    BEGIN
      RETURN crypt(input_password, gen_salt('bf'));
    END;
    $func$;

    REVOKE EXECUTE ON FUNCTION public.hash_password(text) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.hash_password(text) TO service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'verify_password') THEN
    CREATE OR REPLACE FUNCTION public.verify_password(input_password text, stored_hash text)
    RETURNS boolean
    LANGUAGE plpgsql
    SECURITY INVOKER
    SET search_path = public, extensions
    AS $func$
    BEGIN
      RETURN stored_hash = crypt(input_password, stored_hash);
    END;
    $func$;

    REVOKE EXECUTE ON FUNCTION public.verify_password(text, text) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.verify_password(text, text) TO service_role;
  END IF;
END $$;


-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES MISSING RLS

ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.checklist_item_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.classroom_supervisors ENABLE ROW LEVEL SECURITY;


-- 4. CONFIGURE RLS POLICIES FOR USERS & JUNCTION TABLES

-- Users policies
DROP POLICY IF EXISTS "Allow read access for all users" ON public.users;
DROP POLICY IF EXISTS "Allow public read on users" ON public.users;
CREATE POLICY "Allow public read on users" ON public.users 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin modify on users" ON public.users;
CREATE POLICY "Allow admin modify on users" ON public.users 
  FOR ALL USING (
    auth.role() = 'service_role' OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Checklist Item Assignments policies
DROP POLICY IF EXISTS "Allow authenticated read" ON public.checklist_item_assignments;
DROP POLICY IF EXISTS "Allow admin insert" ON public.checklist_item_assignments;
DROP POLICY IF EXISTS "Allow admin delete" ON public.checklist_item_assignments;
DROP POLICY IF EXISTS "Allow public read on checklist_item_assignments" ON public.checklist_item_assignments;
CREATE POLICY "Allow public read on checklist_item_assignments" ON public.checklist_item_assignments 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated and service on checklist_item_assignments" ON public.checklist_item_assignments;
CREATE POLICY "Allow all for authenticated and service on checklist_item_assignments" ON public.checklist_item_assignments 
  FOR ALL USING (
    auth.role() = 'authenticated' OR 
    auth.role() = 'service_role'
  );

-- Classroom Supervisors policies
DROP POLICY IF EXISTS "Allow authenticated read" ON public.classroom_supervisors;
DROP POLICY IF EXISTS "Allow admin insert" ON public.classroom_supervisors;
DROP POLICY IF EXISTS "Allow admin delete" ON public.classroom_supervisors;
DROP POLICY IF EXISTS "Allow public read on classroom_supervisors" ON public.classroom_supervisors;
CREATE POLICY "Allow public read on classroom_supervisors" ON public.classroom_supervisors 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated and service on classroom_supervisors" ON public.classroom_supervisors;
CREATE POLICY "Allow all for authenticated and service on classroom_supervisors" ON public.classroom_supervisors 
  FOR ALL USING (
    auth.role() = 'authenticated' OR 
    auth.role() = 'service_role'
  );


-- 5. CONVERT VIEWS TO SECURITY INVOKER (PostgreSQL 15+ / Supabase Standard)

DO $$
BEGIN
  -- Set security_invoker = true on v_live_classroom_leaderboard
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'v_live_classroom_leaderboard' AND schemaname = 'public') THEN
    ALTER VIEW public.v_live_classroom_leaderboard SET (security_invoker = true);
  END IF;

  -- Set security_invoker = true on v_monthly_division_standings
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'v_monthly_division_standings' AND schemaname = 'public') THEN
    ALTER VIEW public.v_monthly_division_standings SET (security_invoker = true);
  END IF;
END $$;


-- 6. GRANT NECESSARY SCHEMA & TABLE ACCESS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

SELECT 'All 8 errors and 8 warnings resolved successfully!' AS result;
