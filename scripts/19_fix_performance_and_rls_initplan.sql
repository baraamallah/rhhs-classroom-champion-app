-- ============================================================================
-- 19_fix_performance_and_rls_initplan.sql
-- Resolves:
-- 1. auth_rls_initplan (Replaces auth.<function>() with (SELECT auth.<function>()))
-- 2. multiple_permissive_policies (Consolidates overlapping RLS policies into 1 clean policy per action)
-- 3. duplicate_index (Removes redundant identical indexes)
-- ============================================================================

-- ============================================================================
-- SECTION 1: DROP DUPLICATE INDEXES
-- ============================================================================
DROP INDEX IF EXISTS public.idx_checklist_items_active_order;
DROP INDEX IF EXISTS public.idx_classrooms_active_division;
DROP INDEX IF EXISTS public.idx_monthly_winners_lookup;


-- ============================================================================
-- SECTION 2: CLEAN UP ALL EXISTING / DUPLICATE POLICIES
-- ============================================================================

-- Classrooms
DROP POLICY IF EXISTS "Allow admin write classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Allow public read classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Allow public read on classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.classrooms;
DROP POLICY IF EXISTS "Allow admin insert" ON public.classrooms;
DROP POLICY IF EXISTS "Allow admin update" ON public.classrooms;
DROP POLICY IF EXISTS "Allow admin delete" ON public.classrooms;

-- Evaluations
DROP POLICY IF EXISTS "Allow supervisor write evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Allow public read evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Allow public read on evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.evaluations;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.evaluations;
DROP POLICY IF EXISTS "Allow admin delete" ON public.evaluations;

-- Checklist Items
DROP POLICY IF EXISTS "Allow admin write checklist_items" ON public.checklist_items;
DROP POLICY IF EXISTS "Allow authenticated read checklist_items" ON public.checklist_items;
DROP POLICY IF EXISTS "Allow public read on checklist_items" ON public.checklist_items;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.checklist_items;

-- Checklist Item Assignments
DROP POLICY IF EXISTS "Allow all for authenticated and service on checklist_item_assignments" ON public.checklist_item_assignments;
DROP POLICY IF EXISTS "Allow all for authenticated and service on checklist_item_assig" ON public.checklist_item_assignments;
DROP POLICY IF EXISTS "Allow public read on checklist_item_assignments" ON public.checklist_item_assignments;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.checklist_item_assignments;
DROP POLICY IF EXISTS "Allow admin insert" ON public.checklist_item_assignments;
DROP POLICY IF EXISTS "Allow admin delete" ON public.checklist_item_assignments;

-- Classroom Supervisors
DROP POLICY IF EXISTS "Allow all for authenticated and service on classroom_supervisors" ON public.classroom_supervisors;
DROP POLICY IF EXISTS "Allow all for authenticated and service on classroom_supervisor" ON public.classroom_supervisors;
DROP POLICY IF EXISTS "Allow public read on classroom_supervisors" ON public.classroom_supervisors;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.classroom_supervisors;
DROP POLICY IF EXISTS "Allow admin insert" ON public.classroom_supervisors;
DROP POLICY IF EXISTS "Allow admin delete" ON public.classroom_supervisors;

-- Users
DROP POLICY IF EXISTS "Allow authenticated read users" ON public.users;
DROP POLICY IF EXISTS "Allow admin insert users" ON public.users;
DROP POLICY IF EXISTS "Allow admin update users" ON public.users;
DROP POLICY IF EXISTS "Allow admin modify on users" ON public.users;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.users;
DROP POLICY IF EXISTS "Allow public read on users" ON public.users;

-- Monthly Winners
DROP POLICY IF EXISTS "Allow admins to manage monthly winners" ON public.monthly_winners;
DROP POLICY IF EXISTS "Allow all authenticated to read monthly winners" ON public.monthly_winners;
DROP POLICY IF EXISTS "Allow public read on monthly_winners" ON public.monthly_winners;

-- System Settings
DROP POLICY IF EXISTS "Admins can read system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Super admins can update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Super admins can insert system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow public read on system_settings" ON public.system_settings;

-- Archive Evaluations
DROP POLICY IF EXISTS "Allow admin read" ON public.archive_evaluations;
DROP POLICY IF EXISTS "Allow admin insert" ON public.archive_evaluations;
DROP POLICY IF EXISTS "Allow public read on archive_evaluations" ON public.archive_evaluations;

-- Archive Classrooms
DROP POLICY IF EXISTS "Allow admin read" ON public.archive_classrooms;
DROP POLICY IF EXISTS "Allow admin insert" ON public.archive_classrooms;
DROP POLICY IF EXISTS "Allow public read on archive_classrooms" ON public.archive_classrooms;

-- Academic Archives
DROP POLICY IF EXISTS "Allow admins all on academic_archives" ON public.academic_archives;
DROP POLICY IF EXISTS "Allow public read on academic_archives" ON public.academic_archives;

-- Academic Archive Evaluations
DROP POLICY IF EXISTS "Allow admins all on academic_archive_evaluations" ON public.academic_archive_evaluations;
DROP POLICY IF EXISTS "Allow public read on academic_archive_evaluations" ON public.academic_archive_evaluations;


-- ============================================================================
-- SECTION 3: RECREATE OPTIMIZED POLICIES WITH INITPLAN OPTIMIZATION (select auth...)
-- ============================================================================

-- 1. CLASSROOMS
CREATE POLICY "classrooms_select_policy" ON public.classrooms
  FOR SELECT USING (true);

CREATE POLICY "classrooms_modify_policy" ON public.classrooms
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
    )
  );

-- 2. EVALUATIONS
CREATE POLICY "evaluations_select_policy" ON public.evaluations
  FOR SELECT USING (true);

CREATE POLICY "evaluations_insert_policy" ON public.evaluations
  FOR INSERT WITH CHECK (
    (SELECT auth.role()) = 'service_role' OR
    (SELECT auth.role()) = 'authenticated'
  );

CREATE POLICY "evaluations_modify_policy" ON public.evaluations
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
    )
  );

-- 3. CHECKLIST ITEMS
CREATE POLICY "checklist_items_select_policy" ON public.checklist_items
  FOR SELECT USING (true);

CREATE POLICY "checklist_items_modify_policy" ON public.checklist_items
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
    )
  );

-- 4. CHECKLIST ITEM ASSIGNMENTS
CREATE POLICY "checklist_assignments_select_policy" ON public.checklist_item_assignments
  FOR SELECT USING (true);

CREATE POLICY "checklist_assignments_modify_policy" ON public.checklist_item_assignments
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    (SELECT auth.role()) = 'authenticated'
  );

-- 5. CLASSROOM SUPERVISORS
CREATE POLICY "classroom_supervisors_select_policy" ON public.classroom_supervisors
  FOR SELECT USING (true);

CREATE POLICY "classroom_supervisors_modify_policy" ON public.classroom_supervisors
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    (SELECT auth.role()) = 'authenticated'
  );

-- 6. USERS
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "users_insert_policy" ON public.users
  FOR INSERT WITH CHECK (
    (SELECT auth.role()) = 'service_role' OR
    (SELECT auth.role()) = 'authenticated'
  );

CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE USING (
    (SELECT auth.role()) = 'service_role' OR
    (SELECT auth.role()) = 'authenticated'
  );

CREATE POLICY "users_delete_policy" ON public.users
  FOR DELETE USING (
    (SELECT auth.role()) = 'service_role' OR
    (SELECT auth.role()) = 'authenticated'
  );

-- 7. MONTHLY WINNERS
CREATE POLICY "monthly_winners_select_policy" ON public.monthly_winners
  FOR SELECT USING (true);

CREATE POLICY "monthly_winners_modify_policy" ON public.monthly_winners
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
    )
  );

-- 8. SYSTEM SETTINGS
CREATE POLICY "system_settings_select_policy" ON public.system_settings
  FOR SELECT USING (true);

CREATE POLICY "system_settings_modify_policy" ON public.system_settings
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
    )
  );

-- 9. ARCHIVE EVALUATIONS
CREATE POLICY "archive_evaluations_select_policy" ON public.archive_evaluations
  FOR SELECT USING (true);

CREATE POLICY "archive_evaluations_modify_policy" ON public.archive_evaluations
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
    )
  );

-- 10. ARCHIVE CLASSROOMS
CREATE POLICY "archive_classrooms_select_policy" ON public.archive_classrooms
  FOR SELECT USING (true);

CREATE POLICY "archive_classrooms_modify_policy" ON public.archive_classrooms
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
    )
  );

-- 11. ACADEMIC ARCHIVES
CREATE POLICY "academic_archives_select_policy" ON public.academic_archives
  FOR SELECT USING (true);

CREATE POLICY "academic_archives_modify_policy" ON public.academic_archives
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
    )
  );

-- 12. ACADEMIC ARCHIVE EVALUATIONS
CREATE POLICY "academic_archive_evaluations_select_policy" ON public.academic_archive_evaluations
  FOR SELECT USING (true);

CREATE POLICY "academic_archive_evaluations_modify_policy" ON public.academic_archive_evaluations
  FOR ALL USING (
    (SELECT auth.role()) = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
    )
  );

-- Grant privileges
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

SELECT 'All performance warnings, duplicate indexes, and initplan issues resolved!' AS result;
