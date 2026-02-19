-- ============================================================================
-- 01_schema.sql
-- Core Database Schema
-- ============================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'supervisor' CHECK (role IN ('super_admin', 'admin', 'supervisor', 'viewer', 'stats')),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  last_login_at timestamp with time zone
);

-- Classrooms table
CREATE TABLE IF NOT EXISTS classrooms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  grade text NOT NULL,
  division text CHECK (division IN ('High School', 'Intermediate', 'Kindergarten', 'Preschool')),
  description text,
  supervisor_id uuid REFERENCES users(id) ON DELETE SET NULL, -- Deprecated in favor of junction table, kept for backward compatibility
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

COMMENT ON COLUMN classrooms.division IS 'The school division the classroom belongs to (High School, Intermediate, Kindergarten, Preschool)';

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

-- Checklist Item Assignments Junction Table
CREATE TABLE IF NOT EXISTS checklist_item_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_item_id UUID REFERENCES checklist_items(id) ON DELETE CASCADE,
  supervisor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(checklist_item_id, supervisor_id)
);

-- Classroom Supervisors Junction Table
CREATE TABLE IF NOT EXISTS classroom_supervisors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  supervisor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(classroom_id, supervisor_id)
);

-- 3. Create Indexes

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_classrooms_supervisor ON classrooms(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_is_active ON classrooms(is_active);
CREATE INDEX IF NOT EXISTS idx_classrooms_division ON classrooms(division);

CREATE INDEX IF NOT EXISTS idx_checklist_category ON checklist_items(category);
CREATE INDEX IF NOT EXISTS idx_checklist_order ON checklist_items(display_order);
CREATE INDEX IF NOT EXISTS idx_checklist_is_active ON checklist_items(is_active);

CREATE INDEX IF NOT EXISTS idx_evaluations_classroom ON evaluations(classroom_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_supervisor ON evaluations(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON evaluations(evaluation_date);

CREATE INDEX IF NOT EXISTS idx_checklist_assignments_supervisor ON checklist_item_assignments(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_classroom_supervisors_supervisor ON classroom_supervisors(supervisor_id);

-- 4. Archive Tables

-- Archive evaluations table
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

-- Archive classrooms table
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
