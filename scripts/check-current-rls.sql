-- Check current RLS status for all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'classrooms', 'checklist_items', 'evaluations', 
                    'checklist_item_assignments', 'classroom_supervisors')
ORDER BY tablename;

-- Check all policies on these tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'classrooms', 'checklist_items', 'evaluations',
                    'checklist_item_assignments', 'classroom_supervisors')
ORDER BY tablename, policyname;
