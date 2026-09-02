-- ============================================================================
-- 15_fix_evaluations_and_public_read_permissions.sql
-- Ensure evaluations, classrooms, and archives are readable by public and authenticated clients
-- ============================================================================

-- 1. Ensure public read access for live competition display & leaderboard
ALTER TABLE IF EXISTS evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access for all users" ON evaluations;
DROP POLICY IF EXISTS "Allow public read on evaluations" ON evaluations;
CREATE POLICY "Allow public read on evaluations" ON evaluations
  FOR SELECT USING (true);

ALTER TABLE IF EXISTS classrooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access for all users" ON classrooms;
DROP POLICY IF EXISTS "Allow public read on classrooms" ON classrooms;
CREATE POLICY "Allow public read on classrooms" ON classrooms
  FOR SELECT USING (true);

ALTER TABLE IF EXISTS checklist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access for all users" ON checklist_items;
DROP POLICY IF EXISTS "Allow public read on checklist_items" ON checklist_items;
CREATE POLICY "Allow public read on checklist_items" ON checklist_items
  FOR SELECT USING (true);

ALTER TABLE IF EXISTS monthly_winners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on monthly_winners" ON monthly_winners;
CREATE POLICY "Allow public read on monthly_winners" ON monthly_winners
  FOR SELECT USING (true);

ALTER TABLE IF EXISTS archive_evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on archive_evaluations" ON archive_evaluations;
CREATE POLICY "Allow public read on archive_evaluations" ON archive_evaluations
  FOR SELECT USING (true);

ALTER TABLE IF EXISTS archive_classrooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on archive_classrooms" ON archive_classrooms;
CREATE POLICY "Allow public read on archive_classrooms" ON archive_classrooms
  FOR SELECT USING (true);

ALTER TABLE IF EXISTS system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on system_settings" ON system_settings;
CREATE POLICY "Allow public read on system_settings" ON system_settings
  FOR SELECT USING (true);

-- 2. Grant Table Permissions to anon and authenticated roles
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

SELECT 'RLS permissions for evaluations and leaderboard successfully updated!' AS status;
