-- ============================================================================
-- 05_fix_archive_permissions.sql
-- Fix permissions for archiving and resetting data
-- ============================================================================

-- 1. Enable RLS on archive tables
ALTER TABLE archive_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_classrooms ENABLE ROW LEVEL SECURITY;

-- 2. Policies for archive_evaluations

-- Allow admins to insert into archive
DROP POLICY IF EXISTS "Allow admin insert" ON archive_evaluations;
CREATE POLICY "Allow admin insert" ON archive_evaluations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Allow admins to read archive
DROP POLICY IF EXISTS "Allow admin read" ON archive_evaluations;
CREATE POLICY "Allow admin read" ON archive_evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- 3. Policies for archive_classrooms

-- Allow admins to insert into archive
DROP POLICY IF EXISTS "Allow admin insert" ON archive_classrooms;
CREATE POLICY "Allow admin insert" ON archive_classrooms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Allow admins to read archive
DROP POLICY IF EXISTS "Allow admin read" ON archive_classrooms;
CREATE POLICY "Allow admin read" ON archive_classrooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- 4. Policies for main tables (evaluations and classrooms) to allow deletion

-- Allow admins to delete evaluations
DROP POLICY IF EXISTS "Allow admin delete" ON evaluations;
CREATE POLICY "Allow admin delete" ON evaluations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Allow admins to delete classrooms
DROP POLICY IF EXISTS "Allow admin delete" ON classrooms;
CREATE POLICY "Allow admin delete" ON classrooms
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- 5. Allow admins to insert classrooms (if not already there)
DROP POLICY IF EXISTS "Allow admin insert" ON classrooms;
CREATE POLICY "Allow admin insert" ON classrooms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- 6. Allow admins to update classrooms
DROP POLICY IF EXISTS "Allow admin update" ON classrooms;
CREATE POLICY "Allow admin update" ON classrooms
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

SELECT 'Permissions fixed for archiving and resetting' as status;
