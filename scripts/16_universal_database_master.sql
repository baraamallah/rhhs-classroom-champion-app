-- ============================================================================
-- 16_universal_database_master.sql
-- Production-Grade Database Master Migration (100% Non-Destructive / Zero Data Loss)
-- ============================================================================

-- 1. EXTENSIONS (Installed in standard extensions schema)
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA extensions;

-- Move to extensions schema if they were created in public
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension e JOIN pg_namespace n ON e.extnamespace = n.oid WHERE e.extname = 'pg_trgm' AND n.nspname = 'public') THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_extension e JOIN pg_namespace n ON e.extnamespace = n.oid WHERE e.extname = 'uuid-ossp' AND n.nspname = 'public') THEN
    ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_extension e JOIN pg_namespace n ON e.extnamespace = n.oid WHERE e.extname = 'pgcrypto' AND n.nspname = 'public') THEN
    ALTER EXTENSION pgcrypto SET SCHEMA extensions;
  END IF;
END $$;


-- 2. SAFE SCHEMA ALIGNMENTS (ZERO DESTRUCTION)

-- Ensure system_settings allows NULL values for default reset
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'value' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE system_settings ALTER COLUMN value DROP NOT NULL;
  END IF;
END $$;

-- Align division check constraints with all 5 official RHHS divisions
DO $$
BEGIN
  ALTER TABLE classrooms DROP CONSTRAINT IF EXISTS classrooms_division_check;
  ALTER TABLE classrooms ADD CONSTRAINT classrooms_division_check 
    CHECK (division IS NULL OR division IN (
      'Pre-School',
      'Elementary',
      'Middle School',
      'High School',
      'Technical Institute'
    ));
END $$;


-- 3. QUERY-DRIVEN COMPOSITE B-TREE INDEXES

-- Evaluations Table: Core Workhorse
-- Speeds up date range filtering and score aggregations for leaderboard & tracking
CREATE INDEX IF NOT EXISTS idx_evaluations_date_room_score 
  ON evaluations(evaluation_date DESC, classroom_id, total_score);

-- Speeds up individual classroom history lookups
CREATE INDEX IF NOT EXISTS idx_evaluations_classroom_date 
  ON evaluations(classroom_id, evaluation_date DESC);

-- Speeds up supervisor inspection history queries
CREATE INDEX IF NOT EXISTS idx_evaluations_supervisor_date 
  ON evaluations(supervisor_id, evaluation_date DESC);

-- Classrooms Table: Active status & division ordering
CREATE INDEX IF NOT EXISTS idx_classrooms_active_div_name 
  ON classrooms(is_active, division, name);

-- Users Table: Active status & role filtering
CREATE INDEX IF NOT EXISTS idx_users_active_role_name 
  ON users(is_active, role, name);

-- Monthly Winners Table: Fast year/month/division champion lookups
CREATE INDEX IF NOT EXISTS idx_monthly_winners_date_div 
  ON monthly_winners(year DESC, month DESC, division);
CREATE INDEX IF NOT EXISTS idx_monthly_winners_classroom 
  ON monthly_winners(classroom_id);

-- Checklist Items Table: Active display order
CREATE INDEX IF NOT EXISTS idx_checklist_active_order 
  ON checklist_items(is_active, display_order);

-- Junction Tables (Covering Indexes)
CREATE INDEX IF NOT EXISTS idx_classroom_supervisors_comp 
  ON classroom_supervisors(supervisor_id, classroom_id);
CREATE INDEX IF NOT EXISTS idx_checklist_assignments_comp 
  ON checklist_item_assignments(supervisor_id, checklist_item_id);

-- System Settings
CREATE INDEX IF NOT EXISTS idx_system_settings_key 
  ON system_settings(key);

-- Archive Tables (Audit & History)
CREATE INDEX IF NOT EXISTS idx_archive_evaluations_date 
  ON archive_evaluations(evaluation_date DESC);
CREATE INDEX IF NOT EXISTS idx_archive_evaluations_room 
  ON archive_evaluations(classroom_id);
CREATE INDEX IF NOT EXISTS idx_academic_archives_year_date 
  ON academic_archives(archived_at DESC, academic_year);
CREATE INDEX IF NOT EXISTS idx_academic_archive_eval_comp 
  ON academic_archive_evaluations(archive_id, classroom_division, evaluation_date DESC);


-- 4. INDEPENDENT GIN TRIGRAM INDEXES (Instant Substring Fuzzy Search)

CREATE INDEX IF NOT EXISTS idx_classrooms_trgm_name 
  ON classrooms USING gin (name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_trgm_name 
  ON users USING gin (name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_trgm_email 
  ON users USING gin (email extensions.gin_trgm_ops);


-- 5. SERVER-SIDE SQL AGGREGATION VIEWS (WITH SECURITY INVOKER)

-- View 1: Live Classroom Leaderboard (Real-time score & percentage calculations)
CREATE OR REPLACE VIEW v_live_classroom_leaderboard 
WITH (security_invoker = true) AS
SELECT 
  c.id AS classroom_id,
  c.name AS classroom_name,
  c.grade AS classroom_grade,
  c.division AS classroom_division,
  c.is_active,
  COUNT(e.id)::integer AS total_evaluations,
  COALESCE(SUM(e.total_score), 0)::integer AS total_score,
  COALESCE(SUM(e.max_score), 0)::integer AS total_max_score,
  CASE 
    WHEN COUNT(e.id) > 0 AND SUM(e.max_score) > 0 
    THEN ROUND((SUM(e.total_score)::numeric / SUM(e.max_score)::numeric) * 100)::integer
    ELSE 0 
  END AS average_score_pct,
  MAX(e.evaluation_date) AS last_evaluated_at
FROM classrooms c
LEFT JOIN evaluations e ON e.classroom_id = c.id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.grade, c.division, c.is_active;

-- View 2: Monthly Division Standings (Pre-grouped by year, month, division)
CREATE OR REPLACE VIEW v_monthly_division_standings 
WITH (security_invoker = true) AS
SELECT 
  c.id AS classroom_id,
  c.name AS classroom_name,
  c.grade AS classroom_grade,
  c.division AS classroom_division,
  EXTRACT(YEAR FROM e.evaluation_date)::integer AS eval_year,
  EXTRACT(MONTH FROM e.evaluation_date)::integer AS eval_month,
  COUNT(e.id)::integer AS monthly_evaluations,
  COALESCE(SUM(e.total_score), 0)::integer AS monthly_score,
  COALESCE(SUM(e.max_score), 0)::integer AS monthly_max_score,
  CASE 
    WHEN COUNT(e.id) > 0 AND SUM(e.max_score) > 0 
    THEN ROUND((SUM(e.total_score)::numeric / SUM(e.max_score)::numeric) * 100)::integer
    ELSE 0 
  END AS monthly_average_pct
FROM classrooms c
INNER JOIN evaluations e ON e.classroom_id = c.id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.grade, c.division, EXTRACT(YEAR FROM e.evaluation_date), EXTRACT(MONTH FROM e.evaluation_date);


-- 6. AUTOMATED TIMESTAMP AUDIT TRIGGER (Explicit Search Path & Security Invoker)

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at columns if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classrooms' AND column_name = 'updated_at') THEN
    ALTER TABLE classrooms ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checklist_items' AND column_name = 'updated_at') THEN
    ALTER TABLE checklist_items ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_classrooms_updated_at ON classrooms;
CREATE TRIGGER set_classrooms_updated_at
  BEFORE UPDATE ON classrooms
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_checklist_items_updated_at ON checklist_items;
CREATE TRIGGER set_checklist_items_updated_at
  BEFORE UPDATE ON checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();


-- 7. AUDITED ROW LEVEL SECURITY (RLS) POLICIES

-- Ensure RLS is active on all tables in public schema
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS checklist_item_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS classroom_supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS monthly_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS archive_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS archive_classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS academic_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS academic_archive_evaluations ENABLE ROW LEVEL SECURITY;

-- Transparent Public Read (Leaderboards, Statistics, Archives, UI Data)
DROP POLICY IF EXISTS "Allow public read on users" ON users;
CREATE POLICY "Allow public read on users" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on evaluations" ON evaluations;
CREATE POLICY "Allow public read on evaluations" ON evaluations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on classrooms" ON classrooms;
CREATE POLICY "Allow public read on classrooms" ON classrooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on checklist_items" ON checklist_items;
CREATE POLICY "Allow public read on checklist_items" ON checklist_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on checklist_item_assignments" ON checklist_item_assignments;
CREATE POLICY "Allow public read on checklist_item_assignments" ON checklist_item_assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on classroom_supervisors" ON classroom_supervisors;
CREATE POLICY "Allow public read on classroom_supervisors" ON classroom_supervisors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on monthly_winners" ON monthly_winners;
CREATE POLICY "Allow public read on monthly_winners" ON monthly_winners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on archive_evaluations" ON archive_evaluations;
CREATE POLICY "Allow public read on archive_evaluations" ON archive_evaluations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on archive_classrooms" ON archive_classrooms;
CREATE POLICY "Allow public read on archive_classrooms" ON archive_classrooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on system_settings" ON system_settings;
CREATE POLICY "Allow public read on system_settings" ON system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on academic_archives" ON academic_archives;
CREATE POLICY "Allow public read on academic_archives" ON academic_archives FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on academic_archive_evaluations" ON academic_archive_evaluations;
CREATE POLICY "Allow public read on academic_archive_evaluations" ON academic_archive_evaluations FOR SELECT USING (true);

-- Permissions grant
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Verification notice
SELECT 'Universal Production Database Master Migration Applied Successfully!' AS status;
