-- Enable public read access for leaderboards and evaluations
-- This allows guests to view the home page without authentication
-- Write operations remain restricted to authenticated users

-- 1. CLASSROOMS - Allow public read, restrict writes to admins
DROP POLICY IF EXISTS "Allow public read classrooms" ON classrooms;
CREATE POLICY "Allow public read classrooms" ON classrooms
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated read classrooms" ON classrooms;
DROP POLICY IF EXISTS "Allow admin write classrooms" ON classrooms;
CREATE POLICY "Allow admin write classrooms" ON classrooms
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- 2. EVALUATIONS - Allow public read, restrict writes to supervisors/admins
DROP POLICY IF EXISTS "Allow public read evaluations" ON evaluations;
CREATE POLICY "Allow public read evaluations" ON evaluations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated read evaluations" ON evaluations;
DROP POLICY IF EXISTS "Allow supervisor write evaluations" ON evaluations;
CREATE POLICY "Allow supervisor write evaluations" ON evaluations
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('supervisor', 'admin', 'super_admin')
    )
  );

-- 3. USERS - Keep read access for authenticated only (for privacy)
-- Authenticated users need to read users table for supervisor selection
DROP POLICY IF EXISTS "Allow public read users" ON users;
DROP POLICY IF EXISTS "Allow anon read users" ON users;
DROP POLICY IF EXISTS "Allow authenticated read users" ON users;
CREATE POLICY "Allow authenticated read users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin-only write policies for users
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

-- 4. CHECKLIST_ITEMS - Keep authenticated read, admin write
DROP POLICY IF EXISTS "Allow public read checklist_items" ON checklist_items;
DROP POLICY IF EXISTS "Allow anon read checklist_items" ON checklist_items;
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

-- 5. Junction tables remain as configured (authenticated read, admin write)
-- These are already set up correctly from previous scripts
