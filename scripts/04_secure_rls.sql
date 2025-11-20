-- 1. Add division to classrooms
ALTER TABLE classrooms 
ADD COLUMN IF NOT EXISTS division TEXT;

ALTER TABLE classrooms 
DROP CONSTRAINT IF EXISTS valid_division;

ALTER TABLE classrooms 
ADD CONSTRAINT valid_division CHECK (division IN ('High School', 'Intermediate', 'Kindergarten', 'Preschool'));

COMMENT ON COLUMN classrooms.division IS 'The school division the classroom belongs to (High School, Intermediate, Kindergarten, Preschool)';

-- 2. Fix RLS on users table
-- Ensure authenticated users can read all users (needed for supervisor selection)
DROP POLICY IF EXISTS "Allow read access for all users" ON users;
CREATE POLICY "Allow read access for all users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Secure Junction Tables
ALTER TABLE checklist_item_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_supervisors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated read" ON checklist_item_assignments;
DROP POLICY IF EXISTS "Allow admin insert" ON checklist_item_assignments;
DROP POLICY IF EXISTS "Allow admin delete" ON checklist_item_assignments;
DROP POLICY IF EXISTS "Allow all for authenticated" ON checklist_item_assignments;
DROP POLICY IF EXISTS "Allow authenticated manage" ON checklist_item_assignments;
DROP POLICY IF EXISTS "Allow write access for admins" ON checklist_item_assignments;

DROP POLICY IF EXISTS "Allow authenticated read" ON classroom_supervisors;
DROP POLICY IF EXISTS "Allow admin insert" ON classroom_supervisors;
DROP POLICY IF EXISTS "Allow admin delete" ON classroom_supervisors;
DROP POLICY IF EXISTS "Allow all for authenticated" ON classroom_supervisors;
DROP POLICY IF EXISTS "Allow authenticated manage" ON classroom_supervisors;
DROP POLICY IF EXISTS "Allow write access for admins" ON classroom_supervisors;

-- Create new policies for checklist_item_assignments
CREATE POLICY "Allow authenticated read" ON checklist_item_assignments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin insert" ON checklist_item_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Allow admin delete" ON checklist_item_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create new policies for classroom_supervisors
CREATE POLICY "Allow authenticated read" ON classroom_supervisors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin insert" ON classroom_supervisors
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Allow admin delete" ON classroom_supervisors
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );
