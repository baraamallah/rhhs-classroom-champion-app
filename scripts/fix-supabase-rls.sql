-- ============================================================================
-- Fix RLS Policies for ECO Club App
-- ============================================================================
-- Run this in Supabase SQL Editor to allow data access

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow anon read users" ON users;
DROP POLICY IF EXISTS "Allow anon read classrooms" ON classrooms;
DROP POLICY IF EXISTS "Allow anon read checklist_items" ON checklist_items;
DROP POLICY IF EXISTS "Allow anon read evaluations" ON evaluations;
DROP POLICY IF EXISTS "Allow anon insert evaluations" ON evaluations;
DROP POLICY IF EXISTS "Allow anon delete evaluations" ON evaluations;
DROP POLICY IF EXISTS "Allow anon insert classrooms" ON classrooms;
DROP POLICY IF EXISTS "Allow anon update classrooms" ON classrooms;
DROP POLICY IF EXISTS "Allow anon delete classrooms" ON classrooms;
DROP POLICY IF EXISTS "Allow anon insert checklist_items" ON checklist_items;
DROP POLICY IF EXISTS "Allow anon update checklist_items" ON checklist_items;
DROP POLICY IF EXISTS "Allow anon insert users" ON users;
DROP POLICY IF EXISTS "Allow anon update users" ON users;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Allow anon read users"
ON users FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon insert users"
ON users FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon update users"
ON users FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- ============================================================================
-- CLASSROOMS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Allow anon read classrooms"
ON classrooms FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon insert classrooms"
ON classrooms FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon update classrooms"
ON classrooms FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- ============================================================================
-- CHECKLIST_ITEMS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Allow anon read checklist_items"
ON checklist_items FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon insert checklist_items"
ON checklist_items FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon update checklist_items"
ON checklist_items FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- ============================================================================
-- EVALUATIONS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Allow anon read evaluations"
ON evaluations FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon insert evaluations"
ON evaluations FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon delete evaluations"
ON evaluations FOR DELETE
TO anon
USING (true);

-- ============================================================================
-- CLASSROOMS DELETE POLICY
-- ============================================================================
CREATE POLICY "Allow anon delete classrooms"
ON classrooms FOR DELETE
TO anon
USING (true);

-- ============================================================================
-- VERIFY POLICIES
-- ============================================================================
SELECT 'RLS Policies Created Successfully!' as status;

-- Show all policies
SELECT schemaname, tablename, policyname, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
