-- ============================================================================
-- ECO Club - Data Management Script
-- ============================================================================
-- This script handles:
-- 1. Archive existing data and reset tables (keeps schema intact)
-- 2. Delete specific evaluations
-- 3. Delete specific classrooms
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE ARCHIVE TABLES (run once)
-- ============================================================================
-- These tables will store historical data while resetting the main tables

CREATE TABLE IF NOT EXISTS archive_evaluations AS SELECT * FROM evaluations WHERE FALSE;
CREATE TABLE IF NOT EXISTS archive_classrooms AS SELECT * FROM classrooms WHERE FALSE;

-- ============================================================================
-- STEP 2: ARCHIVE ALL DATA & RESET (uncomment to use)
-- ============================================================================
-- This moves all current data to archive tables and resets the main tables

-- BEGIN;
-- 
-- -- Archive evaluations
-- INSERT INTO archive_evaluations SELECT * FROM evaluations;
-- DELETE FROM evaluations;
-- 
-- -- Archive classrooms
-- INSERT INTO archive_classrooms SELECT * FROM classrooms;
-- DELETE FROM classrooms;
-- 
-- -- Verify counts
-- SELECT 'Evaluations archived:' as message, COUNT(*) FROM archive_evaluations
-- UNION ALL
-- SELECT 'Classrooms archived:', COUNT(*) FROM archive_classrooms;
-- 
-- COMMIT;

-- ============================================================================
-- STEP 3: DELETE SPECIFIC EVALUATION (uncomment and customize)
-- ============================================================================
-- Replace 'EVALUATION_ID_HERE' with the actual evaluation UUID

-- DELETE FROM evaluations WHERE id = 'EVALUATION_ID_HERE';
-- SELECT 'Evaluation deleted' as message;

-- ============================================================================
-- STEP 4: DELETE SPECIFIC CLASSROOM (uncomment and customize)
-- ============================================================================
-- This will CASCADE delete all evaluations for that classroom
-- Replace 'CLASSROOM_ID_HERE' with the actual classroom UUID

-- DELETE FROM classrooms WHERE id = 'CLASSROOM_ID_HERE';
-- SELECT 'Classroom and related evaluations deleted' as message;

-- ============================================================================
-- STEP 5: VIEW ARCHIVE DATA (for reference)
-- ============================================================================
-- Check what data was archived

-- SELECT 'Archived Evaluations' as type, COUNT(*) as count FROM archive_evaluations
-- UNION ALL
-- SELECT 'Archived Classrooms', COUNT(*) FROM archive_classrooms;
