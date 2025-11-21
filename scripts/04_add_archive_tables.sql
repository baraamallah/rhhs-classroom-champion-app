-- Add Archive Tables
-- Run this script to add the missing archive tables to your database

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

-- Verify creation
SELECT 'Archive tables created successfully' as status;
