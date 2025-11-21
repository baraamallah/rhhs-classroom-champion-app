-- ============================================================================
-- 03_seed.sql
-- Initial Data Seeding
-- ============================================================================

-- 1. Insert Default Checklist Items
INSERT INTO checklist_items (title, description, points, category, display_order) VALUES
  ('Lights Off', 'All lights turned off when not needed', 15, 'energy', 1),
  ('Windows Closed', 'Windows properly closed', 10, 'energy', 2),
  ('Waste Sorted', 'Waste properly sorted into bins', 20, 'waste', 3),
  ('No Litter', 'No litter on floor or surfaces', 15, 'waste', 4),
  ('Desks Clean', 'All desks clean and organized', 10, 'cleanliness', 5),
  ('Floor Clean', 'Floor clean and free of debris', 10, 'cleanliness', 6),
  ('Recycling Bins Used', 'Recycling bins properly used', 15, 'waste', 7),
  ('Plants Watered', 'Classroom plants properly maintained', 5, 'environment', 8),
  ('Air Quality Good', 'Good ventilation and air quality', 10, 'environment', 9),
  ('Energy Efficient', 'Energy-efficient practices followed', 20, 'energy', 10)
ON CONFLICT DO NOTHING;

-- 2. Create Admin User
-- Creates or updates the main admin user
INSERT INTO users (email, password_hash, name, role, is_active)
VALUES (
  'baraa.elmallah@gmail.com',
  crypt('admin123', gen_salt('bf')),
  'Baraa Elmallah',
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE
SET 
  password_hash = EXCLUDED.password_hash,
  is_active = true,
  role = 'admin';

-- 3. Create Test User (Optional)
INSERT INTO users (email, password_hash, name, role, is_active)
VALUES (
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  'Test Supervisor',
  'supervisor',
  true
)
ON CONFLICT (email) DO NOTHING;
