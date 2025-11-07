-- ============================================================================
-- ECO Club - Complete Fresh Database Setup
-- ============================================================================
-- This is the ONE script to set up everything for the ECO Club application
-- Run this in your Supabase SQL Editor to get a clean, working database

-- ============================================================================
-- STEP 1: ENABLE EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 2: DROP EXISTING TABLES (for clean slate)
-- ============================================================================
-- Uncomment these lines if you want to start completely fresh
-- DROP TABLE IF EXISTS evaluations CASCADE;
-- DROP TABLE IF EXISTS checklist_items CASCADE;
-- DROP TABLE IF EXISTS classrooms CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- STEP 3: CREATE TABLES
-- ============================================================================

-- Users table - simple and clean
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'supervisor' CHECK (role IN ('super_admin', 'admin', 'supervisor')),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Classrooms table
CREATE TABLE IF NOT EXISTS classrooms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  grade text NOT NULL,
  description text,
  supervisor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Checklist items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  points integer DEFAULT 10,
  category text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  supervisor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  evaluation_date timestamp with time zone DEFAULT now(),
  items jsonb NOT NULL,
  total_score integer NOT NULL,
  max_score integer NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- STEP 4: CREATE INDEXES (for performance)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_classrooms_supervisor ON classrooms(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_is_active ON classrooms(is_active);

CREATE INDEX IF NOT EXISTS idx_checklist_category ON checklist_items(category);
CREATE INDEX IF NOT EXISTS idx_checklist_order ON checklist_items(display_order);
CREATE INDEX IF NOT EXISTS idx_checklist_is_active ON checklist_items(is_active);

CREATE INDEX IF NOT EXISTS idx_evaluations_classroom ON evaluations(classroom_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_supervisor ON evaluations(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON evaluations(evaluation_date);

-- ============================================================================
-- STEP 5: CREATE PASSWORD FUNCTIONS
-- ============================================================================

-- Function to hash passwords (simplified to plain text for easy debugging)
CREATE OR REPLACE FUNCTION hash_password(input_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN input_password;
END;
$$;

-- Function to verify passwords (simplified to plain text comparison)
CREATE OR REPLACE FUNCTION verify_password(input_password text, stored_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN input_password = stored_hash;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION hash_password(text) TO authenticated;
GRANT EXECUTE ON FUNCTION hash_password(text) TO anon;
GRANT EXECUTE ON FUNCTION verify_password(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_password(text, text) TO anon;

-- ============================================================================
-- STEP 6: INSERT SAMPLE DATA
-- ============================================================================

-- Insert default checklist items
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


-- Insert the first admin user
INSERT INTO users (email, password_hash, name, role) VALUES (
  'admin@school.com',
  'AdminPassword123!',
  'Super Admin',
  'super_admin'
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- ============================================================================
-- STEP 7: VERIFY SETUP
-- ============================================================================

-- Check that everything was created successfully
SELECT 'Setup Complete!' as status;

-- Show table counts
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'classrooms', COUNT(*) FROM classrooms
UNION ALL
SELECT 'checklist_items', COUNT(*) FROM checklist_items
UNION ALL
SELECT 'evaluations', COUNT(*) FROM evaluations;
