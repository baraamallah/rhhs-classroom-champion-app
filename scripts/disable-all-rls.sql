-- Quick fix: Temporarily disable RLS on checklist_items to test functionality
-- You can re-enable and configure proper policies later

ALTER TABLE checklist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_item_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_supervisors DISABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('checklist_items', 'checklist_item_assignments', 'classrooms', 'classroom_supervisors', 'evaluations')
ORDER BY tablename;
