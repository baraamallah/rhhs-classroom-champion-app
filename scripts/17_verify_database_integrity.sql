-- ============================================================================
-- 17_verify_database_integrity.sql
-- Database Integrity Check & Performance Benchmarking Suite
-- ============================================================================

-- 1. ROW COUNT INTEGRITY VERIFICATION
SELECT 
  'classrooms' AS table_name, COUNT(*) AS row_count FROM classrooms
UNION ALL
SELECT 'evaluations', COUNT(*) FROM evaluations
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'checklist_items', COUNT(*) FROM checklist_items
UNION ALL
SELECT 'monthly_winners', COUNT(*) FROM monthly_winners
UNION ALL
SELECT 'classroom_supervisors', COUNT(*) FROM classroom_supervisors
UNION ALL
SELECT 'archive_evaluations', COUNT(*) FROM archive_evaluations
UNION ALL
SELECT 'academic_archives', COUNT(*) FROM academic_archives
UNION ALL
SELECT 'academic_archive_evaluations', COUNT(*) FROM academic_archive_evaluations
ORDER BY table_name;


-- 2. INDEX VALIDITY & HEALTH CHECK
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;


-- 3. BENCHMARK QUERIES WITH EXPLAIN (ANALYZE, BUFFERS)

-- Benchmark 1: Live Leaderboard View Scan
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM v_live_classroom_leaderboard
ORDER BY total_score DESC;

-- Benchmark 2: Date Range Filter on Evaluations (Uses idx_evaluations_date_room_score)
EXPLAIN (ANALYZE, BUFFERS)
SELECT classroom_id, SUM(total_score) AS total_score, COUNT(*) AS count
FROM evaluations
WHERE evaluation_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY classroom_id;

-- Benchmark 3: Trigram Search on Classrooms (Uses idx_classrooms_trgm_name)
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, grade, division
FROM classrooms
WHERE name ILIKE '%SE%' AND is_active = true;

-- Benchmark 4: Monthly Champions Lookup (Uses idx_monthly_winners_date_div)
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM monthly_winners
WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)::integer 
  AND month = EXTRACT(MONTH FROM CURRENT_DATE)::integer;
