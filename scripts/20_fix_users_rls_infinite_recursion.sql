-- ============================================================================
-- 20_fix_users_rls_infinite_recursion.sql
-- Fixes PostgreSQL Error 42P17: "infinite recursion detected in policy for relation 'users'"
-- ============================================================================

-- 1. Create a SECURITY DEFINER helper function to check admin role safely.
-- Because this function is SECURITY DEFINER, queries inside it bypass RLS,
-- preventing infinite recursion when policies query the users table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;


-- 2. FIX USERS TABLE POLICIES (Eliminates recursion 42P17)
DROP POLICY IF EXISTS "users_modify_policy" ON public.users;
DROP POLICY IF EXISTS "Allow admin modify on users" ON public.users;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "Allow public read on users" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;

-- Public read for users
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT USING (true);

-- Insert/Update/Delete restricted to admin/super_admin or service_role
CREATE POLICY "users_insert_policy" ON public.users
  FOR INSERT WITH CHECK (
    (SELECT auth.role()) = 'service_role' OR
    public.is_admin()
  );

CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE USING (
    (SELECT auth.role()) = 'service_role' OR
    public.is_admin()
  );

CREATE POLICY "users_delete_policy" ON public.users
  FOR DELETE USING (
    (SELECT auth.role()) = 'service_role' OR
    public.is_admin()
  );


-- 3. UPDATE OTHER TABLE POLICIES TO USE is_admin() (Clean & performant)

-- Classrooms
DROP POLICY IF EXISTS "classrooms_modify_policy" ON public.classrooms;
CREATE POLICY "classrooms_modify_policy" ON public.classrooms
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    public.is_admin()
  );

-- Checklist Items
DROP POLICY IF EXISTS "checklist_items_modify_policy" ON public.checklist_items;
CREATE POLICY "checklist_items_modify_policy" ON public.checklist_items
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    public.is_admin()
  );

-- Evaluations
DROP POLICY IF EXISTS "evaluations_modify_policy" ON public.evaluations;
CREATE POLICY "evaluations_modify_policy" ON public.evaluations
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    public.is_admin()
  );

-- Monthly Winners
DROP POLICY IF EXISTS "monthly_winners_modify_policy" ON public.monthly_winners;
CREATE POLICY "monthly_winners_modify_policy" ON public.monthly_winners
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    public.is_admin()
  );

-- System Settings
DROP POLICY IF EXISTS "system_settings_modify_policy" ON public.system_settings;
CREATE POLICY "system_settings_modify_policy" ON public.system_settings
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    public.is_admin()
  );

-- Archive Evaluations
DROP POLICY IF EXISTS "archive_evaluations_modify_policy" ON public.archive_evaluations;
CREATE POLICY "archive_evaluations_modify_policy" ON public.archive_evaluations
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    public.is_admin()
  );

-- Archive Classrooms
DROP POLICY IF EXISTS "archive_classrooms_modify_policy" ON public.archive_classrooms;
CREATE POLICY "archive_classrooms_modify_policy" ON public.archive_classrooms
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    public.is_admin()
  );

-- Academic Archives
DROP POLICY IF EXISTS "academic_archives_modify_policy" ON public.academic_archives;
CREATE POLICY "academic_archives_modify_policy" ON public.academic_archives
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    public.is_admin()
  );

-- Academic Archive Evaluations
DROP POLICY IF EXISTS "academic_archive_evaluations_modify_policy" ON public.academic_archive_evaluations;
CREATE POLICY "academic_archive_evaluations_modify_policy" ON public.academic_archive_evaluations
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    public.is_admin()
  );

SELECT 'Infinite recursion in users RLS successfully fixed!' AS result;
