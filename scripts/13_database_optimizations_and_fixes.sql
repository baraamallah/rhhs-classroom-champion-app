-- ============================================================================
-- 13_database_optimizations_and_fixes.sql
-- Production Performance Indexes, Integrity Constraints & Setting Fixes
-- ============================================================================

-- 1. FIX SYSTEM SETTINGS NULL CONSTRAINT
-- Allows setting values to be null (e.g. resetting winners_display_month to current)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'value' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE system_settings ALTER COLUMN value DROP NOT NULL;
  END IF;
END $$;


-- 2. HIGH-PERFORMANCE LEADERBOARD & EVALUATION INDEXES
-- Optimizes getEvaluationsByDateRange and cumulative leaderboard queries
CREATE INDEX IF NOT EXISTS idx_evaluations_date_classroom ON evaluations(evaluation_date DESC, classroom_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_classroom_score ON evaluations(classroom_id, total_score);
CREATE INDEX IF NOT EXISTS idx_evaluations_supervisor_date ON evaluations(supervisor_id, evaluation_date DESC);

-- Archive table indexes for fast audit and export queries
CREATE INDEX IF NOT EXISTS idx_archive_evaluations_date ON archive_evaluations(evaluation_date DESC);
CREATE INDEX IF NOT EXISTS idx_archive_evaluations_classroom ON archive_evaluations(classroom_id);
CREATE INDEX IF NOT EXISTS idx_archive_classrooms_division ON archive_classrooms(division);


-- 3. MONTHLY WINNERS & HALL OF FAME INDEXES
-- Accelerates monthly champions retrieval and win counts
CREATE INDEX IF NOT EXISTS idx_monthly_winners_lookup ON monthly_winners(year DESC, month DESC, division);
CREATE INDEX IF NOT EXISTS idx_monthly_winners_classroom ON monthly_winners(classroom_id);
CREATE INDEX IF NOT EXISTS idx_monthly_winners_division ON monthly_winners(division);


-- 4. CLASSROOMS & CHECKLIST FILTERING INDEXES
-- Accelerates active classroom listings and sorted checklist items
CREATE INDEX IF NOT EXISTS idx_classrooms_active_division ON classrooms(is_active, division, name);
CREATE INDEX IF NOT EXISTS idx_checklist_items_active_order ON checklist_items(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_users_active_role ON users(is_active, role);


-- 5. DIVISION CONSTRAINT ALIGNMENT
-- Ensures all 5 school divisions are recognized with data integrity
DO $$
BEGIN
  -- Drop existing division check if present
  ALTER TABLE classrooms DROP CONSTRAINT IF EXISTS classrooms_division_check;
  
  -- Re-add check constraint supporting all 5 official RHHS divisions
  ALTER TABLE classrooms ADD CONSTRAINT classrooms_division_check 
    CHECK (division IS NULL OR division IN (
      'Pre-School',
      'Elementary',
      'Middle School',
      'High School',
      'Technical Institute'
    ));
END $$;


-- 6. AUDIT & SETTINGS INDEXES
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_classroom_supervisors_comp ON classroom_supervisors(classroom_id, supervisor_id);
CREATE INDEX IF NOT EXISTS idx_checklist_item_assignments_comp ON checklist_item_assignments(checklist_item_id, supervisor_id);

-- Success verification notice
SELECT 'Database optimizations and constraints applied successfully!' AS status;
