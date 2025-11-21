-- ============================================================================
-- 02_security.sql
-- Security, RLS Policies, and Functions
-- ============================================================================

-- 1. Password Functions

-- Function to hash passwords
CREATE OR REPLACE FUNCTION hash_password(input_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(input_password, gen_salt('bf'));
END;
$$;

-- Function to verify passwords
CREATE OR REPLACE FUNCTION verify_password(input_password text, stored_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN stored_hash = crypt(input_password, stored_hash);
END;
$$;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION hash_password(text) TO authenticated;
GRANT EXECUTE ON FUNCTION hash_password(text) TO anon;
GRANT EXECUTE ON FUNCTION verify_password(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_password(text, text) TO anon;

-- 2. Enable Row Level Security (RLS)

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_item_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_supervisors ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Users Table
DROP POLICY IF EXISTS "Allow read access for all users" ON users;
CREATE POLICY "Allow read access for all users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Classrooms Table
DROP POLICY IF EXISTS "Allow read access for all users" ON classrooms;
CREATE POLICY "Allow read access for all users" ON classrooms
  FOR SELECT USING (auth.role() = 'authenticated');

-- Checklist Items Table
DROP POLICY IF EXISTS "Allow read access for all users" ON checklist_items;
CREATE POLICY "Allow read access for all users" ON checklist_items
  FOR SELECT USING (auth.role() = 'authenticated');

-- Evaluations Table
DROP POLICY IF EXISTS "Allow read access for all users" ON evaluations;
CREATE POLICY "Allow read access for all users" ON evaluations
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON evaluations;
CREATE POLICY "Allow insert for authenticated users" ON evaluations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Junction Tables (Assignments)

-- checklist_item_assignments
DROP POLICY IF EXISTS "Allow authenticated read" ON checklist_item_assignments;
CREATE POLICY "Allow authenticated read" ON checklist_item_assignments
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin insert" ON checklist_item_assignments;
CREATE POLICY "Allow admin insert" ON checklist_item_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Allow admin delete" ON checklist_item_assignments;
CREATE POLICY "Allow admin delete" ON checklist_item_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- classroom_supervisors
DROP POLICY IF EXISTS "Allow authenticated read" ON classroom_supervisors;
CREATE POLICY "Allow authenticated read" ON classroom_supervisors
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin insert" ON classroom_supervisors;
CREATE POLICY "Allow admin insert" ON classroom_supervisors
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Allow admin delete" ON classroom_supervisors;
CREATE POLICY "Allow admin delete" ON classroom_supervisors
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- 4. Archive Tables Policies

-- archive_evaluations
DROP POLICY IF EXISTS "Allow admin insert" ON archive_evaluations;
CREATE POLICY "Allow admin insert" ON archive_evaluations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Allow admin read" ON archive_evaluations;
CREATE POLICY "Allow admin read" ON archive_evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- archive_classrooms
DROP POLICY IF EXISTS "Allow admin insert" ON archive_classrooms;
CREATE POLICY "Allow admin insert" ON archive_classrooms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Allow admin read" ON archive_classrooms;
CREATE POLICY "Allow admin read" ON archive_classrooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- 5. Additional Admin Policies

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

-- Allow admins to manage classrooms
DROP POLICY IF EXISTS "Allow admin delete" ON classrooms;
CREATE POLICY "Allow admin delete" ON classrooms
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Allow admin insert" ON classrooms;
CREATE POLICY "Allow admin insert" ON classrooms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Allow admin update" ON classrooms;
CREATE POLICY "Allow admin update" ON classrooms
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );
