-- Secure all tables with proper RLS policies
-- This removes overly permissive "anon" policies and adds proper authenticated/admin policies

-- 1. USERS TABLE
-- Drop overly permissive anon policies
DROP POLICY IF EXISTS "Allow anon insert users" ON users;
DROP POLICY IF EXISTS "Allow anon read users" ON users;
DROP POLICY IF EXISTS "Allow anon update users" ON users;

-- Keep authenticated read (already exists)
-- Add admin-only write policies
DROP POLICY IF EXISTS "Allow admin insert users" ON users;
CREATE POLICY "Allow admin insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Allow admin update users" ON users;
CREATE POLICY "Allow admin update users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- 2. CLASSROOMS TABLE
-- Drop overly permissive anon policies
DROP POLICY IF EXISTS "Allow anon insert classrooms" ON classrooms;
DROP POLICY IF EXISTS "Allow anon read classrooms" ON classrooms;
DROP POLICY IF EXISTS "Allow anon update classrooms" ON classrooms;

-- Add proper policies
DROP POLICY IF EXISTS "Allow authenticated read classrooms" ON classrooms;
CREATE POLICY "Allow authenticated read classrooms" ON classrooms
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin write classrooms" ON classrooms;
CREATE POLICY "Allow admin write classrooms" ON classrooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- 3. CHECKLIST_ITEMS TABLE
-- Drop overly permissive anon policies
DROP POLICY IF EXISTS "Allow anon insert checklist_items" ON checklist_items;
DROP POLICY IF EXISTS "Allow anon read checklist_items" ON checklist_items;
DROP POLICY IF EXISTS "Allow anon update checklist_items" ON checklist_items;

-- Add proper policies
DROP POLICY IF EXISTS "Allow authenticated read checklist_items" ON checklist_items;
CREATE POLICY "Allow authenticated read checklist_items" ON checklist_items
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin write checklist_items" ON checklist_items;
CREATE POLICY "Allow admin write checklist_items" ON checklist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- 4. EVALUATIONS TABLE
-- Drop overly permissive anon policies
DROP POLICY IF EXISTS "Allow anon delete evaluations" ON evaluations;
DROP POLICY IF EXISTS "Allow anon insert evaluations" ON evaluations;
DROP POLICY IF EXISTS "Allow anon read evaluations" ON evaluations;

-- Add proper policies
DROP POLICY IF EXISTS "Allow authenticated read evaluations" ON evaluations;
CREATE POLICY "Allow authenticated read evaluations" ON evaluations
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow supervisor write evaluations" ON evaluations;
CREATE POLICY "Allow supervisor write evaluations" ON evaluations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('supervisor', 'admin', 'super_admin')
    )
  );
