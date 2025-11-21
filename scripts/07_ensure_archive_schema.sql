-- ============================================================================
-- 07_ensure_archive_schema.sql
-- Comprehensive fix for archive tables, columns, and permissions
-- ============================================================================

-- 1. Ensure Archive Tables Exist
CREATE TABLE IF NOT EXISTS archive_evaluations (
  id uuid PRIMARY KEY,
  classroom_id uuid,
  supervisor_id uuid,
  evaluation_date timestamp with time zone,
  items jsonb,
  total_score integer,
  max_score integer,
  notes text,
  created_at timestamp with time zone,
  archived_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS archive_classrooms (
  id uuid PRIMARY KEY,
  name text,
  grade text,
  division text,
  description text,
  supervisor_id uuid,
  is_active boolean,
  created_at timestamp with time zone,
  archived_at timestamp with time zone DEFAULT now()
);

-- 2. Ensure 'archived_at' column exists (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archive_evaluations' AND column_name = 'archived_at') THEN
        ALTER TABLE archive_evaluations ADD COLUMN archived_at timestamp with time zone DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archive_classrooms' AND column_name = 'archived_at') THEN
        ALTER TABLE archive_classrooms ADD COLUMN archived_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE archive_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_classrooms ENABLE ROW LEVEL SECURITY;

-- 4. Fix Permissions (Grant all to service_role, specific to authenticated)
-- Note: We are using service_role (admin client) in the actions now, so RLS is bypassed for those actions.
-- However, it's good practice to have these policies for any client-side access if needed.

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Allow admin insert" ON archive_evaluations;
DROP POLICY IF EXISTS "Allow admin read" ON archive_evaluations;
DROP POLICY IF EXISTS "Allow admin insert" ON archive_classrooms;
DROP POLICY IF EXISTS "Allow admin read" ON archive_classrooms;

-- Re-create policies
CREATE POLICY "Allow admin insert" ON archive_evaluations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Allow admin read" ON archive_evaluations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Allow admin insert" ON archive_classrooms
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Allow admin read" ON archive_classrooms
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

SELECT 'Archive schema and permissions fully ensured' as status;
