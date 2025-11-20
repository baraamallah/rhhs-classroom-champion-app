-- 02_policies.sql
-- Disables RLS to allow full access (as requested)

-- 1. Disable RLS on junction tables
-- This ensures no permission errors will occur
ALTER TABLE checklist_item_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_supervisors DISABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies just in case RLS is re-enabled later
DROP POLICY IF EXISTS "Allow authenticated read" ON checklist_item_assignments;
DROP POLICY IF EXISTS "Allow admin insert" ON checklist_item_assignments;
DROP POLICY IF EXISTS "Allow admin delete" ON checklist_item_assignments;
DROP POLICY IF EXISTS "Allow all for authenticated" ON checklist_item_assignments;
DROP POLICY IF EXISTS "Allow authenticated manage" ON checklist_item_assignments;
DROP POLICY IF EXISTS "Allow read access for all users" ON checklist_item_assignments;
DROP POLICY IF EXISTS "Allow write access for admins" ON checklist_item_assignments;

DROP POLICY IF EXISTS "Allow authenticated read" ON classroom_supervisors;
DROP POLICY IF EXISTS "Allow admin insert" ON classroom_supervisors;
DROP POLICY IF EXISTS "Allow admin delete" ON classroom_supervisors;
DROP POLICY IF EXISTS "Allow all for authenticated" ON classroom_supervisors;
DROP POLICY IF EXISTS "Allow authenticated manage" ON classroom_supervisors;
DROP POLICY IF EXISTS "Allow read access for all users" ON classroom_supervisors;
DROP POLICY IF EXISTS "Allow write access for admins" ON classroom_supervisors;
