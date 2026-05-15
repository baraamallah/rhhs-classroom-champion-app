-- RHHS Eco Champion - Database Schema and Calculations

-- This file describes the database structure and provides example queries for calculations.

-- 1. TABLES

-- Users Table
-- Stores all users including admins, supervisors, and viewers.
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'supervisor', 'viewer', 'stats')),
  password_hash TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Classrooms Table
-- Stores information about classrooms.
CREATE TABLE public.classrooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  division TEXT CHECK (division IN ('Pre-School', 'Elementary', 'Middle School', 'High School', 'Technical Institute')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Checklist Items Table
-- Stores the criteria for evaluations.
CREATE TABLE public.checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Evaluations Table
-- Stores the results of classroom evaluations.
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
  supervisor_id UUID REFERENCES public.users(id),
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  items JSONB NOT NULL, -- Map of checklist_item_id to boolean
  total_score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Monthly Winners Table
-- Stores the declared winners for each month/division.
CREATE TABLE public.monthly_winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID REFERENCES public.classrooms(id),
  division TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  average_score NUMERIC NOT NULL,
  evaluation_count INTEGER NOT NULL,
  declared_by UUID REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CALCULATIONS

-- Calculate Leaderboard for a Specific Month
-- This query sums the points for each classroom within a date range.
-- Replace '2024-05-01' and '2024-05-31' with the desired month's range.
SELECT
    c.id,
    c.name,
    c.grade,
    c.division,
    SUM(e.total_score) as total_points,
    COUNT(e.id) as evaluation_count,
    ROUND(AVG(e.total_score), 1) as average_score
FROM
    public.classrooms c
LEFT JOIN
    public.evaluations e ON c.id = e.classroom_id
WHERE
    e.evaluation_date BETWEEN '2024-05-01' AND '2024-05-31'
    AND c.is_active = true
GROUP BY
    c.id
ORDER BY
    total_points DESC;

-- Get Monthly Winner with Classroom Details
SELECT
    mw.*,
    c.name as classroom_name,
    c.grade as classroom_grade
FROM
    public.monthly_winners mw
JOIN
    public.classrooms c ON mw.classroom_id = c.id
WHERE
    mw.year = 2024 AND mw.month = 5;

-- Calculate Supervisor Activity
SELECT
    u.name,
    COUNT(e.id) as evaluations_submitted
FROM
    public.users u
JOIN
    public.evaluations e ON u.id = e.supervisor_id
GROUP BY
    u.id
ORDER BY
    evaluations_submitted DESC;
