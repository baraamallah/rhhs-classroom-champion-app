-- ============================================================================
-- 16_rollback_database_master.sql
-- Reversible Rollback Script for Migration 16 (Preserves all underlying data)
-- ============================================================================

-- 1. Drop SQL Views
DROP VIEW IF EXISTS v_monthly_division_standings;
DROP VIEW IF EXISTS v_live_classroom_leaderboard;

-- 2. Drop Triggers & Function
DROP TRIGGER IF EXISTS set_classrooms_updated_at ON classrooms;
DROP TRIGGER IF EXISTS set_checklist_items_updated_at ON checklist_items;
DROP FUNCTION IF EXISTS handle_updated_at();

-- 3. Drop Added Indexes
DROP INDEX IF EXISTS idx_evaluations_date_room_score;
DROP INDEX IF EXISTS idx_evaluations_classroom_date;
DROP INDEX IF EXISTS idx_evaluations_supervisor_date;
DROP INDEX IF EXISTS idx_classrooms_active_div_name;
DROP INDEX IF EXISTS idx_users_active_role_name;
DROP INDEX IF EXISTS idx_monthly_winners_date_div;
DROP INDEX IF EXISTS idx_monthly_winners_classroom;
DROP INDEX IF EXISTS idx_checklist_active_order;
DROP INDEX IF EXISTS idx_classroom_supervisors_comp;
DROP INDEX IF EXISTS idx_checklist_assignments_comp;
DROP INDEX IF EXISTS idx_system_settings_key;
DROP INDEX IF EXISTS idx_archive_evaluations_date;
DROP INDEX IF EXISTS idx_archive_evaluations_room;
DROP INDEX IF EXISTS idx_academic_archives_year_date;
DROP INDEX IF EXISTS idx_academic_archive_eval_comp;
DROP INDEX IF EXISTS idx_classrooms_trgm_name;
DROP INDEX IF EXISTS idx_users_trgm_name;
DROP INDEX IF EXISTS idx_users_trgm_email;

SELECT 'Rollback completed successfully. All underlying tables and data remain 100% intact.' AS status;
