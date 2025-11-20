-- 01_tables.sql
-- Defines the schema for multiple supervisor assignments

-- 1. Checklist Item Assignments Junction Table
CREATE TABLE IF NOT EXISTS checklist_item_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_item_id UUID REFERENCES checklist_items(id) ON DELETE CASCADE,
  supervisor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(checklist_item_id, supervisor_id)
);

-- 2. Classroom Supervisors Junction Table
CREATE TABLE IF NOT EXISTS classroom_supervisors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  supervisor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(classroom_id, supervisor_id)
);
